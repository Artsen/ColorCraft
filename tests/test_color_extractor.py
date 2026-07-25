from __future__ import annotations

from io import BytesIO
import re

from PIL import Image
import pytest

import color_extractor
from color_extractor import (
    ImageDimensionError,
    NoUsablePixelsError,
    extract_colors,
)


def image_bytes(
    mode: str,
    size: tuple[int, int],
    pixels: list[tuple[int, ...]] | tuple[int, ...],
) -> bytes:
    image = Image.new(mode, size)
    if isinstance(pixels, tuple):
        image.paste(pixels, (0, 0, *size))
    else:
        image.putdata(pixels)
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def test_solid_color_returns_actual_count_and_source_medoid():
    colors = extract_colors(image_bytes("RGB", (2, 2), (12, 34, 56)), 5)
    assert colors == [
        {
            "hex": "#0c2238",
            "rgb": {"r": 12, "g": 34, "b": 56},
            "hsl": {"h": 210, "s": 65, "l": 13},
            "population": 1.0,
            "pixelCount": 4,
        }
    ]


def test_two_colors_are_population_sorted_and_not_duplicated():
    pixels = [(255, 0, 0)] * 3 + [(0, 0, 255)]
    colors = extract_colors(image_bytes("RGB", (4, 1), pixels), 8)
    assert [color["hex"] for color in colors] == ["#ff0000", "#0000ff"]
    assert [color["pixelCount"] for color in colors] == [3, 1]
    assert [color["population"] for color in colors] == [0.75, 0.25]
    assert sum(float(color["population"]) for color in colors) == 1


def test_transparent_pixels_are_ignored_and_partial_alpha_uses_white_matte():
    pixels = [
        (0, 0, 0, 0),
        (0, 0, 0, 0),
        (255, 0, 0, 255),
        (0, 0, 0, 128),
    ]
    colors = extract_colors(image_bytes("RGBA", (4, 1), pixels), 4)
    assert {color["hex"] for color in colors} == {"#ff0000", "#7f7f7f"}
    assert all(color["hex"] != "#000000" for color in colors)


def test_fully_transparent_image_has_controlled_domain_error():
    with pytest.raises(NoUsablePixelsError):
        extract_colors(image_bytes("RGBA", (2, 2), (0, 0, 0, 0)), 3)


def test_extraction_is_deterministic_for_large_sample():
    generator = __import__("numpy").random.default_rng(9)
    pixels = [
        tuple(int(channel) for channel in pixel)
        for pixel in generator.integers(0, 256, size=(20_000, 3))
    ]
    payload = image_bytes("RGB", (200, 100), pixels)
    assert extract_colors(payload, 5) == extract_colors(payload, 5)


def test_representatives_are_valid_processing_sample_colors():
    source = [(10, 20, 30)] * 5 + [(200, 210, 220)] * 5
    colors = extract_colors(image_bytes("RGB", (10, 1), source), 2)
    assert all(
        re.fullmatch(r"#[0-9a-f]{6}", str(color["hex"])) for color in colors
    )
    assert {
        tuple(color["rgb"][channel] for channel in ("r", "g", "b"))
        for color in colors
    }.issubset(set(source))


def test_decoded_pixel_limit_is_enforced(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(color_extractor, "MAX_IMAGE_PIXELS", 3)
    with pytest.raises(ImageDimensionError):
        extract_colors(image_bytes("RGB", (2, 2), (0, 0, 0)), 2)


def test_invalid_image_is_rejected():
    with pytest.raises(Exception) as error:
        extract_colors(b"not an image", 3)
    assert error.type.__name__ == "UnidentifiedImageError"
