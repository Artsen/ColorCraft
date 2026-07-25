from __future__ import annotations

from check import validation_steps


def test_full_validation_plan_covers_every_layer():
    steps = validation_steps("python", "corepack")
    labels = [step.label for step in steps]
    assert labels == [
        "frontend format",
        "frontend lint",
        "frontend typecheck",
        "frontend coverage",
        "frontend build",
        "backend format",
        "backend lint",
        "backend typecheck",
        "backend tests and coverage",
        "browser E2E and accessibility",
    ]
    assert steps[-1].command[-1] == "test:e2e"


def test_fast_validation_plan_can_skip_browser_layer():
    labels = [
        step.label for step in validation_steps("python", "corepack", include_e2e=False)
    ]
    assert "browser E2E and accessibility" not in labels
