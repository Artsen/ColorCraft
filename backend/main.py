"""FastAPI backend for the ColorCraft local application."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Annotated

import uvicorn
from accessibility import analyze_accessibility
from color_extractor import (
    ImageDimensionError,
    NoUsablePixelsError,
    extract_colors,
)
from color_suggestions import generate_all_suggestions
from color_theory import analyze_color_theory
from config import RuntimeSettings
from fastapi import FastAPI, File, Query, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models import (
    AnalysisResponse,
    AnalysisResult,
    APIError,
    ApplicationMetadata,
    ErrorResponse,
    ExtractedColor,
    ExtractionResponse,
    FullAnalysisResponse,
    PaletteAnalysisRequest,
    ReadinessResponse,
    ServiceResponse,
    SuggestionRequest,
    SuggestionResponse,
    ValidationIssue,
)
from PIL import Image, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
CAPABILITIES = [
    "image-color-extraction",
    "palette-editing",
    "harmony-analysis",
    "contrast-review",
    "palette-export",
    "local-palette-library",
]
ColorCount = Annotated[int, Query(ge=3, le=10)]


class APIException(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    details: list[ValidationIssue] | None = None,
) -> JSONResponse:
    payload = ErrorResponse(error=APIError(code=code, message=message, details=details))
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(by_alias=True, exclude_none=True),
    )


def create_app(settings: RuntimeSettings | None = None) -> FastAPI:
    runtime = settings or RuntimeSettings.from_env()

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        application.state.ready = True
        yield
        application.state.ready = False

    application = FastAPI(
        title="ColorCraft API",
        version=runtime.application_version,
        lifespan=lifespan,
    )
    application.state.runtime_settings = runtime
    application.state.ready = False

    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(runtime.allowed_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @application.exception_handler(APIException)
    async def handle_api_exception(
        _request: Request, exception: APIException
    ) -> JSONResponse:
        return error_response(
            status_code=exception.status_code,
            code=exception.code,
            message=exception.message,
        )

    @application.exception_handler(RequestValidationError)
    async def handle_validation_exception(
        _request: Request, exception: RequestValidationError
    ) -> JSONResponse:
        details = [
            ValidationIssue(
                location=list(error["loc"]),
                message=error["msg"],
                type=error["type"],
            )
            for error in exception.errors()
        ]
        return error_response(
            status_code=422,
            code="validation_error",
            message="Request validation failed.",
            details=details,
        )

    @application.exception_handler(Exception)
    async def handle_unexpected_exception(
        _request: Request, _exception: Exception
    ) -> JSONResponse:
        return error_response(
            status_code=500,
            code="internal_error",
            message="The ColorCraft API could not complete the request. "
            "Check the terminal and retry.",
        )

    @application.get("/", response_model=ServiceResponse)
    async def root() -> ServiceResponse:
        return ServiceResponse(
            status="ok",
            service=runtime.service_name,
            version=runtime.application_version,
        )

    @application.get("/health", response_model=ServiceResponse)
    async def health() -> ServiceResponse:
        return ServiceResponse(
            status="ok",
            service=runtime.service_name,
            version=runtime.application_version,
        )

    @application.get("/metadata", response_model=ApplicationMetadata)
    async def metadata() -> ApplicationMetadata:
        return ApplicationMetadata(
            schema_version=1,
            id="colorcraft",
            name="ColorCraft",
            descriptor="Local color utility",
            version=runtime.application_version,
            icon=f"{runtime.web_url}/colorcraft-mark.svg",
            web_url=runtime.web_url,
            api_url=runtime.client_api_url,
            health_url=f"{runtime.client_api_url}/health",
            readiness_url=f"{runtime.client_api_url}/ready",
            capabilities=CAPABILITIES,
        )

    @application.get("/ready", response_model=ReadinessResponse)
    async def ready(request: Request) -> ReadinessResponse | JSONResponse:
        is_ready = bool(request.app.state.ready)
        response = ReadinessResponse(
            status="ready" if is_ready else "not_ready",
            service=runtime.service_name,
            version=runtime.application_version,
            capabilities=CAPABILITIES if is_ready else [],
        )
        if is_ready:
            return response
        return JSONResponse(
            status_code=503,
            content=response.model_dump(by_alias=True),
        )

    async def extract_uploaded_colors(
        file: UploadFile, color_count: int
    ) -> list[ExtractedColor]:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            allowed = ", ".join(sorted(ALLOWED_IMAGE_TYPES))
            raise APIException(
                415,
                "invalid_file_type",
                f"Choose a supported image type: {allowed}.",
            )

        image_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
        if not image_bytes:
            raise APIException(
                422,
                "image_decode_error",
                "The image could not be decoded. Choose a valid JPG, PNG, or "
                "WebP image.",
            )
        if len(image_bytes) > MAX_UPLOAD_BYTES:
            raise APIException(
                413,
                "upload_too_large",
                f"Images must be {MAX_UPLOAD_BYTES // (1024 * 1024)} MB or smaller.",
            )

        try:
            extracted = await run_in_threadpool(
                extract_colors, image_bytes, color_count
            )
            return [ExtractedColor.model_validate(color) for color in extracted]
        except ImageDimensionError:
            raise APIException(
                413,
                "image_dimensions_too_large",
                "The decoded image dimensions exceed the safe processing limit.",
            ) from None
        except NoUsablePixelsError:
            raise APIException(
                422,
                "no_visible_pixels",
                "The image does not contain any visible pixels.",
            ) from None
        except (
            Image.DecompressionBombError,
            UnidentifiedImageError,
            OSError,
            ValueError,
        ):
            raise APIException(
                422,
                "image_decode_error",
                "The image could not be decoded. Choose a valid JPG, PNG, or "
                "WebP image.",
            ) from None

    @application.post(
        "/api/extract-colors",
        response_model=ExtractionResponse,
        responses={
            413: {"model": ErrorResponse},
            415: {"model": ErrorResponse},
            422: {"model": ErrorResponse},
        },
    )
    async def extract_colors_endpoint(
        file: UploadFile = File(...),
        n_colors: ColorCount = 5,
    ) -> ExtractionResponse:
        colors = await extract_uploaded_colors(file, n_colors)
        return ExtractionResponse(
            success=True,
            colors=colors,
            count=len(colors),
        )

    def analyze_palette(request: PaletteAnalysisRequest) -> AnalysisResult:
        colors = [color.model_dump(by_alias=False) for color in request.colors]
        return AnalysisResult(
            color_theory=analyze_color_theory(colors),
            accessibility=analyze_accessibility(colors),
        )

    @application.post(
        "/api/analyze-colors",
        response_model=AnalysisResponse,
        responses={422: {"model": ErrorResponse}},
    )
    async def analyze_colors_endpoint(
        request: PaletteAnalysisRequest,
    ) -> AnalysisResponse:
        return AnalysisResponse(
            success=True,
            analysis=analyze_palette(request),
        )

    @application.post(
        "/api/suggest-colors",
        response_model=SuggestionResponse,
        responses={422: {"model": ErrorResponse}},
    )
    async def suggest_colors_endpoint(
        request: SuggestionRequest,
    ) -> SuggestionResponse:
        colors = [color.model_dump(by_alias=False) for color in request.colors]
        return SuggestionResponse(
            success=True,
            suggestions=[generate_all_suggestions(color) for color in colors],
        )

    @application.post(
        "/api/full-analysis",
        response_model=FullAnalysisResponse,
        responses={
            413: {"model": ErrorResponse},
            415: {"model": ErrorResponse},
            422: {"model": ErrorResponse},
        },
    )
    async def full_analysis_endpoint(
        file: UploadFile = File(...),
        n_colors: ColorCount = 5,
    ) -> FullAnalysisResponse:
        colors = await extract_uploaded_colors(file, n_colors)
        analysis_colors = [
            {
                "hex": color.hex,
                "rgb": color.rgb.model_dump(),
                "hsl": color.hsl.model_dump(),
            }
            for color in colors
        ]
        return FullAnalysisResponse(
            success=True,
            colors=colors,
            analysis=AnalysisResult(
                color_theory=analyze_color_theory(analysis_colors),
                accessibility=analyze_accessibility(analysis_colors),
            ),
        )

    return application


SETTINGS = RuntimeSettings.from_env()
app = create_app(SETTINGS)


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=SETTINGS.api_host,
        port=SETTINGS.api_port,
    )
