"""Circular color-theory analysis with explainable relationship evidence."""

from __future__ import annotations

from itertools import combinations
import math
from typing import Iterable

import numpy as np


MIN_MEANINGFUL_SATURATION = 10
COMPLEMENTARY_TOLERANCE = 12.0
ANALOGOUS_EXPECTED_ANGLE = 30.0
ANALOGOUS_TOLERANCE = 15.0
TRIADIC_TOLERANCE = 12.0
TETRADIC_TOLERANCE = 10.0
SPLIT_COMPLEMENTARY_TOLERANCE = 12.0
MONOCHROMATIC_TOLERANCE = 10.0


def normalize_hue(hue: float) -> float:
    """Normalize any hue to the half-open [0, 360) interval."""
    normalized = float(hue) % 360.0
    return 0.0 if math.isclose(normalized, 360.0, abs_tol=1e-10) else normalized


def hue_distance(first: float, second: float) -> float:
    """Return the shortest circular distance between two hues."""
    difference = abs(normalize_hue(first) - normalize_hue(second))
    return min(difference, 360.0 - difference)


def circular_mean(hues: Iterable[float]) -> float | None:
    """Return the circular mean hue, or None for empty/fully opposed data."""
    values = list(hues)
    if not values:
        return None
    radians = np.radians([normalize_hue(value) for value in values])
    sine = float(np.mean(np.sin(radians)))
    cosine = float(np.mean(np.cos(radians)))
    if math.hypot(sine, cosine) < 1e-12:
        return None
    return normalize_hue(math.degrees(math.atan2(sine, cosine)))


def circular_dispersion(hues: Iterable[float]) -> float:
    """Return circular standard deviation in degrees, capped at 180."""
    values = list(hues)
    if len(values) < 2:
        return 0.0
    radians = np.radians([normalize_hue(value) for value in values])
    resultant = math.hypot(
        float(np.mean(np.sin(radians))),
        float(np.mean(np.cos(radians))),
    )
    if resultant < 1e-12:
        return 180.0
    return min(180.0, math.degrees(math.sqrt(-2.0 * math.log(resultant))))


def _confidence(deviation: float, tolerance: float) -> float:
    return round(max(0.0, 1.0 - deviation / (tolerance * 1.5)), 3)


def _relationship(
    relationship_type: str,
    indexes: Iterable[int],
    expected: Iterable[float],
    measured: Iterable[float],
    tolerance: float,
) -> dict[str, object]:
    expected_angles = [round(value, 2) for value in expected]
    measured_angles = [round(value, 2) for value in measured]
    deviation = max(
        abs(actual - target)
        for actual, target in zip(measured_angles, expected_angles)
    )
    return {
        "type": relationship_type,
        "color_indexes": list(indexes),
        "expected_angles": expected_angles,
        "measured_angles": measured_angles,
        "deviation": round(deviation, 2),
        "confidence": _confidence(deviation, tolerance),
    }


def _chromatic_hues(colors: list[dict[str, object]]) -> list[tuple[int, float]]:
    """Return meaningful, de-duplicated hue evidence.

    Near-neutral colors do not provide meaningful hue evidence. Repeated hues
    are represented once so duplicates cannot manufacture relationships.
    """
    evidence: list[tuple[int, float]] = []
    for index, color in enumerate(colors):
        hsl = color["hsl"]
        saturation = float(hsl["s"])
        hue = normalize_hue(float(hsl["h"]))
        if saturation < MIN_MEANINGFUL_SATURATION:
            continue
        if any(hue_distance(hue, existing) < 1.0 for _, existing in evidence):
            continue
        evidence.append((index, hue))
    return evidence


def detect_complementary(
    evidence: list[tuple[int, float]],
    tolerance: float = COMPLEMENTARY_TOLERANCE,
) -> list[dict[str, object]]:
    relationships = []
    for (first_index, first), (second_index, second) in combinations(evidence, 2):
        measured = hue_distance(first, second)
        if abs(measured - 180.0) <= tolerance:
            relationships.append(
                _relationship(
                    "complementary",
                    [first_index, second_index],
                    [180.0],
                    [measured],
                    tolerance,
                )
            )
    return relationships


def detect_analogous(
    evidence: list[tuple[int, float]],
    tolerance: float = ANALOGOUS_TOLERANCE,
) -> list[dict[str, object]]:
    relationships = []
    for (first_index, first), (second_index, second) in combinations(evidence, 2):
        measured = hue_distance(first, second)
        if abs(measured - ANALOGOUS_EXPECTED_ANGLE) <= tolerance:
            relationships.append(
                _relationship(
                    "analogous",
                    [first_index, second_index],
                    [ANALOGOUS_EXPECTED_ANGLE],
                    [measured],
                    tolerance,
                )
            )
    return relationships


def _circular_gaps(hues: Iterable[float]) -> list[float]:
    ordered = sorted(normalize_hue(hue) for hue in hues)
    return [
        normalize_hue(ordered[(index + 1) % len(ordered)] - hue)
        for index, hue in enumerate(ordered)
    ]


def detect_triadic(
    evidence: list[tuple[int, float]],
    tolerance: float = TRIADIC_TOLERANCE,
) -> list[dict[str, object]]:
    relationships = []
    for group in combinations(evidence, 3):
        gaps = _circular_gaps(hue for _, hue in group)
        deviation = max(abs(gap - 120.0) for gap in gaps)
        if deviation <= tolerance:
            relationships.append(
                _relationship(
                    "triadic",
                    [index for index, _ in group],
                    [120.0, 120.0, 120.0],
                    gaps,
                    tolerance,
                )
            )
    return relationships


def detect_tetradic(
    evidence: list[tuple[int, float]],
    tolerance: float = TETRADIC_TOLERANCE,
) -> list[dict[str, object]]:
    """Detect square tetrads in bounded O(n^4), with palette size capped at 10."""
    relationships = []
    for group in combinations(evidence, 4):
        gaps = _circular_gaps(hue for _, hue in group)
        deviation = max(abs(gap - 90.0) for gap in gaps)
        if deviation <= tolerance:
            relationships.append(
                _relationship(
                    "tetradic",
                    [index for index, _ in group],
                    [90.0] * 4,
                    gaps,
                    tolerance,
                )
            )
    return relationships


def detect_split_complementary(
    evidence: list[tuple[int, float]],
    tolerance: float = SPLIT_COMPLEMENTARY_TOLERANCE,
) -> list[dict[str, object]]:
    relationships = []
    seen: set[tuple[int, int, int]] = set()
    for base_index, base_hue in evidence:
        others = [
            (index, hue)
            for index, hue in evidence
            if index != base_index
        ]
        for (first_index, first), (second_index, second) in combinations(others, 2):
            measured = [
                hue_distance(base_hue, first),
                hue_distance(base_hue, second),
                hue_distance(first, second),
            ]
            expected = [150.0, 150.0, 60.0]
            deviation = max(
                abs(actual - target)
                for actual, target in zip(measured, expected)
            )
            key = (base_index, *sorted((first_index, second_index)))
            if deviation <= tolerance and key not in seen:
                seen.add(key)
                relationships.append(
                    _relationship(
                        "split_complementary",
                        key,
                        expected,
                        measured,
                        tolerance,
                    )
                )
    return relationships


def detect_monochromatic(
    colors: list[dict[str, object]],
    tolerance: float = MONOCHROMATIC_TOLERANCE,
) -> list[dict[str, object]]:
    distinct: list[tuple[int, dict[str, float]]] = []
    seen: set[tuple[float, float, float]] = set()
    for index, color in enumerate(colors):
        hsl = color["hsl"]
        values = (
            normalize_hue(float(hsl["h"])),
            float(hsl["s"]),
            float(hsl["l"]),
        )
        if values[1] < MIN_MEANINGFUL_SATURATION or values in seen:
            continue
        seen.add(values)
        distinct.append(
            (index, {"h": values[0], "s": values[1], "l": values[2]})
        )
    if len(distinct) < 2:
        return []

    mean_hue = circular_mean(item["h"] for _, item in distinct)
    if mean_hue is None:
        return []
    measured = [
        hue_distance(item["h"], mean_hue) for _, item in distinct
    ]
    deviation = max(measured)
    saturation_range = max(item["s"] for _, item in distinct) - min(
        item["s"] for _, item in distinct
    )
    lightness_range = max(item["l"] for _, item in distinct) - min(
        item["l"] for _, item in distinct
    )
    if (
        deviation > tolerance
        or (saturation_range <= 10 and lightness_range <= 10)
    ):
        return []
    return [
        _relationship(
            "monochromatic",
            [index for index, _ in distinct],
            [0.0] * len(distinct),
            measured,
            tolerance,
        )
    ]


def analyze_warm_cool_balance(colors: list[dict[str, object]]) -> dict[str, object]:
    warm_count = 0
    cool_count = 0
    for color in colors:
        hsl = color["hsl"]
        if float(hsl["s"]) < MIN_MEANINGFUL_SATURATION:
            continue
        hue = normalize_hue(float(hsl["h"]))
        if hue <= 60 or hue >= 300:
            warm_count += 1
        elif 120 <= hue <= 300:
            cool_count += 1

    categorized = warm_count + cool_count
    if categorized == 0:
        return {
            "balance": "neutral",
            "warm_count": 0,
            "cool_count": 0,
            "warm_ratio": 0.0,
            "cool_ratio": 0.0,
        }
    warm_ratio = warm_count / categorized
    cool_ratio = cool_count / categorized
    balance = (
        "warm"
        if warm_ratio > 0.7
        else "cool"
        if cool_ratio > 0.7
        else "balanced"
    )
    return {
        "balance": balance,
        "warm_count": warm_count,
        "cool_count": cool_count,
        "warm_ratio": round(warm_ratio, 2),
        "cool_ratio": round(cool_ratio, 2),
    }


def calculate_relationship_fit(
    harmonies: dict[str, list[dict[str, object]]],
    chromatic_color_count: int,
) -> tuple[int, str, list[str]]:
    """Score detected geometry, without making an aesthetic-quality claim."""
    detected = [
        relationship
        for relationships in harmonies.values()
        for relationship in relationships
    ]
    if not detected or chromatic_color_count == 0:
        return (
            0,
            "No strong geometric relationship detected",
            ["No relationship met the documented angular tolerances."],
        )

    best_by_type: dict[str, dict[str, object]] = {}
    involved: set[int] = set()
    for relationship in detected:
        relationship_type = str(relationship["type"])
        if (
            relationship_type not in best_by_type
            or float(relationship["confidence"])
            > float(best_by_type[relationship_type]["confidence"])
        ):
            best_by_type[relationship_type] = relationship
        involved.update(int(index) for index in relationship["color_indexes"])

    mean_best_confidence = sum(
        float(item["confidence"]) for item in best_by_type.values()
    ) / len(best_by_type)
    coverage = min(1.0, len(involved) / chromatic_color_count)
    fit = round(70 * mean_best_confidence + 30 * coverage)
    strength = (
        "Strong geometric relationship"
        if fit >= 75
        else "Moderate geometric relationship"
        if fit >= 45
        else "Limited geometric relationship"
    )
    labels = {
        "complementary": "complementary pair",
        "analogous": "analogous pair",
        "triadic": "triadic structure",
        "tetradic": "square tetradic structure",
        "split_complementary": "split-complementary structure",
        "monochromatic": "monochromatic structure",
    }
    factors = [
        (
            f"Best {labels[relationship_type]} deviation: "
            f"{relationship['deviation']:.1f}° "
            f"(confidence {float(relationship['confidence']):.0%})."
        )
        for relationship_type, relationship in best_by_type.items()
    ]
    factors.append(
        f"Detected relationships involve {len(involved)} of "
        f"{chromatic_color_count} meaningful hues."
    )
    return fit, strength, factors


def analyze_color_theory(colors: list[dict[str, object]]) -> dict[str, object]:
    """Analyze explainable geometric color relationships."""
    evidence = _chromatic_hues(colors)
    harmonies = {
        "complementary": detect_complementary(evidence),
        "analogous": detect_analogous(evidence),
        "triadic": detect_triadic(evidence),
        "tetradic": detect_tetradic(evidence),
        "split_complementary": detect_split_complementary(evidence),
        "monochromatic": detect_monochromatic(colors),
    }
    relationship_fit, relationship_summary, factors = (
        calculate_relationship_fit(harmonies, len(evidence))
    )
    temperature_balance = analyze_warm_cool_balance(colors)

    labels = {
        "complementary": "Complementary Relationship Detected",
        "analogous": "Analogous Relationship Detected",
        "triadic": "Triadic Relationship Detected",
        "tetradic": "Tetradic Relationship Detected",
        "split_complementary": "Split-Complementary Relationship Detected",
        "monochromatic": "Monochromatic Relationship Detected",
    }
    tags = [
        labels[name] for name, relationships in harmonies.items() if relationships
    ]
    balance = temperature_balance["balance"]
    tags.append(
        "Neutral Palette"
        if balance == "neutral"
        else f"{str(balance).title()} Temperature"
    )

    saturations = [float(color["hsl"]["s"]) for color in colors]
    lightnesses = [int(color["hsl"]["l"]) for color in colors]
    meaningful_hues = [hue for _, hue in evidence]
    return {
        "harmonies": harmonies,
        "temperature_balance": temperature_balance,
        "relationship_fit": relationship_fit,
        "relationship_summary": relationship_summary,
        "relationship_factors": factors,
        "tags": tags,
        "metrics": {
            "hue_diversity": round(circular_dispersion(meaningful_hues), 2),
            "saturation_avg": round(float(np.mean(saturations)), 2),
            "lightness_range": max(lightnesses) - min(lightnesses),
        },
    }
