"""Run the ColorCraft backend and frontend in one terminal."""

from __future__ import annotations

import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"


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

    raise RuntimeError(
        "No usable backend virtual environment was found.\n"
        "Create one with Python 3.11 and install the backend dependencies:\n\n"
        "  py -3.11 -m venv backend\\.venv311\n"
        "  .\\backend\\.venv311\\Scripts\\python.exe -m pip install "
        "-r backend\\requirements.txt"
    )


def find_corepack() -> str:
    executable = shutil.which("corepack.cmd") or shutil.which("corepack")
    if executable is None:
        raise RuntimeError(
            "Corepack was not found. Install Node.js 18 or newer, then try again."
        )
    return executable


def start_process(command: list[str], cwd: Path) -> subprocess.Popen[bytes]:
    options: dict[str, object] = {"cwd": cwd}
    if os.name == "nt":
        options["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        options["start_new_session"] = True
    return subprocess.Popen(command, **options)


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
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            capture_output=True,
            check=False,
        )
    else:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass


def main() -> int:
    try:
        backend_python = find_backend_python()
        corepack = find_corepack()
    except RuntimeError as error:
        print(f"ColorCraft could not start:\n{error}", file=sys.stderr)
        return 1

    print("Starting ColorCraft...")
    print("  Backend:  http://localhost:8000")
    print("  Frontend: http://localhost:5173")
    print("Press Ctrl+C to stop both services.\n")

    processes = [
        (
            "backend",
            start_process(
                [str(backend_python), "-u", "main.py"],
                BACKEND_DIR,
            ),
        ),
        (
            "frontend",
            start_process(
                [corepack, "pnpm@9.15.9", "dev"],
                FRONTEND_DIR,
            ),
        ),
    ]

    exit_code = 0
    try:
        while True:
            for name, process in processes:
                result = process.poll()
                if result is not None:
                    if result != 0:
                        print(
                            f"\nThe {name} service exited with code {result}.",
                            file=sys.stderr,
                        )
                        exit_code = result
                    return exit_code
            time.sleep(0.25)
    except KeyboardInterrupt:
        print("\nStopping ColorCraft...")
        return 0
    finally:
        for _, process in reversed(processes):
            stop_process(process)


if __name__ == "__main__":
    raise SystemExit(main())
