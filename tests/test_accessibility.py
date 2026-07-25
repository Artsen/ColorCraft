import pytest
from accessibility import contrast_ratio, relative_luminance, wcag_rating


def test_known_black_white_and_identical_contrast():
    assert relative_luminance((0, 0, 0)) == 0
    assert relative_luminance((255, 255, 255)) == 1
    assert contrast_ratio("#000000", "#ffffff") == 21
    assert contrast_ratio("#336699", "#336699") == 1


@pytest.mark.parametrize(
    ("threshold", "field"),
    [
        (3.0, "aa_large"),
        (4.5, "aa_normal"),
        (4.5, "aaa_large"),
        (7.0, "aaa_normal"),
    ],
)
@pytest.mark.parametrize(
    ("difference", "passes"),
    [(-0.0001, False), (0, True), (0.0001, True)],
)
def test_wcag_threshold_boundaries_preserve_precision(
    threshold: float, field: str, difference: float, passes: bool
):
    ratio = threshold + difference
    rating = wcag_rating(ratio)
    assert rating[field] is passes
    assert rating["ratio"] == ratio


def test_known_srgb_contrast_values():
    assert contrast_ratio("#767676", "#ffffff") == pytest.approx(4.5422, rel=1e-3)
    assert contrast_ratio("#949494", "#ffffff") == pytest.approx(3.0335, rel=1e-3)
    assert contrast_ratio("#595959", "#ffffff") == pytest.approx(7.0047, rel=1e-3)
