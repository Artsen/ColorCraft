"""Deterministic dominant-color extraction in LAB color space.

Fully transparent pixels are ignored. Partially transparent pixels are
composited over white before clustering, matching the common presentation of
uploaded images on an opaque page.
"""

from __future__ import annotations

import io

import numpy as np
from PIL import Image, UnidentifiedImageError
from sklearn.cluster import KMeans

MAX_IMAGE_PIXELS = 40_000_000
MAX_SAMPLE_PIXELS = 10_000
SAMPLE_SEED = 42


class ImageDimensionError(ValueError):
    """Raised when decoded image dimensions exceed the processing limit."""


class NoUsablePixelsError(ValueError):
    """Raised when an image contains no visible pixels."""


def rgb_to_lab(rgb: list[int] | tuple[int, int, int] | np.ndarray) -> list[float]:
    """Convert an sRGB color to CIE LAB (D65)."""
    channels = np.asarray(rgb, dtype=float) / 255.0
    channels = np.where(
        channels > 0.04045,
        ((channels + 0.055) / 1.055) ** 2.4,
        channels / 12.92,
    )
    matrix = np.array(
        [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041],
        ]
    )
    x, y, z = np.dot(matrix, channels) * 100

    delta = 6 / 29

    def transform(value: float) -> float:
        return value ** (1 / 3) if value > delta**3 else value / (3 * delta**2) + 4 / 29

    fx = transform(x / 95.047)
    fy = transform(y / 100)
    fz = transform(z / 108.883)
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]


def _rgb_array_to_lab(pixels: np.ndarray) -> np.ndarray:
    """Vectorized sRGB-to-LAB conversion for clustering."""
    rgb = pixels.astype(np.float64) / 255.0
    rgb = np.where(
        rgb > 0.04045,
        ((rgb + 0.055) / 1.055) ** 2.4,
        rgb / 12.92,
    )
    matrix = np.array(
        [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041],
        ]
    )
    xyz = rgb @ matrix.T * 100
    reference = np.array([95.047, 100.0, 108.883])
    scaled = xyz / reference
    delta = 6 / 29
    transformed = np.where(
        scaled > delta**3,
        np.cbrt(scaled),
        scaled / (3 * delta**2) + 4 / 29,
    )
    return np.column_stack(
        (
            116 * transformed[:, 1] - 16,
            500 * (transformed[:, 0] - transformed[:, 1]),
            200 * (transformed[:, 1] - transformed[:, 2]),
        )
    )


def rgb_to_hsl(rgb: list[int] | tuple[int, int, int]) -> list[int]:
    """Convert RGB to rounded HSL."""
    r, g, b = [channel / 255.0 for channel in rgb]
    maximum = max(r, g, b)
    minimum = min(r, g, b)
    lightness = (maximum + minimum) / 2

    if maximum == minimum:
        hue = saturation = 0.0
    else:
        difference = maximum - minimum
        saturation = (
            difference / (2 - maximum - minimum)
            if lightness > 0.5
            else difference / (maximum + minimum)
        )
        if maximum == r:
            hue = (g - b) / difference + (6 if g < b else 0)
        elif maximum == g:
            hue = (b - r) / difference + 2
        else:
            hue = (r - g) / difference + 4
        hue /= 6

    return [
        round(hue * 360) % 360,
        round(saturation * 100),
        round(lightness * 100),
    ]


def hsl_to_rgb(hsl: list[int] | tuple[int, int, int]) -> list[int]:
    """Convert HSL to RGB."""
    hue, saturation, lightness = (
        hsl[0] / 360.0,
        hsl[1] / 100.0,
        hsl[2] / 100.0,
    )
    if saturation == 0:
        red = green = blue = lightness
    else:

        def hue_to_rgb(p: float, q: float, value: float) -> float:
            value %= 1
            if value < 1 / 6:
                return p + (q - p) * 6 * value
            if value < 1 / 2:
                return q
            if value < 2 / 3:
                return p + (q - p) * (2 / 3 - value) * 6
            return p

        q = (
            lightness * (1 + saturation)
            if lightness < 0.5
            else lightness + saturation - lightness * saturation
        )
        p = 2 * lightness - q
        red = hue_to_rgb(p, q, hue + 1 / 3)
        green = hue_to_rgb(p, q, hue)
        blue = hue_to_rgb(p, q, hue - 1 / 3)
    return [round(red * 255), round(green * 255), round(blue * 255)]


def _visible_rgb_pixels(image: Image.Image) -> np.ndarray:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).reshape(-1, 4)
    visible = rgba[rgba[:, 3] > 0]
    if len(visible) == 0:
        raise NoUsablePixelsError("The image contains no visible pixels.")

    alpha = visible[:, 3:4].astype(np.float64) / 255.0
    composited = visible[:, :3].astype(np.float64) * alpha + 255.0 * (1.0 - alpha)
    return np.rint(composited).clip(0, 255).astype(np.uint8)


def _sample_pixels(pixels: np.ndarray) -> np.ndarray:
    if len(pixels) <= MAX_SAMPLE_PIXELS:
        return pixels
    generator = np.random.default_rng(SAMPLE_SEED)
    indexes = generator.choice(len(pixels), size=MAX_SAMPLE_PIXELS, replace=False)
    return pixels[indexes]


def _color_payload(
    rgb_array: np.ndarray, population: float, pixel_count: int
) -> dict[str, object]:
    rgb = [int(channel) for channel in rgb_array]
    hsl = rgb_to_hsl(rgb)
    return {
        "hex": f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}",
        "rgb": {"r": rgb[0], "g": rgb[1], "b": rgb[2]},
        "hsl": {"h": hsl[0], "s": hsl[1], "l": hsl[2]},
        "population": round(population, 6),
        "pixelCount": pixel_count,
    }


def extract_colors(image_bytes: bytes, n_colors: int = 5) -> list[dict[str, object]]:
    """Extract up to ``n_colors`` dominant processed-sample colors.

    Cluster representatives are medoids: actual sampled RGB pixels nearest to
    each LAB cluster center. Population and pixelCount describe the deterministic
    processing sample, after transparent-pixel handling and resizing.
    """
    if n_colors < 1:
        raise ValueError("At least one color must be requested.")

    try:
        with Image.open(io.BytesIO(image_bytes)) as source:
            width, height = source.size
            if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
                raise ImageDimensionError(
                    f"Decoded images may contain at most {MAX_IMAGE_PIXELS:,} pixels."
                )
            source.load()
            image = source.copy()
    except ImageDimensionError:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError) as error:
        raise UnidentifiedImageError("The image data is invalid.") from error

    max_dimension = 400
    if max(image.size) > max_dimension:
        image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

    pixels = _sample_pixels(_visible_rgb_pixels(image))
    unique_pixels = np.unique(pixels, axis=0)
    effective_clusters = min(n_colors, len(unique_pixels), len(pixels))
    if effective_clusters == 0:
        raise NoUsablePixelsError("The image contains no visible pixels.")

    lab_pixels = _rgb_array_to_lab(pixels)
    if effective_clusters == 1:
        labels = np.zeros(len(pixels), dtype=int)
        centers = np.mean(lab_pixels, axis=0, keepdims=True)
    else:
        model = KMeans(
            n_clusters=effective_clusters,
            random_state=SAMPLE_SEED,
            n_init=10,
            max_iter=300,
        )
        labels = model.fit_predict(lab_pixels)
        centers = model.cluster_centers_

    extracted: list[dict[str, object]] = []
    for cluster_index in range(effective_clusters):
        indexes = np.flatnonzero(labels == cluster_index)
        if len(indexes) == 0:
            continue
        cluster_lab = lab_pixels[indexes]
        nearest_offset = int(
            np.argmin(np.sum((cluster_lab - centers[cluster_index]) ** 2, axis=1))
        )
        representative = pixels[indexes[nearest_offset]]
        pixel_count = int(len(indexes))
        extracted.append(
            _color_payload(
                representative,
                population=pixel_count / len(pixels),
                pixel_count=pixel_count,
            )
        )

    extracted.sort(
        key=lambda color: (
            -color["pixelCount"] if isinstance(color["pixelCount"], int) else 0,
            str(color["hex"]),
        )
    )
    return extracted
