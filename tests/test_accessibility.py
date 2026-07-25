import pytest

from accessibility import contrast_ratio, relative_luminance, wcag_rating


def test_known_black_white_and_identical_contrast():
    assert relative_luminance((0, 0, 0)) == 0
    assert relative_luminance((255, 255, 255)) == 1
    assert contrast_ratio("#000000", "#ffffff") == 21
    assert contrast_ratio("#336699", "#336699") == 1


@pytest.mark.parametrize(
    ("ratio", "field", "passes"),
    [
        (4.4999, "aa_normal", False),
        (4.5, "aa_normal", True),
        (2.9999, "aa_large", False),
        (3.0, "aa_large", True),
        (6.9999, "aaa_normal", False),
        (7.0, "aaa_normal", True),
        (4.4999, "aaa_large", False),
        (4.5, "aaa_large", True),
    ],
)
def test_wcag_threshold_boundaries(ratio: float, field: str, passes: bool):
    assert wcag_rating(ratio)[field] is passes


def test_known_srgb_contrast_values():
    assert contrast_ratio("#767676", "#ffffff") == pytest.approx(4.5422, rel=1e-3)
    assert contrast_ratio("#949494", "#ffffff") == pytest.approx(3.0335, rel=1e-3)
    assert contrast_ratio("#595959", "#ffffff") == pytest.approx(7.0047, rel=1e-3)
