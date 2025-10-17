"""
Color suggestion engine for generating harmonious color recommendations.
"""
from color_extractor import hsl_to_rgb
import math


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
    
    Creates maximum contrast and visual tension.
    Perfect for call-to-action buttons and emphasis.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    comp_hue = normalize_hue(h + 180)
    
    suggestions = [
        {
            'hue': comp_hue,
            'saturation': s,
            'lightness': l,
            'name': 'Direct Complement',
            'description': 'Exact opposite on the color wheel'
        },
        {
            'hue': comp_hue,
            'saturation': min(100, s + 15),
            'lightness': max(20, l - 20),
            'name': 'Rich Complement',
            'description': 'More saturated and darker for depth'
        },
        {
            'hue': comp_hue,
            'saturation': max(30, s - 20),
            'lightness': min(90, l + 20),
            'name': 'Soft Complement',
            'description': 'Lighter and less saturated for subtlety'
        }
    ]
    
    return {
        'type': 'Complementary',
        'angle': '180°',
        'description': 'Complementary colors sit opposite each other on the color wheel, creating maximum contrast and visual energy.',
        'use_cases': [
            'Call-to-action buttons that need to stand out',
            'Highlighting important UI elements',
            'Creating vibrant, attention-grabbing designs',
            'Logos that need strong visual impact'
        ],
        'mood': 'Energetic, bold, dynamic, attention-grabbing',
        'examples': 'Red & Green, Blue & Orange, Yellow & Purple',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def generate_triadic(base_color):
    """
    Generate triadic colors (120° apart).
    
    Creates balanced, vibrant palettes with strong visual interest.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    suggestions = []
    
    # Two triadic partners
    for offset in [120, 240]:
        tri_hue = normalize_hue(h + offset)
        suggestions.extend([
            {
                'hue': tri_hue,
                'saturation': s,
                'lightness': l,
                'name': f'Triadic Partner {offset}°',
                'description': 'Equal spacing for balance'
            },
            {
                'hue': tri_hue,
                'saturation': min(100, s + 10),
                'lightness': l,
                'name': f'Vibrant Triadic {offset}°',
                'description': 'Boosted saturation for impact'
            }
        ])
    
    return {
        'type': 'Triadic',
        'angle': '120°',
        'description': 'Triadic colors are evenly spaced around the color wheel, forming an equilateral triangle. This creates balanced, vibrant palettes.',
        'use_cases': [
            'Playful, energetic designs',
            'Children\'s products and educational materials',
            'Brand identities that need to feel dynamic',
            'Infographics and data visualizations'
        ],
        'mood': 'Balanced, vibrant, playful, harmonious',
        'examples': 'Red-Yellow-Blue (primary colors), Orange-Green-Purple (secondary colors)',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def generate_analogous(base_color):
    """
    Generate analogous colors (30-60° adjacent).
    
    Creates harmonious, cohesive palettes that feel natural.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    suggestions = []
    
    # Neighbors on both sides
    for offset in [-60, -30, 30, 60]:
        ana_hue = normalize_hue(h + offset)
        suggestions.append({
            'hue': ana_hue,
            'saturation': s,
            'lightness': l,
            'name': f'Analogous {abs(offset)}° {"Left" if offset < 0 else "Right"}',
            'description': f'Adjacent color {abs(offset)}° away'
        })
    
    return {
        'type': 'Analogous',
        'angle': '30-60°',
        'description': 'Analogous colors sit next to each other on the color wheel, creating harmonious, cohesive palettes that feel natural and pleasing.',
        'use_cases': [
            'Backgrounds and gradients',
            'Nature-inspired designs',
            'Calming, serene interfaces',
            'Photography and art portfolios'
        ],
        'mood': 'Harmonious, serene, cohesive, natural',
        'examples': 'Blue-Blue/Green-Green, Red-Orange-Yellow',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def generate_split_complementary(base_color):
    """
    Generate split-complementary colors.
    
    Similar to complementary but with two colors flanking the complement.
    More nuanced than pure complementary.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    comp_hue = normalize_hue(h + 180)
    
    suggestions = []
    
    # Split complement: 150° and 210° (or 180° ± 30°)
    for offset in [-30, 30]:
        split_hue = normalize_hue(comp_hue + offset)
        suggestions.extend([
            {
                'hue': split_hue,
                'saturation': s,
                'lightness': l,
                'name': f'Split Complement {"+30°" if offset > 0 else "-30°"}',
                'description': f'Flanking the complement by {abs(offset)}°'
            },
            {
                'hue': split_hue,
                'saturation': max(40, s - 15),
                'lightness': min(85, l + 15),
                'name': f'Soft Split {"+30°" if offset > 0 else "-30°"}',
                'description': 'Muted variation for subtlety'
            }
        ])
    
    return {
        'type': 'Split-Complementary',
        'angle': '150° & 210°',
        'description': 'Split-complementary uses a base color and two colors adjacent to its complement, offering contrast with more nuance than pure complementary.',
        'use_cases': [
            'Sophisticated brand palettes',
            'Web designs needing contrast without harshness',
            'Editorial layouts and magazines',
            'Product packaging with visual interest'
        ],
        'mood': 'Sophisticated, balanced, nuanced, refined',
        'examples': 'Blue with Yellow-Orange and Red-Orange',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def generate_tetradic(base_color):
    """
    Generate tetradic/square colors (90° apart).
    
    Creates rich, complex palettes with four distinct colors.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    suggestions = []
    
    # Three partners at 90°, 180°, 270°
    for offset in [90, 180, 270]:
        tet_hue = normalize_hue(h + offset)
        suggestions.append({
            'hue': tet_hue,
            'saturation': s,
            'lightness': l,
            'name': f'Tetradic {offset}°',
            'description': f'Square harmony partner at {offset}°'
        })
    
    return {
        'type': 'Tetradic (Square)',
        'angle': '90°',
        'description': 'Tetradic colors form a square on the color wheel, evenly spaced at 90° intervals. This creates rich, complex palettes with maximum variety.',
        'use_cases': [
            'Complex brand systems with multiple sub-brands',
            'Data visualizations with many categories',
            'Festive, celebratory designs',
            'Gaming interfaces and entertainment'
        ],
        'mood': 'Rich, complex, diverse, energetic',
        'examples': 'Red-Yellow-Green-Blue, Orange-Chartreuse-Cyan-Violet',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def generate_rectangular(base_color):
    """
    Generate rectangular/compound colors.
    
    Two complementary pairs that form a rectangle on the wheel.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    suggestions = []
    
    # Rectangular: 60°, 180°, 240° (or other rectangle configurations)
    for offset in [60, 180, 240]:
        rect_hue = normalize_hue(h + offset)
        suggestions.append({
            'hue': rect_hue,
            'saturation': s,
            'lightness': l,
            'name': f'Rectangular {offset}°',
            'description': f'Rectangle harmony at {offset}°'
        })
    
    return {
        'type': 'Rectangular (Compound)',
        'angle': '60° & 180°',
        'description': 'Rectangular harmony uses two complementary pairs that form a rectangle on the color wheel, offering rich contrast with balance.',
        'use_cases': [
            'Editorial designs with multiple sections',
            'Dashboard interfaces with distinct zones',
            'Marketing materials with varied content',
            'Presentation templates'
        ],
        'mood': 'Balanced, sophisticated, varied, professional',
        'examples': 'Blue-Orange paired with Yellow-Violet',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def generate_monochromatic(base_color):
    """
    Generate monochromatic variations (same hue, different S/L).
    
    Creates cohesive, elegant palettes with subtle variation.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    suggestions = [
        {
            'hue': h,
            'saturation': max(10, s - 30),
            'lightness': min(95, l + 30),
            'name': 'Lighter Tint',
            'description': 'Pastel variation for backgrounds'
        },
        {
            'hue': h,
            'saturation': max(5, s - 40),
            'lightness': min(98, l + 40),
            'name': 'Very Light Tint',
            'description': 'Nearly white for subtle accents'
        },
        {
            'hue': h,
            'saturation': min(100, s + 20),
            'lightness': max(15, l - 30),
            'name': 'Darker Shade',
            'description': 'Rich, deep variation for text'
        },
        {
            'hue': h,
            'saturation': min(100, s + 10),
            'lightness': max(10, l - 40),
            'name': 'Very Dark Shade',
            'description': 'Nearly black for strong contrast'
        },
        {
            'hue': h,
            'saturation': max(15, s - 25),
            'lightness': l,
            'name': 'Desaturated Tone',
            'description': 'Muted variation for sophistication'
        },
        {
            'hue': h,
            'saturation': min(100, s + 30),
            'lightness': l,
            'name': 'Vibrant Tone',
            'description': 'Boosted saturation for impact'
        }
    ]
    
    return {
        'type': 'Monochromatic',
        'angle': '0° (same hue)',
        'description': 'Monochromatic palettes use variations of a single hue with different saturation and lightness levels, creating cohesive, elegant designs.',
        'use_cases': [
            'Minimalist, elegant interfaces',
            'Professional corporate designs',
            'Photography portfolios',
            'Luxury brand materials'
        ],
        'mood': 'Cohesive, elegant, sophisticated, calm',
        'examples': 'Navy-Blue-Sky Blue-Powder Blue, Forest-Sage-Mint Green',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def generate_double_complementary(base_color):
    """
    Generate double-complementary (two sets of complements).
    
    Also known as tetradic rectangle.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    suggestions = []
    
    # Pick a second base 30° away, then both complements
    second_base = normalize_hue(h + 30)
    
    for base_hue in [second_base]:
        comp_hue = normalize_hue(base_hue + 180)
        suggestions.extend([
            {
                'hue': base_hue,
                'saturation': s,
                'lightness': l,
                'name': 'Second Base',
                'description': '30° from original'
            },
            {
                'hue': comp_hue,
                'saturation': s,
                'lightness': l,
                'name': 'Second Complement',
                'description': 'Complement of second base'
            }
        ])
    
    # Original complement
    suggestions.append({
        'hue': normalize_hue(h + 180),
        'saturation': s,
        'lightness': l,
        'name': 'Original Complement',
        'description': 'Complement of base color'
    })
    
    return {
        'type': 'Double-Complementary',
        'angle': 'Two 180° pairs',
        'description': 'Double-complementary uses two pairs of complementary colors, creating rich, dynamic palettes with strong contrast.',
        'use_cases': [
            'Bold, energetic brand identities',
            'Sports team colors and jerseys',
            'Festival and event materials',
            'Attention-grabbing advertisements'
        ],
        'mood': 'Bold, energetic, dynamic, striking',
        'examples': 'Red-Green paired with Blue-Orange',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def generate_shades_tints(base_color):
    """
    Generate pure shades (darker) and tints (lighter).
    
    Essential for creating depth and hierarchy.
    """
    h, s, l = base_color['hsl']['h'], base_color['hsl']['s'], base_color['hsl']['l']
    
    suggestions = []
    
    # Tints (lighter)
    for i, lightness_offset in enumerate([15, 30, 45], 1):
        suggestions.append({
            'hue': h,
            'saturation': s,
            'lightness': min(98, l + lightness_offset),
            'name': f'Tint {i}',
            'description': f'{lightness_offset}% lighter'
        })
    
    # Shades (darker)
    for i, lightness_offset in enumerate([15, 30, 45], 1):
        suggestions.append({
            'hue': h,
            'saturation': s,
            'lightness': max(5, l - lightness_offset),
            'name': f'Shade {i}',
            'description': f'{lightness_offset}% darker'
        })
    
    return {
        'type': 'Shades & Tints',
        'angle': 'Same hue, varied lightness',
        'description': 'Shades (darker) and tints (lighter) of the same color create depth, hierarchy, and visual interest while maintaining color identity.',
        'use_cases': [
            'UI states (hover, active, disabled)',
            'Text hierarchy (headings, body, captions)',
            'Shadows and highlights',
            'Depth and layering in designs'
        ],
        'mood': 'Structured, hierarchical, organized, clear',
        'examples': 'Light Blue → Blue → Navy, Pink → Red → Maroon',
        'suggestions': [convert_hsl_to_color(s) for s in suggestions]
    }


def convert_hsl_to_color(hsl_obj):
    """Convert HSL suggestion object to full color object."""
    h, s, l = hsl_obj['hue'], hsl_obj['saturation'], hsl_obj['lightness']
    rgb = hsl_to_rgb([h, s, l])
    hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
    
    return {
        'hex': hex_color,
        'rgb': {'r': rgb[0], 'g': rgb[1], 'b': rgb[2]},
        'hsl': {'h': h, 's': s, 'l': l},
        'name': hsl_obj['name'],
        'description': hsl_obj['description']
    }


def generate_all_suggestions(base_color):
    """
    Generate all harmony-based suggestions for a base color.
    
    Returns a comprehensive list of color suggestions organized by harmony type.
    """
    return {
        'base_color': base_color,
        'harmonies': [
            generate_complementary(base_color),
            generate_analogous(base_color),
            generate_triadic(base_color),
            generate_split_complementary(base_color),
            generate_tetradic(base_color),
            generate_rectangular(base_color),
            generate_monochromatic(base_color),
            generate_double_complementary(base_color),
            generate_shades_tints(base_color)
        ]
    }

