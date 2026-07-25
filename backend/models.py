"""Explicit request and response contracts for the ColorCraft API."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)


def to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.capitalize() for part in tail)


class ContractModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
    )


HexColor = Annotated[str, StringConstraints(pattern=r"^#[0-9A-Fa-f]{6}$")]


class RGB(ContractModel):
    r: int = Field(ge=0, le=255)
    g: int = Field(ge=0, le=255)
    b: int = Field(ge=0, le=255)


class HSL(ContractModel):
    h: int = Field(ge=0, le=360)
    s: int = Field(ge=0, le=100)
    l: int = Field(ge=0, le=100)


class ColorValue(ContractModel):
    hex: HexColor
    rgb: RGB
    hsl: HSL

    @field_validator("hex")
    @classmethod
    def normalize_hex(cls, value: str) -> str:
        return value.lower()


class ColorInput(ColorValue):
    @model_validator(mode="after")
    def representations_must_agree(self) -> "ColorInput":
        from color_extractor import rgb_to_hsl

        expected_rgb = RGB(
            r=int(self.hex[1:3], 16),
            g=int(self.hex[3:5], 16),
            b=int(self.hex[5:7], 16),
        )
        if self.rgb != expected_rgb:
            raise ValueError("RGB values must describe the supplied HEX color.")

        expected_hsl = HSL(
            **dict(
                zip(
                    ("h", "s", "l"),
                    rgb_to_hsl([expected_rgb.r, expected_rgb.g, expected_rgb.b]),
                )
            )
        )
        hue_matches = self.hsl.h == expected_hsl.h or {
            self.hsl.h,
            expected_hsl.h,
        } == {0, 360}
        if (
            not hue_matches
            or self.hsl.s != expected_hsl.s
            or self.hsl.l != expected_hsl.l
        ):
            raise ValueError("HSL values must describe the supplied HEX color.")
        return self


class ExtractedColor(ColorValue):
    population: float = Field(ge=0, le=1)
    pixel_count: int = Field(ge=1)


class ServiceResponse(ContractModel):
    status: Literal["ok"]
    service: str
    version: str


class ReadinessResponse(ContractModel):
    status: Literal["ready", "not_ready"]
    service: str
    version: str
    capabilities: list[str]


class ApplicationMetadata(ContractModel):
    schema_version: Literal[1]
    id: Literal["colorcraft"]
    name: Literal["ColorCraft"]
    descriptor: Literal["Local color utility"]
    version: str
    icon: str
    web_url: str
    api_url: str
    health_url: str
    readiness_url: str
    network_mode: Literal["loopback", "lan"]
    capabilities: list[str]


class ExtractionResponse(ContractModel):
    success: Literal[True]
    colors: list[ExtractedColor] = Field(min_length=1, max_length=10)
    count: int = Field(ge=1, le=10)


class PaletteAnalysisRequest(ContractModel):
    colors: list[ColorInput] = Field(min_length=2, max_length=10)


class SuggestionRequest(ContractModel):
    colors: list[ColorInput] = Field(min_length=1, max_length=10)


HarmonyType = Literal[
    "complementary",
    "analogous",
    "triadic",
    "tetradic",
    "split_complementary",
    "monochromatic",
]


class HarmonyRelationship(ContractModel):
    type: HarmonyType
    color_indexes: list[int] = Field(min_length=2, max_length=10)
    expected_angles: list[float] = Field(min_length=1, max_length=10)
    measured_angles: list[float] = Field(min_length=1, max_length=10)
    deviation: float = Field(ge=0, le=180)
    confidence: float = Field(ge=0, le=1)


class HarmonyResults(ContractModel):
    complementary: list[HarmonyRelationship]
    analogous: list[HarmonyRelationship]
    triadic: list[HarmonyRelationship]
    tetradic: list[HarmonyRelationship]
    split_complementary: list[HarmonyRelationship]
    monochromatic: list[HarmonyRelationship]


class TemperatureResults(ContractModel):
    balance: Literal["warm", "transitional", "cool", "mixed", "neutral"]
    warm_count: int = Field(ge=0)
    transitional_count: int = Field(ge=0)
    cool_count: int = Field(ge=0)
    warm_ratio: float = Field(ge=0, le=1)
    transitional_ratio: float = Field(ge=0, le=1)
    cool_ratio: float = Field(ge=0, le=1)


class ColorMetrics(ContractModel):
    hue_diversity: float = Field(ge=0)
    saturation_avg: float = Field(ge=0, le=100)
    lightness_range: int = Field(ge=0, le=100)


class ColorTheoryResult(ContractModel):
    harmonies: HarmonyResults
    temperature_balance: TemperatureResults
    relationship_fit: int = Field(ge=0, le=100)
    relationship_summary: str
    relationship_factors: list[str]
    tags: list[str]
    metrics: ColorMetrics


class ContrastPair(ContractModel):
    color1: HexColor
    color2: HexColor
    ratio: float = Field(ge=1, le=21)
    aa_normal: bool
    aa_large: bool
    aaa_normal: bool
    aaa_large: bool


class AccessibilityIssue(ContractModel):
    type: str
    severity: Literal["warning", "error"]
    message: str
    color1: HexColor
    color2: HexColor
    ratio: float = Field(ge=1, le=21)


class AccessibilitySummary(ContractModel):
    total_pairs: int = Field(ge=0)
    aa_normal_passes: int = Field(ge=0)
    aa_large_passes: int = Field(ge=0)
    aaa_normal_passes: int = Field(ge=0)
    aaa_large_passes: int = Field(ge=0)


class AccessibilityResult(ContractModel):
    pairs: list[ContrastPair]
    issues: list[AccessibilityIssue]
    summary: AccessibilitySummary


class AnalysisResult(ContractModel):
    color_theory: ColorTheoryResult
    accessibility: AccessibilityResult


class AnalysisResponse(ContractModel):
    success: Literal[True]
    analysis: AnalysisResult


class SuggestionColor(ColorValue):
    name: str
    description: str


class HarmonySuggestion(ContractModel):
    type: str
    angle: str
    description: str
    use_cases: list[str]
    common_associations: str
    examples: str
    suggestions: list[SuggestionColor]


class SuggestionResult(ContractModel):
    base_color: ColorValue
    harmonies: list[HarmonySuggestion]


class SuggestionResponse(ContractModel):
    success: Literal[True]
    suggestions: list[SuggestionResult]


class FullAnalysisResponse(ContractModel):
    success: Literal[True]
    colors: list[ExtractedColor]
    analysis: AnalysisResult


class ValidationIssue(ContractModel):
    location: list[str | int]
    message: str
    type: str


class APIError(ContractModel):
    code: str
    message: str
    details: list[ValidationIssue] | None = None


class ErrorResponse(ContractModel):
    error: APIError
