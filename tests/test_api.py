from __future__ import annotations

from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image
import pytest

from config import RuntimeSettings
from main import create_app
import main


@pytest.fixture()
def settings() -> RuntimeSettings:
    return RuntimeSettings.from_env({})


@pytest.fixture()
def client(settings: RuntimeSettings):
    with TestClient(create_app(settings)) as test_client:
        yield test_client


def png_bytes() -> bytes:
    image = Image.new("RGB", (30, 10))
    for x in range(30):
        color = (255, 0, 0) if x < 10 else (0, 255, 0) if x < 20 else (0, 0, 255)
        for y in range(10):
            image.putpixel((x, y), color)
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def red() -> dict[str, object]:
    return {
        "hex": "#ff0000",
        "rgb": {"r": 255, "g": 0, "b": 0},
        "hsl": {"h": 0, "s": 100, "l": 50},
    }


def blue() -> dict[str, object]:
    return {
        "hex": "#0000ff",
        "rgb": {"r": 0, "g": 0, "b": 255},
        "hsl": {"h": 240, "s": 100, "l": 50},
    }


def test_health(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "colorcraft-api",
        "version": "1.0.0",
    }


def test_readiness(client: TestClient):
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ready",
        "service": "colorcraft-api",
        "version": "1.0.0",
        "capabilities": [
            "color extraction",
            "palette analysis",
            "color suggestions",
        ],
    }


def test_default_local_cors(client: TestClient):
    allowed = client.options(
        "/health",
        headers={
            "Origin": "http://127.0.0.1:5174",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert allowed.headers["access-control-allow-origin"] == "http://127.0.0.1:5174"
    assert allowed.headers.get("access-control-allow-credentials") is None

    rejected = client.options(
        "/health",
        headers={
            "Origin": "http://example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" not in rejected.headers


def test_configured_lan_cors():
    settings = RuntimeSettings.from_env(
        {
            "COLORCRAFT_ALLOW_LAN_ACCESS": "true",
            "COLORCRAFT_API_HOST": "0.0.0.0",
            "COLORCRAFT_ALLOWED_ORIGINS": "http://192.168.1.20:5174",
        }
    )
    with TestClient(create_app(settings)) as client:
        response = client.options(
            "/health",
            headers={
                "Origin": "http://192.168.1.20:5174",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.headers["access-control-allow-origin"] == "http://192.168.1.20:5174"


def test_valid_extraction_request(client: TestClient):
    response = client.post(
        "/api/extract-colors?n_colors=3",
        files={"file": ("palette.png", png_bytes(), "image/png")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["count"] == 3
    assert len(payload["colors"]) == 3
    assert set(payload["colors"][0]) == {
        "hex",
        "rgb",
        "hsl",
        "population",
        "pixelCount",
    }


def test_solid_image_returns_one_color(client: TestClient):
    image = Image.new("RGB", (2, 2), (10, 20, 30))
    output = BytesIO()
    image.save(output, format="PNG")
    response = client.post(
        "/api/extract-colors?n_colors=5",
        files={"file": ("solid.png", output.getvalue(), "image/png")},
    )
    assert response.status_code == 200
    assert response.json()["count"] == 1

    full_response = client.post(
        "/api/full-analysis?n_colors=5",
        files={"file": ("solid.png", output.getvalue(), "image/png")},
    )
    assert full_response.status_code == 200
    assert len(full_response.json()["colors"]) == 1


def test_invalid_image_returns_controlled_error(client: TestClient):
    response = client.post(
        "/api/extract-colors?n_colors=3",
        files={"file": ("broken.png", b"not an image", "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "image_decode_error"
    assert "cannot identify image" not in response.text.lower()


def test_upload_limit_returns_413(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(main, "MAX_UPLOAD_BYTES", 4)
    response = client.post(
        "/api/extract-colors?n_colors=3",
        files={"file": ("large.png", b"12345", "image/png")},
    )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "upload_too_large"


def test_invalid_file_type(client: TestClient):
    response = client.post(
        "/api/extract-colors?n_colors=3",
        files={"file": ("palette.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "invalid_file_type"


def test_invalid_requested_color_count(client: TestClient):
    response = client.post(
        "/api/extract-colors?n_colors=2",
        files={"file": ("palette.png", png_bytes(), "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_valid_palette_analysis(client: TestClient):
    response = client.post(
        "/api/analyze-colors",
        json={"colors": [red(), blue()]},
    )
    assert response.status_code == 200
    color_theory = response.json()["analysis"]["colorTheory"]
    assert color_theory["relationshipFit"] >= 0
    assert "score" not in color_theory


def test_invalid_hex_values(client: TestClient):
    invalid = red()
    invalid["hex"] = "#fff"
    response = client.post(
        "/api/analyze-colors",
        json={"colors": [invalid, blue()]},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("rgb", {"r": 256, "g": 0, "b": 0}),
        ("hsl", {"h": 0, "s": 101, "l": 50}),
    ],
)
def test_out_of_range_rgb_or_hsl(
    client: TestClient, field: str, value: dict[str, int]
):
    invalid = red()
    invalid[field] = value
    response = client.post(
        "/api/analyze-colors",
        json={"colors": [invalid, blue()]},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_contradictory_color_representations_are_rejected(client: TestClient):
    invalid = red()
    invalid["rgb"] = {"r": 0, "g": 0, "b": 0}
    response = client.post(
        "/api/analyze-colors",
        json={"colors": [invalid, blue()]},
    )
    assert response.status_code == 422


def test_unknown_contract_fields_are_rejected(client: TestClient):
    invalid = red()
    invalid["name"] = "not accepted"
    response = client.post(
        "/api/analyze-colors",
        json={"colors": [invalid, blue()]},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_accessibility_response_schema(client: TestClient):
    response = client.post(
        "/api/analyze-colors",
        json={"colors": [red(), blue()]},
    )
    accessibility = response.json()["analysis"]["accessibility"]
    assert set(accessibility["summary"]) == {
        "totalPairs",
        "aaNormalPasses",
        "aaLargePasses",
        "aaaNormalPasses",
        "aaaLargePasses",
    }
    assert set(accessibility["issues"][0]) == {
        "type",
        "severity",
        "message",
        "color1",
        "color2",
        "ratio",
    }


def test_suggestion_response_schema(client: TestClient):
    response = client.post("/api/suggest-colors", json={"colors": [red()]})
    assert response.status_code == 200
    result = response.json()["suggestions"][0]
    assert set(result) == {"baseColor", "harmonies"}
    assert result["harmonies"][0]["suggestions"]

    suggestion = result["harmonies"][0]["suggestions"][0]
    added = {
        field: suggestion[field] for field in ("hex", "rgb", "hsl")
    }
    analysis_response = client.post(
        "/api/analyze-colors",
        json={"colors": [red(), added]},
    )
    assert analysis_response.status_code == 200
