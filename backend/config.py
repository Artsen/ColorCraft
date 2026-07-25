"""Runtime configuration shared by the ColorCraft API and development launcher."""

from __future__ import annotations

from dataclasses import dataclass
import ipaddress
import json
import os
from pathlib import Path
from typing import Mapping
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent.parent
RUNTIME_CONFIG_PATH = ROOT / "runtime-config.json"


class ConfigurationError(ValueError):
    """Raised when runtime environment values are unsafe or invalid."""


def load_runtime_defaults() -> dict[str, object]:
    with RUNTIME_CONFIG_PATH.open(encoding="utf-8") as config_file:
        return json.load(config_file)


def parse_boolean(value: str | None, *, name: str, default: bool = False) -> bool:
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ConfigurationError(f"{name} must be true or false.")


def parse_port(value: str | int, *, name: str) -> int:
    try:
        port = int(value)
    except (TypeError, ValueError) as error:
        raise ConfigurationError(f"{name} must be an integer.") from error
    if not 1 <= port <= 65535:
        raise ConfigurationError(f"{name} must be between 1 and 65535.")
    return port


def is_loopback_host(host: str) -> bool:
    normalized = host.strip().lower()
    if normalized == "localhost":
        return True
    try:
        return ipaddress.ip_address(normalized).is_loopback
    except ValueError:
        return False


def format_url_host(host: str) -> str:
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        return host
    return f"[{host}]" if address.version == 6 else host


def origin_for(host: str, port: int) -> str:
    return f"http://{format_url_host(host)}:{port}"


def validate_origin(origin: str, *, allow_lan_access: bool) -> str:
    parsed = urlparse(origin)
    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.path not in {"", "/"}
        or parsed.params
        or parsed.query
        or parsed.fragment
    ):
        raise ConfigurationError(
            f"COLORCRAFT_ALLOWED_ORIGINS contains an invalid origin: {origin}"
        )
    if origin == "*":
        raise ConfigurationError("Wildcard CORS origins are not supported.")
    if not allow_lan_access and not is_loopback_host(parsed.hostname):
        raise ConfigurationError(
            "LAN CORS origins require COLORCRAFT_ALLOW_LAN_ACCESS=true."
        )
    return origin.rstrip("/")


@dataclass(frozen=True)
class RuntimeSettings:
    service_name: str
    application_version: str
    web_host: str
    web_port: int
    api_host: str
    api_port: int
    allow_lan_access: bool
    allowed_origins: tuple[str, ...]
    vite_api_url: str | None
    readiness_timeout_seconds: int

    @property
    def web_url(self) -> str:
        return origin_for(self.web_host, self.web_port)

    @property
    def api_url(self) -> str:
        return origin_for(self.api_host, self.api_port)

    @property
    def client_api_url(self) -> str:
        if self.vite_api_url:
            return self.vite_api_url
        host = self.api_host if is_loopback_host(self.api_host) else "127.0.0.1"
        return origin_for(host, self.api_port)

    @classmethod
    def from_env(
        cls, environment: Mapping[str, str] | None = None
    ) -> "RuntimeSettings":
        env = os.environ if environment is None else environment
        runtime = load_runtime_defaults()
        defaults = runtime["defaults"]
        if not isinstance(defaults, dict):
            raise ConfigurationError("runtime-config.json defaults must be an object.")

        web_host = env.get(
            "COLORCRAFT_WEB_HOST", str(defaults["webHost"])
        ).strip()
        api_host = env.get(
            "COLORCRAFT_API_HOST", str(defaults["apiHost"])
        ).strip()
        allow_lan_access = parse_boolean(
            env.get("COLORCRAFT_ALLOW_LAN_ACCESS"),
            name="COLORCRAFT_ALLOW_LAN_ACCESS",
        )

        if not web_host or not api_host:
            raise ConfigurationError("Configured hosts cannot be empty.")
        if not allow_lan_access:
            for name, host in (
                ("COLORCRAFT_WEB_HOST", web_host),
                ("COLORCRAFT_API_HOST", api_host),
            ):
                if not is_loopback_host(host):
                    raise ConfigurationError(
                        f"{name}={host} requires "
                        "COLORCRAFT_ALLOW_LAN_ACCESS=true."
                    )

        web_port = parse_port(
            env.get("COLORCRAFT_WEB_PORT", defaults["webPort"]),
            name="COLORCRAFT_WEB_PORT",
        )
        api_port = parse_port(
            env.get("COLORCRAFT_API_PORT", defaults["apiPort"]),
            name="COLORCRAFT_API_PORT",
        )
        timeout = parse_port(
            env.get(
                "COLORCRAFT_READINESS_TIMEOUT_SECONDS",
                defaults["readinessTimeoutSeconds"],
            ),
            name="COLORCRAFT_READINESS_TIMEOUT_SECONDS",
        )

        configured_origins = env.get("COLORCRAFT_ALLOWED_ORIGINS")
        raw_origins = (
            [entry.strip() for entry in configured_origins.split(",")]
            if configured_origins
            else [origin_for(web_host, web_port)]
        )
        origins = tuple(
            dict.fromkeys(
                validate_origin(origin, allow_lan_access=allow_lan_access)
                for origin in raw_origins
                if origin
            )
        )
        if not origins:
            raise ConfigurationError(
                "COLORCRAFT_ALLOWED_ORIGINS must contain at least one origin."
            )

        vite_api_url = env.get("VITE_COLORCRAFT_API_URL")
        if vite_api_url:
            vite_api_url = validate_origin(
                vite_api_url.strip(), allow_lan_access=allow_lan_access
            )

        return cls(
            service_name=str(runtime["serviceName"]),
            application_version=str(runtime["applicationVersion"]),
            web_host=web_host,
            web_port=web_port,
            api_host=api_host,
            api_port=api_port,
            allow_lan_access=allow_lan_access,
            allowed_origins=origins,
            vite_api_url=vite_api_url,
            readiness_timeout_seconds=timeout,
        )
