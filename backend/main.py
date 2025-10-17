"""
FastAPI backend for ColorCraft application.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from color_extractor import extract_colors
from color_theory import analyze_color_theory
from accessibility import analyze_accessibility
from color_suggestions import generate_all_suggestions


app = FastAPI(title="ColorCraft API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Color(BaseModel):
    hex: str
    rgb: dict
    hsl: dict


class ColorAnalysisRequest(BaseModel):
    colors: List[Color]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "ColorCraft API is running"}


@app.post("/api/extract-colors")
async def extract_colors_endpoint(
    file: UploadFile = File(...),
    n_colors: int = 5
):
    """
    Extract dominant colors from an uploaded image.
    
    Args:
        file: Image file (JPG, PNG, WebP)
        n_colors: Number of colors to extract (3-10)
        
    Returns:
        List of extracted colors with hex, rgb, and hsl values
    """
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate n_colors
    if not 3 <= n_colors <= 10:
        raise HTTPException(
            status_code=400,
            detail="n_colors must be between 3 and 10"
        )
    
    try:
        # Read file bytes
        image_bytes = await file.read()
        
        # Extract colors
        colors = extract_colors(image_bytes, n_colors)
        
        return {
            "success": True,
            "colors": colors,
            "count": len(colors)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting colors: {str(e)}"
        )


@app.post("/api/analyze-colors")
async def analyze_colors_endpoint(request: ColorAnalysisRequest):
    """
    Analyze color theory and accessibility for a set of colors.
    
    Args:
        request: ColorAnalysisRequest with list of colors
        
    Returns:
        Comprehensive color analysis including harmonies, accessibility, and score
    """
    try:
        colors = [color.model_dump() for color in request.colors]
        
        # Perform color theory analysis
        theory_analysis = analyze_color_theory(colors)
        
        # Perform accessibility analysis
        accessibility_analysis = analyze_accessibility(colors)
        
        return {
            "success": True,
            "analysis": {
                "color_theory": theory_analysis,
                "accessibility": accessibility_analysis
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing colors: {str(e)}"
        )


@app.post("/api/suggest-colors")
async def suggest_colors_endpoint(request: ColorAnalysisRequest):
    """
    Generate harmonious color suggestions for a palette.
    
    Args:
        request: ColorAnalysisRequest with list of colors
        
    Returns:
        Comprehensive color suggestions for each color in the palette
    """
    try:
        colors = [color.model_dump() for color in request.colors]
        
        # Generate suggestions for each color
        all_suggestions = []
        for color in colors:
            suggestions = generate_all_suggestions(color)
            all_suggestions.append(suggestions)
        
        return {
            "success": True,
            "suggestions": all_suggestions
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating suggestions: {str(e)}"
        )


@app.post("/api/full-analysis")
async def full_analysis_endpoint(
    file: UploadFile = File(...),
    n_colors: int = 5
):
    """
    Extract colors from image and perform full analysis in one request.
    
    Args:
        file: Image file (JPG, PNG, WebP)
        n_colors: Number of colors to extract (3-10)
        
    Returns:
        Extracted colors with full color theory and accessibility analysis
    """
    # Extract colors
    extract_result = await extract_colors_endpoint(file, n_colors)
    colors = extract_result["colors"]
    
    # Analyze colors
    color_objects = [Color(**color) for color in colors]
    analysis_result = await analyze_colors_endpoint(
        ColorAnalysisRequest(colors=color_objects)
    )
    
    return {
        "success": True,
        "colors": colors,
        "analysis": analysis_result["analysis"]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

