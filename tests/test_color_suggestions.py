import pytest
from color_extractor import hsl_to_rgb, rgb_to_hsl
from color_suggestions import (
    convert_hsl_to_color,
    describe_canonical_change,
    generate_all_suggestions,
    generate_monochromatic,
)


def canonical_color(hue: int, saturation: int, lightness: int):
    rgb = hsl_to_rgb([hue, saturation, lightness])
    canonical_hsl = rgb_to_hsl(rgb)
    return {
        "hex": "#{:02x}{:02x}{:02x}".format(*rgb),
        "rgb": {"r": rgb[0], "g": rgb[1], "b": rgb[2]},
        "hsl": {
            "h": canonical_hsl[0],
            "s": canonical_hsl[1],
            "l": canonical_hsl[2],
        },
    }


def test_descriptions_match_every_final_canonical_suggestion():
    bases = [
        canonical_color(359, 1, 50),
        canonical_color(1, 99, 50),
        canonical_color(30, 100, 1),
        canonical_color(210, 100, 99),
        canonical_color(17, 33, 47),
    ]

    for base in bases:
        result = generate_all_suggestions(base)
        for harmony in result["harmonies"]:
            for suggestion in harmony["suggestions"]:
                assert suggestion["description"] == describe_canonical_change(
                    base["hsl"], suggestion["hsl"]
                )
                assert "%" not in suggestion["description"]
                assert (
                    "percentage point" in suggestion["description"]
                    or "unchanged" in suggestion["description"]
                )


def test_range_limits_correct_directional_names_and_descriptions():
    near_black = canonical_color(30, 100, 1)
    near_white = canonical_color(210, 100, 99)

    black_variations = generate_monochromatic(near_black)["suggestions"]
    corrected_dark_name = next(
        suggestion
        for suggestion in black_variations
        if "Lighter Tone" in suggestion["name"]
    )
    assert "lightness increased" in corrected_dark_name["description"]

    white_variations = generate_monochromatic(near_white)["suggestions"]
    corrected_tint_name = next(
        suggestion
        for suggestion in white_variations
        if "Darker Tone" in suggestion["name"]
    )
    assert "lightness decreased" in corrected_tint_name["description"]


def test_rgb_canonicalization_drives_returned_description():
    base = canonical_color(0, 0, 1)
    suggestion = convert_hsl_to_color(
        {
            "hue": 0,
            "saturation": 1,
            "lightness": 1,
            "name": "Saturated Tone",
        },
        base,
    )

    assert suggestion["hsl"] == {"h": 0, "s": 0, "l": 1}
    assert suggestion["description"] == (
        "Same hue; saturation unchanged; lightness unchanged."
    )
    assert suggestion["name"] == "Same-Saturation Tone"


@pytest.mark.parametrize(
    ("base_hue", "final_hue", "direction"),
    [(359, 1, "clockwise"), (1, 359, "counterclockwise")],
)
def test_circular_hue_description_uses_shortest_direction(
    base_hue: int, final_hue: int, direction: str
):
    base = canonical_color(base_hue, 100, 50)
    suggestion = convert_hsl_to_color(
        {
            "hue": final_hue,
            "saturation": 100,
            "lightness": 50,
            "name": "Nearby Hue",
        },
        base,
    )

    assert suggestion["hsl"]["h"] == final_hue
    assert suggestion["description"].startswith(f"Hue shifted 2° {direction};")
