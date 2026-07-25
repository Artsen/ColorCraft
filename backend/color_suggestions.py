"""
Color suggestion engine for documented geometric color transformations.
"""

from color_extractor import hsl_to_rgb, rgb_to_hsl


def normalize_hue(hue):
    """Normalize hue to 0-360 range."""
    while hue < 0:
        hue += 360
    while hue >= 360:
        hue -= 360
    return hue


def generate_complementary(base_color):
    """
    Generate complementary color (180° opposite).
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    comp_hue = normalize_hue(h + 180)

    suggestions = [
        {
            "hue": comp_hue,
            "saturation": s,
            "lightness": l,
            "name": "Direct Complement",
            "description": "Hue shifted by 180°; saturation and lightness unchanged",
        },
        {
            "hue": comp_hue,
            "saturation": min(100, s + 15),
            "lightness": max(20, l - 20),
            "name": "Darker Complement",
            "description": "Hue +180°, saturation +15, lightness -20",
        },
        {
            "hue": comp_hue,
            "saturation": max(30, s - 20),
            "lightness": min(90, l + 20),
            "name": "Lighter Complement",
            "description": "Hue +180°, saturation -20, lightness +20",
        },
    ]

    return {
        "type": "Complementary",
        "angle": "180°",
        "description": "Moves the hue 180° around the color wheel. Color separation and contrast depend on saturation, lightness, and assigned roles.",
        "use_cases": [
            "Comparing colors with opposite hues",
            "Exploring emphasis after contrast review",
            "Testing role assignments with strong hue separation",
        ],
        "common_associations": "Emphasis, opposition, and color separation",
        "examples": "Red & Green, Blue & Orange, Yellow & Purple",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def generate_triadic(base_color):
    """
    Generate triadic colors (120° apart).
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    suggestions = []

    # Two triadic partners
    for offset in [120, 240]:
        tri_hue = normalize_hue(h + offset)
        suggestions.extend(
            [
                {
                    "hue": tri_hue,
                    "saturation": s,
                    "lightness": l,
                    "name": f"Triadic Partner {offset}°",
                    "description": f"Hue +{offset}°; saturation and lightness unchanged",
                },
                {
                    "hue": tri_hue,
                    "saturation": min(100, s + 10),
                    "lightness": l,
                    "name": f"Saturated Triadic {offset}°",
                    "description": f"Hue +{offset}°, saturation +10, lightness unchanged",
                },
            ]
        )

    return {
        "type": "Triadic",
        "angle": "120°",
        "description": "Moves the hue by 120° and 240° to form three evenly spaced hue positions. Suitability depends on context and assigned roles.",
        "use_cases": [
            "Exploring three-category color systems",
            "Comparing evenly spaced hue options",
            "Testing categorical data colors",
        ],
        "common_associations": "Variety, category separation, and three-part systems",
        "examples": "Red-Yellow-Blue (primary colors), Orange-Green-Purple (secondary colors)",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def generate_analogous(base_color):
    """
    Generate analogous colors (30-60° adjacent).
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    suggestions = []

    # Neighbors on both sides
    for offset in [-60, -30, 30, 60]:
        ana_hue = normalize_hue(h + offset)
        suggestions.append(
            {
                "hue": ana_hue,
                "saturation": s,
                "lightness": l,
                "name": f"Analogous {abs(offset)}° {'Left' if offset < 0 else 'Right'}",
                "description": f"Adjacent color {abs(offset)}° away",
            }
        )

    return {
        "type": "Analogous",
        "angle": "30-60°",
        "description": "Moves the hue by 30° or 60° in either direction while preserving saturation and lightness.",
        "use_cases": [
            "Exploring nearby hue variations",
            "Testing gradients after interpolation review",
            "Building related category colors",
        ],
        "common_associations": "Continuity, proximity, and related color groups",
        "examples": "Blue-Blue/Green-Green, Red-Orange-Yellow",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def generate_split_complementary(base_color):
    """
    Generate split-complementary colors.

    Similar to complementary but with two colors flanking the complement.
    More nuanced than pure complementary.
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    comp_hue = normalize_hue(h + 180)

    suggestions = []

    # Split complement: 150° and 210° (or 180° ± 30°)
    for offset in [-30, 30]:
        split_hue = normalize_hue(comp_hue + offset)
        suggestions.extend(
            [
                {
                    "hue": split_hue,
                    "saturation": s,
                    "lightness": l,
                    "name": f"Split Complement {'+30°' if offset > 0 else '-30°'}",
                    "description": f"Flanking the complement by {abs(offset)}°",
                },
                {
                    "hue": split_hue,
                    "saturation": max(40, s - 15),
                    "lightness": min(85, l + 15),
                    "name": f"Lighter Split {'+30°' if offset > 0 else '-30°'}",
                    "description": f"Hue {150 if offset < 0 else 210:+d}°, saturation -15, lightness +15",
                },
            ]
        )

    return {
        "type": "Split-Complementary",
        "angle": "150° & 210°",
        "description": "Moves the hue by 150° and 210° to place two options around the direct complement.",
        "use_cases": [
            "Comparing two alternatives near a complementary hue",
            "Exploring three-color role assignments",
            "Testing categorical separation",
        ],
        "common_associations": "Contrast variation and a three-color structure",
        "examples": "Blue with Yellow-Orange and Red-Orange",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def generate_tetradic(base_color):
    """
    Generate tetradic/square colors (90° apart).
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    suggestions = []

    # Three partners at 90°, 180°, 270°
    for offset in [90, 180, 270]:
        tet_hue = normalize_hue(h + offset)
        suggestions.append(
            {
                "hue": tet_hue,
                "saturation": s,
                "lightness": l,
                "name": f"Tetradic {offset}°",
                "description": f"Square harmony partner at {offset}°",
            }
        )

    return {
        "type": "Tetradic (Square)",
        "angle": "90°",
        "description": "Moves the hue by 90°, 180°, and 270° to form four evenly spaced hue positions.",
        "use_cases": [
            "Exploring four-category color systems",
            "Comparing quarter-turn hue offsets",
            "Testing multi-role assignments",
        ],
        "common_associations": "Variety, four-part systems, and category separation",
        "examples": "Red-Yellow-Green-Blue, Orange-Chartreuse-Cyan-Violet",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def generate_rectangular(base_color):
    """
    Generate rectangular/compound colors.

    Two complementary pairs that form a rectangle on the wheel.
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    suggestions = []

    # Rectangular: 60°, 180°, 240° (or other rectangle configurations)
    for offset in [60, 180, 240]:
        rect_hue = normalize_hue(h + offset)
        suggestions.append(
            {
                "hue": rect_hue,
                "saturation": s,
                "lightness": l,
                "name": f"Rectangular {offset}°",
                "description": f"Rectangle harmony at {offset}°",
            }
        )

    return {
        "type": "Rectangular (Compound)",
        "angle": "60° & 180°",
        "description": "Moves the hue by 60°, 180°, and 240° to form two opposite hue pairs.",
        "use_cases": [
            "Exploring two complementary pairs",
            "Testing four-category color systems",
            "Comparing primary and secondary role groups",
        ],
        "common_associations": "Paired opposites and multi-category systems",
        "examples": "Blue-Orange paired with Yellow-Violet",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def generate_monochromatic(base_color):
    """
    Generate monochromatic variations (same hue, different S/L).
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    suggestions = [
        {
            "hue": h,
            "saturation": max(10, s - 30),
            "lightness": min(95, l + 30),
            "name": "Lighter Tint",
            "description": "Same hue, saturation -30, lightness +30",
        },
        {
            "hue": h,
            "saturation": max(5, s - 40),
            "lightness": min(98, l + 40),
            "name": "Very Light Tint",
            "description": "Same hue, saturation -40, lightness +40",
        },
        {
            "hue": h,
            "saturation": min(100, s + 20),
            "lightness": max(15, l - 30),
            "name": "Darker Shade",
            "description": "Same hue, saturation +20, lightness -30",
        },
        {
            "hue": h,
            "saturation": min(100, s + 10),
            "lightness": max(10, l - 40),
            "name": "Very Dark Shade",
            "description": "Same hue, saturation +10, lightness -40",
        },
        {
            "hue": h,
            "saturation": max(15, s - 25),
            "lightness": l,
            "name": "Desaturated Tone",
            "description": "Same hue, saturation -25, lightness unchanged",
        },
        {
            "hue": h,
            "saturation": min(100, s + 30),
            "lightness": l,
            "name": "Saturated Tone",
            "description": "Same hue, saturation +30, lightness unchanged",
        },
    ]

    return {
        "type": "Monochromatic",
        "angle": "0° (same hue)",
        "description": "Keeps the hue fixed and changes saturation and lightness. Contrast and role suitability require separate review.",
        "use_cases": [
            "Exploring states within one hue family",
            "Testing light and dark role candidates",
            "Building ordered surface levels",
        ],
        "common_associations": "Continuity, hierarchy, and one-hue systems",
        "examples": "Navy-Blue-Sky Blue-Powder Blue, Forest-Sage-Mint Green",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def generate_double_complementary(base_color):
    """
    Generate double-complementary (two sets of complements).

    Also known as tetradic rectangle.
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    suggestions = []

    # Pick a second base 30° away, then both complements
    second_base = normalize_hue(h + 30)

    for base_hue in [second_base]:
        comp_hue = normalize_hue(base_hue + 180)
        suggestions.extend(
            [
                {
                    "hue": base_hue,
                    "saturation": s,
                    "lightness": l,
                    "name": "Second Base",
                    "description": "30° from original",
                },
                {
                    "hue": comp_hue,
                    "saturation": s,
                    "lightness": l,
                    "name": "Second Complement",
                    "description": "Complement of second base",
                },
            ]
        )

    # Original complement
    suggestions.append(
        {
            "hue": normalize_hue(h + 180),
            "saturation": s,
            "lightness": l,
            "name": "Original Complement",
            "description": "Complement of base color",
        }
    )

    return {
        "type": "Double-Complementary",
        "angle": "Two 180° pairs",
        "description": "Adds a hue 30° from the base and the 180° complements of both hues.",
        "use_cases": [
            "Exploring two related base hues and their complements",
            "Testing four-category color systems",
            "Comparing two opposite hue pairs",
        ],
        "common_associations": "Paired opposites and four-color systems",
        "examples": "Red-Green paired with Blue-Orange",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def generate_shades_tints(base_color):
    """
    Generate pure shades (darker) and tints (lighter).
    """
    h, s, l = base_color["hsl"]["h"], base_color["hsl"]["s"], base_color["hsl"]["l"]

    suggestions = []

    # Tints (lighter)
    for i, lightness_offset in enumerate([15, 30, 45], 1):
        suggestions.append(
            {
                "hue": h,
                "saturation": s,
                "lightness": min(98, l + lightness_offset),
                "name": f"Tint {i}",
                "description": f"{lightness_offset}% lighter",
            }
        )

    # Shades (darker)
    for i, lightness_offset in enumerate([15, 30, 45], 1):
        suggestions.append(
            {
                "hue": h,
                "saturation": s,
                "lightness": max(5, l - lightness_offset),
                "name": f"Shade {i}",
                "description": f"{lightness_offset}% darker",
            }
        )

    return {
        "type": "Shades & Tints",
        "angle": "Same hue, varied lightness",
        "description": "Keeps hue and saturation fixed while changing lightness by 15, 30, or 45 percentage points.",
        "use_cases": [
            "Exploring interface state candidates",
            "Comparing surface levels",
            "Testing text and background role candidates",
        ],
        "common_associations": "Hierarchy, state variation, and tonal scales",
        "examples": "Light Blue → Blue → Navy, Pink → Red → Maroon",
        "suggestions": [convert_hsl_to_color(s) for s in suggestions],
    }


def convert_hsl_to_color(hsl_obj):
    """Convert HSL suggestion object to full color object."""
    h, s, l = hsl_obj["hue"], hsl_obj["saturation"], hsl_obj["lightness"]
    rgb = hsl_to_rgb([h, s, l])
    canonical_hsl = rgb_to_hsl(rgb)
    hex_color = "#{:02x}{:02x}{:02x}".format(*rgb)

    return {
        "hex": hex_color,
        "rgb": {"r": rgb[0], "g": rgb[1], "b": rgb[2]},
        "hsl": {"h": canonical_hsl[0], "s": canonical_hsl[1], "l": canonical_hsl[2]},
        "name": hsl_obj["name"],
        "description": hsl_obj["description"],
    }


def generate_all_suggestions(base_color):
    """
    Generate all harmony-based suggestions for a base color.

    Returns a comprehensive list of color suggestions organized by harmony type.
    """
    return {
        "base_color": base_color,
        "harmonies": [
            generate_complementary(base_color),
            generate_analogous(base_color),
            generate_triadic(base_color),
            generate_split_complementary(base_color),
            generate_tetradic(base_color),
            generate_rectangular(base_color),
            generate_monochromatic(base_color),
            generate_double_complementary(base_color),
            generate_shades_tints(base_color),
        ],
    }
