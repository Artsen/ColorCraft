from __future__ import annotations

from pathlib import Path

import pytest
from config import ConfigurationError, RuntimeSettings

from dev import (
    create_development_plan,
    metadata_url,
    readiness_url,
    unexpected_exit_code,
    wait_for_readiness,
    windows_termination_command,
)


def test_default_resolved_ports():
    settings = RuntimeSettings.from_env({})
    assert settings.web_host == "127.0.0.1"
    assert settings.web_port == 5174
    assert settings.api_host == "127.0.0.1"
    assert settings.api_port == 4100
    assert settings.allowed_origins == ("http://127.0.0.1:5174",)
    assert readiness_url(settings) == "http://127.0.0.1:4100/ready"
    assert metadata_url(settings) == "http://127.0.0.1:4100/metadata"


def test_environment_overrides():
    settings = RuntimeSettings.from_env(
        {
            "COLORCRAFT_WEB_HOST": "localhost",
            "COLORCRAFT_WEB_PORT": "6200",
            "COLORCRAFT_API_HOST": "127.0.0.1",
            "COLORCRAFT_API_PORT": "6201",
            "COLORCRAFT_ALLOWED_ORIGINS": "http://localhost:6200",
            "VITE_COLORCRAFT_API_URL": "http://127.0.0.1:6201",
        }
    )
    assert settings.web_url == "http://localhost:6200"
    assert settings.client_api_url == "http://127.0.0.1:6201"
    assert settings.allowed_origins == ("http://localhost:6200",)


def test_lan_binding_requires_explicit_opt_in():
    with pytest.raises(ConfigurationError, match="ALLOW_LAN_ACCESS"):
        RuntimeSettings.from_env({"COLORCRAFT_API_HOST": "0.0.0.0"})


def test_lan_origin_requires_explicit_opt_in():
    with pytest.raises(ConfigurationError, match="LAN CORS origins"):
        RuntimeSettings.from_env(
            {"COLORCRAFT_ALLOWED_ORIGINS": "http://192.168.1.20:5174"}
        )


def test_child_command_construction():
    settings = RuntimeSettings.from_env({})
    plan = create_development_plan(
        settings,
        backend_python=Path("python"),
        corepack="corepack",
    )
    assert plan.backend.command[-4:] == (
        "--host",
        "127.0.0.1",
        "--port",
        "4100",
    )
    assert plan.frontend.command[-4:] == (
        "--host",
        "127.0.0.1",
        "--port",
        "5174",
    )


def test_failure_propagation_is_nonzero():
    assert unexpected_exit_code(7) == 7
    assert unexpected_exit_code(0) == 1
    assert unexpected_exit_code(None) == 1


def test_readiness_waiter_accepts_the_ready_contract():
    class ReadyResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        @staticmethod
        def read() -> bytes:
            return b'{"status":"ready"}'

    class RunningProcess:
        @staticmethod
        def poll():
            return None

    settings = RuntimeSettings.from_env({})
    wait_for_readiness(
        settings,
        [
            (
                create_development_plan(
                    settings,
                    backend_python=Path("python"),
                    corepack="corepack",
                ).backend,
                RunningProcess(),
            )
        ],
        open_url=lambda *_args, **_kwargs: ReadyResponse(),
        monotonic=lambda: 0,
        sleep=lambda _seconds: None,
    )


def test_windows_shutdown_planning():
    assert windows_termination_command(42) == (
        "taskkill",
        "/PID",
        "42",
        "/T",
        "/F",
    )
