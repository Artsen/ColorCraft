from __future__ import annotations

import pytest

from color_theory import (
    analyze_color_theory,
    circular_dispersion,
    circular_mean,
    hue_distance,
    normalize_hue,
)


def color(hue: int, saturation: int = 100, lightness: int = 50):
    return {
        "hex": "#000000",
        "rgb": {"r": 0, "g": 0, "b": 0},
        "hsl": {"h": hue, "s": saturation, "l": lightness},
    }


def relationships(hues: list[int], saturation: int = 100):
    return analyze_color_theory(
        [color(hue, saturation=saturation) for hue in hues]
    )["harmonies"]


def test_circular_hue_helpers_wrap_correctly():
    assert normalize_hue(721) == 1
    assert normalize_hue(-1) == 359
    assert hue_distance(359, 1) == 2
    assert circular_mean([359, 1]) == pytest.approx(0)
    assert circular_dispersion([359, 1]) < 2


def test_complementary_positive_negative_and_boundary():
    assert relationships([1, 181])["complementary"]
    assert relationships([0, 167])["complementary"] == []
    boundary = relationships([0, 168])["complementary"][0]
    assert boundary["measured_angles"] == [168.0]
    assert boundary["deviation"] == 12.0


def test_analogous_does_not_accept_quarter_turn_or_duplicates():
    assert relationships([0, 30])["analogous"]
    assert relationships([0, 45])["analogous"]
    assert relationships([0, 46])["analogous"] == []
    assert relationships([0, 90])["analogous"] == []
    assert relationships([20, 20, 20])["analogous"] == []


def test_triadic_positive_and_false_boundary():
    triadic = relationships([0, 120, 240])["triadic"]
    assert triadic[0]["measured_angles"] == [120.0, 120.0, 120.0]
    assert triadic[0]["confidence"] == 1
    assert relationships([0, 108, 240])["triadic"]
    assert relationships([0, 107, 240])["triadic"] == []


def test_tetradic_positive_and_negative():
    assert relationships([0, 90, 180, 270])["tetradic"]
    assert relationships([0, 80, 180, 270])["tetradic"]
    assert relationships([0, 79, 180, 270])["tetradic"] == []


def test_split_complementary_positive_and_negative():
    assert relationships([0, 150, 210])["split_complementary"]
    assert relationships([0, 138, 210])["split_complementary"]
    assert relationships([0, 137, 210])["split_complementary"] == []


def test_monochromatic_requires_variation_not_duplicate_colors():
    palette = [color(20, 70, 30), color(23, 60, 60)]
    assert analyze_color_theory(palette)["harmonies"]["monochromatic"]
    assert analyze_color_theory(
        [color(0, 70, 30), color(20, 60, 60)]
    )["harmonies"]["monochromatic"]
    assert analyze_color_theory(
        [color(0, 70, 30), color(21, 60, 60)]
    )["harmonies"]["monochromatic"] == []
    assert relationships([20, 20])["monochromatic"] == []


def test_neutral_colors_are_not_hue_evidence():
    theory = analyze_color_theory([color(0, 0), color(180, 1)])
    assert all(not found for found in theory["harmonies"].values())
    assert theory["metrics"]["hue_diversity"] == 0
    assert theory["relationship_fit"] == 0


def test_relationship_output_is_explainable():
    relationship = relationships([0, 180])["complementary"][0]
    assert set(relationship) == {
        "type",
        "color_indexes",
        "expected_angles",
        "measured_angles",
        "deviation",
        "confidence",
    }
