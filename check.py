"""Run ColorCraft's complete repository validation workflow."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"


@dataclass(frozen=True)
class CheckStep:
    label: str
    command: tuple[str, ...]
    cwd: Path


def validation_steps(
    python: str,
    corepack: str,
    *,
    include_e2e: bool = True,
) -> tuple[CheckStep, ...]:
    pnpm = (corepack, "pnpm@9.15.9")
    steps = [
        CheckStep("frontend format", (*pnpm, "format:check"), FRONTEND),
        CheckStep("frontend lint", (*pnpm, "lint"), FRONTEND),
        CheckStep("frontend typecheck", (*pnpm, "typecheck"), FRONTEND),
        CheckStep("frontend coverage", (*pnpm, "test:coverage"), FRONTEND),
        CheckStep("frontend build", (*pnpm, "build"), FRONTEND),
        CheckStep(
            "backend format",
            (
                python,
                "-m",
                "ruff",
                "format",
                "--check",
                "backend",
                "tests",
                "dev.py",
                "check.py",
            ),
            ROOT,
        ),
        CheckStep(
            "backend lint",
            (python, "-m", "ruff", "check", "backend", "tests", "dev.py", "check.py"),
            ROOT,
        ),
        CheckStep(
            "backend typecheck",
            (
                python,
                "-m",
                "mypy",
                "backend/config.py",
                "backend/models.py",
                "check.py",
            ),
            ROOT,
        ),
        CheckStep(
            "backend tests and coverage",
            (
                python,
                "-m",
                "pytest",
                "tests",
                "--cov=backend",
                "--cov=dev",
                "--cov-report=term-missing",
                "--cov-report=xml:.tmp/backend-coverage.xml",
            ),
            ROOT,
        ),
    ]
    if include_e2e:
        steps.append(
            CheckStep("browser E2E and accessibility", (*pnpm, "test:e2e"), FRONTEND)
        )
    return tuple(steps)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--skip-e2e",
        action="store_true",
        help="Run the fast validation layers without Playwright.",
    )
    arguments = parser.parse_args()
    corepack = shutil.which("corepack.cmd") or shutil.which("corepack")
    if not corepack:
        print("ColorCraft validation requires Corepack.", file=sys.stderr)
        return 1

    for index, step in enumerate(
        validation_steps(sys.executable, corepack, include_e2e=not arguments.skip_e2e),
        start=1,
    ):
        print(f"[{index}] {step.label}")
        result = subprocess.run(step.command, cwd=step.cwd, check=False)
        if result.returncode:
            print(f"Validation stopped: {step.label} failed.", file=sys.stderr)
            return result.returncode
    print("ColorCraft validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
