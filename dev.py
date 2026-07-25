"""Run the ColorCraft backend and frontend reliably in one terminal."""

from __future__ import annotations

import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Sequence
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
sys.path.insert(0, str(BACKEND_DIR))

from config import ConfigurationError, RuntimeSettings  # noqa: E402


class StartupError(RuntimeError):
    """Raised when development services cannot become ready."""


@dataclass(frozen=True)
class ProcessStep:
    label: str
    command: tuple[str, ...]
    cwd: Path


@dataclass(frozen=True)
class DevelopmentPlan:
    backend: ProcessStep
    frontend: ProcessStep

    @property
    def steps(self) -> tuple[ProcessStep, ProcessStep]:
        return (self.backend, self.frontend)


def python_candidates() -> list[Path]:
    if os.name == "nt":
        relative_paths = (
            Path(".venv311/Scripts/python.exe"),
            Path(".venv/Scripts/python.exe"),
            Path("venv/Scripts/python.exe"),
        )
    else:
        relative_paths = (
            Path(".venv311/bin/python"),
            Path(".venv/bin/python"),
            Path("venv/bin/python"),
        )

    candidates = [BACKEND_DIR / path for path in relative_paths]
    candidates.append(Path(sys.executable))
    return candidates


def find_backend_python() -> Path:
    for candidate in python_candidates():
        if not candidate.is_file():
            continue

        dependency_check = subprocess.run(
            [
                str(candidate),
                "-c",
                "import fastapi, numpy, PIL, sklearn, uvicorn",
            ],
            cwd=BACKEND_DIR,
            capture_output=True,
            check=False,
        )
        if dependency_check.returncode == 0:
            return candidate

    raise StartupError(
        "No usable backend virtual environment was found.\n"
        "Create one with Python 3.11 and install the backend dependencies:\n\n"
        "  py -3.11 -m venv backend\\.venv311\n"
        "  .\\backend\\.venv311\\Scripts\\python.exe -m pip install "
        "-r backend\\requirements-dev.txt"
    )


def find_corepack() -> str:
    executable = shutil.which("corepack.cmd") or shutil.which("corepack")
    if executable is None:
        raise StartupError(
            "Corepack was not found. Install Node.js 18 or newer, then try again."
        )
    return executable


def create_development_plan(
    settings: RuntimeSettings,
    *,
    backend_python: Path,
    corepack: str,
) -> DevelopmentPlan:
    return DevelopmentPlan(
        backend=ProcessStep(
            label="api",
            command=(
                str(backend_python),
                "-u",
                "-m",
                "uvicorn",
                "main:app",
                "--host",
                settings.api_host,
                "--port",
                str(settings.api_port),
            ),
            cwd=BACKEND_DIR,
        ),
        frontend=ProcessStep(
            label="web",
            command=(
                corepack,
                "pnpm@9.15.9",
                "dev",
                "--host",
                settings.web_host,
                "--port",
                str(settings.web_port),
            ),
            cwd=FRONTEND_DIR,
        ),
    )


def start_process(step: ProcessStep) -> subprocess.Popen[bytes]:
    options: dict[str, object] = {"cwd": step.cwd}
    if os.name == "nt":
        options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        options["start_new_session"] = True
    return subprocess.Popen(list(step.command), **options)


def windows_termination_command(process_id: int) -> tuple[str, ...]:
    return ("taskkill", "/PID", str(process_id), "/T", "/F")


def stop_process(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return

    try:
        if os.name == "nt":
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=5)
        return
    except (OSError, subprocess.TimeoutExpired):
        pass

    if os.name == "nt":
        subprocess.run(
            windows_termination_command(process.pid),
            capture_output=True,
            check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    else:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass


def ensure_port_available(host: str, port: int, *, label: str) -> None:
    flags = socket.AI_PASSIVE if host in {"0.0.0.0", "::"} else 0
    try:
        addresses = socket.getaddrinfo(
            host,
            port,
            type=socket.SOCK_STREAM,
            flags=flags,
        )
    except socket.gaierror as error:
        raise StartupError(f"{label} host {host!r} could not be resolved.") from error

    last_error: OSError | None = None
    for family, socktype, protocol, _, address in addresses:
        probe = socket.socket(family, socktype, protocol)
        try:
            probe.bind(address)
            return
        except OSError as error:
            last_error = error
        finally:
            probe.close()
    raise StartupError(
        f"{label} cannot start because {host}:{port} is unavailable"
        f"{f' ({last_error})' if last_error else ''}."
    )


def unexpected_exit_code(return_code: int | None) -> int:
    return return_code if return_code not in {None, 0} else 1


def check_child_failures(
    processes: Sequence[tuple[ProcessStep, subprocess.Popen[bytes]]],
) -> None:
    for step, process in processes:
        return_code = process.poll()
        if return_code is not None:
            raise StartupError(
                f"The {step.label} service exited before readiness "
                f"with code {return_code}."
            )


def readiness_url(settings: RuntimeSettings) -> str:
    return f"{settings.client_api_url}/ready"


def metadata_url(settings: RuntimeSettings) -> str:
    return f"{settings.client_api_url}/metadata"


def wait_for_readiness(
    settings: RuntimeSettings,
    processes: Sequence[tuple[ProcessStep, subprocess.Popen[bytes]]],
    *,
    open_url: Callable[..., object] = urlopen,
    monotonic: Callable[[], float] = time.monotonic,
    sleep: Callable[[float], None] = time.sleep,
) -> None:
    deadline = monotonic() + settings.readiness_timeout_seconds
    url = readiness_url(settings)
    last_error = "the readiness endpoint did not respond"

    while monotonic() < deadline:
        check_child_failures(processes)
        try:
            with open_url(url, timeout=0.75) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if response.status == 200 and payload.get("status") == "ready":
                    return
                last_error = f"readiness returned status {response.status}"
        except (
            HTTPError,
            URLError,
            OSError,
            TimeoutError,
            json.JSONDecodeError,
        ) as error:
            last_error = str(error)
        sleep(0.2)

    raise StartupError(
        f"ColorCraft did not become ready within "
        f"{settings.readiness_timeout_seconds} seconds: {last_error}."
    )


def run_dev_launcher(
    *,
    settings: RuntimeSettings | None = None,
    spawn_process: Callable[[ProcessStep], subprocess.Popen[bytes]] = start_process,
    readiness_waiter: Callable[
        [
            RuntimeSettings,
            Sequence[tuple[ProcessStep, subprocess.Popen[bytes]]],
        ],
        None,
    ] = wait_for_readiness,
    stop_child: Callable[[subprocess.Popen[bytes]], None] = stop_process,
) -> int:
    processes: list[tuple[ProcessStep, subprocess.Popen[bytes]]] = []

    try:
        runtime = settings or RuntimeSettings.from_env()
        backend_python = find_backend_python()
        corepack = find_corepack()
        plan = create_development_plan(
            runtime,
            backend_python=backend_python,
            corepack=corepack,
        )

        ensure_port_available(
            runtime.api_host, runtime.api_port, label="ColorCraft API"
        )
        ensure_port_available(
            runtime.web_host, runtime.web_port, label="ColorCraft web app"
        )

        print("Starting ColorCraft...")
        print(f"  Frontend:  {runtime.web_url}")
        print(f"  API:       {runtime.client_api_url}")
        print(f"  Health:    {runtime.client_api_url}/health")
        print(f"  Readiness: {readiness_url(runtime)}")
        print(f"  Metadata:  {metadata_url(runtime)}")
        print("Waiting for API readiness...")

        for step in plan.steps:
            try:
                processes.append((step, spawn_process(step)))
            except OSError as error:
                raise StartupError(
                    f"Failed to start the {step.label} service: {error}"
                ) from error

        readiness_waiter(runtime, processes)
        print("ColorCraft is ready. Press Ctrl+C to stop both services.\n")

        while True:
            for step, process in processes:
                return_code = process.poll()
                if return_code is not None:
                    print(
                        f"The {step.label} service exited unexpectedly "
                        f"with code {return_code}.",
                        file=sys.stderr,
                    )
                    return unexpected_exit_code(return_code)
            time.sleep(0.25)
    except KeyboardInterrupt:
        print("\nStopping ColorCraft...")
        return 0
    except (ConfigurationError, StartupError) as error:
        print(f"ColorCraft could not start:\n{error}", file=sys.stderr)
        return 1
    finally:
        for _, process in reversed(processes):
            stop_child(process)


def main() -> int:
    return run_dev_launcher()


if __name__ == "__main__":
    raise SystemExit(main())
