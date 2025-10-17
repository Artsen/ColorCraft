"""
Color theory analysis and harmony detection.
"""
import math
import numpy as np


def normalize_hue(hue):
    """Normalize hue to 0-360 range."""
    while hue < 0:
        hue += 360
    while hue >= 360:
        hue -= 360
    return hue


def hue_distance(h1, h2):
    """Calculate shortest distance between two hues on color wheel."""
    diff = abs(h1 - h2)
    return min(diff, 360 - diff)


def detect_complementary(hues, tolerance=30):
    """Detect complementary color pairs (180° apart)."""
    pairs = []
    for i, h1 in enumerate(hues):
        for j, h2 in enumerate(hues):
            if i >= j:
                continue
            dist = hue_distance(h1, h2)
            if abs(dist - 180) <= tolerance:
                pairs.append((i, j))
    return pairs


def detect_analogous(hues, tolerance=30):
    """Detect analogous colors (30-60° apart)."""
    groups = []
    for i, h1 in enumerate(hues):
        for j, h2 in enumerate(hues):
            if i >= j:
                continue
            dist = hue_distance(h1, h2)
            if 30 - tolerance <= dist <= 60 + tolerance:
                groups.append((i, j))
    return groups


def detect_triadic(hues, tolerance=30):
    """Detect triadic harmony (120° apart)."""
    triads = []
    n = len(hues)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                h1, h2, h3 = hues[i], hues[j], hues[k]
                
                # Check if roughly 120° apart
                d12 = hue_distance(h1, h2)
                d23 = hue_distance(h2, h3)
                d31 = hue_distance(h3, h1)
                
                if (abs(d12 - 120) <= tolerance and 
                    abs(d23 - 120) <= tolerance and 
                    abs(d31 - 120) <= tolerance):
                    triads.append((i, j, k))
    
    return triads


def detect_tetradic(hues, tolerance=30):
    """Detect tetradic/square harmony (90° apart)."""
    tetrads = []
    n = len(hues)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                for l in range(k + 1, n):
                    h_list = sorted([hues[i], hues[j], hues[k], hues[l]])
                    
                    # Check if roughly 90° apart
                    distances = [
                        hue_distance(h_list[0], h_list[1]),
                        hue_distance(h_list[1], h_list[2]),
                        hue_distance(h_list[2], h_list[3]),
                        hue_distance(h_list[3], h_list[0])
                    ]
                    
                    if all(abs(d - 90) <= tolerance for d in distances):
                        tetrads.append((i, j, k, l))
    
    return tetrads


def detect_split_complementary(hues, tolerance=30):
    """Detect split-complementary (base + two colors adjacent to complement)."""
    groups = []
    for i, base_hue in enumerate(hues):
        complement = normalize_hue(base_hue + 180)
        
        # Find colors near the complement
        split_colors = []
        for j, h in enumerate(hues):
            if i == j:
                continue
            
            # Check if within 30° of complement (but not exactly complementary)
            dist_to_comp = hue_distance(h, complement)
            if 20 <= dist_to_comp <= 40:
                split_colors.append(j)
        
        if len(split_colors) >= 2:
            groups.append((i, split_colors[0], split_colors[1]))
    
    return groups


def detect_monochromatic(colors):
    """Detect monochromatic scheme (same hue, different saturation/lightness)."""
    if len(colors) < 2:
        return False
    
    hues = [c['hsl']['h'] for c in colors]
    
    # Check if all hues are similar (within 15°)
    base_hue = hues[0]
    for hue in hues[1:]:
        if hue_distance(base_hue, hue) > 15:
            return False
    
    # Check if there's variation in saturation or lightness
    saturations = [c['hsl']['s'] for c in colors]
    lightnesses = [c['hsl']['l'] for c in colors]
    
    sat_range = max(saturations) - min(saturations)
    light_range = max(lightnesses) - min(lightnesses)
    
    return sat_range > 10 or light_range > 10


def analyze_warm_cool_balance(colors):
    """Analyze warm vs cool color balance."""
    warm_count = 0
    cool_count = 0
    
    for color in colors:
        hue = color['hsl']['h']
        
        # Warm: red to yellow (0-60, 300-360)
        # Cool: cyan to blue (120-300)
        if (0 <= hue <= 60) or (300 <= hue <= 360):
            warm_count += 1
        elif 120 <= hue <= 300:
            cool_count += 1
    
    total = warm_count + cool_count
    if total == 0:
        return {'balance': 'neutral', 'warm_ratio': 0, 'cool_ratio': 0}
    
    warm_ratio = warm_count / len(colors)
    cool_ratio = cool_count / len(colors)
    
    if warm_ratio > 0.7:
        balance = 'warm'
    elif cool_ratio > 0.7:
        balance = 'cool'
    else:
        balance = 'balanced'
    
    return {
        'balance': balance,
        'warm_count': warm_count,
        'cool_count': cool_count,
        'warm_ratio': round(warm_ratio, 2),
        'cool_ratio': round(cool_ratio, 2)
    }


def calculate_harmony_score(colors, harmonies):
    """Calculate overall harmony score (0-100)."""
    score = 50  # Base score
    
    # Bonus for detected harmonies
    if harmonies['complementary']:
        score += 15
    if harmonies['triadic']:
        score += 20
    if harmonies['tetradic']:
        score += 20
    if harmonies['analogous']:
        score += 10
    if harmonies['split_complementary']:
        score += 15
    if harmonies['monochromatic']:
        score += 10
    
    # Analyze saturation balance
    saturations = [c['hsl']['s'] for c in colors]
    sat_std = np.std(saturations)
    if sat_std < 15:  # Low variation is good for harmony
        score += 5
    
    # Analyze lightness balance
    lightnesses = [c['hsl']['l'] for c in colors]
    light_std = np.std(lightnesses)
    if 15 < light_std < 30:  # Moderate variation is good
        score += 5
    
    # Penalize if too many colors with no clear harmony
    if len(colors) > 6 and not any([
        harmonies['complementary'],
        harmonies['triadic'],
        harmonies['tetradic']
    ]):
        score -= 10
    
    return min(100, max(0, score))


def analyze_color_theory(colors):
    """
    Perform comprehensive color theory analysis.
    
    Args:
        colors: List of color dictionaries with hex, rgb, and hsl values
        
    Returns:
        Dictionary with harmony analysis, tags, and score
    """
    hues = [c['hsl']['h'] for c in colors]
    
    # Detect harmonies
    harmonies = {
        'complementary': detect_complementary(hues),
        'analogous': detect_analogous(hues),
        'triadic': detect_triadic(hues),
        'tetradic': detect_tetradic(hues),
        'split_complementary': detect_split_complementary(hues),
        'monochromatic': detect_monochromatic(colors)
    }
    
    # Analyze warm/cool balance
    temp_balance = analyze_warm_cool_balance(colors)
    
    # Calculate harmony score
    score = calculate_harmony_score(colors, harmonies)
    
    # Generate harmony tags
    tags = []
    
    if harmonies['complementary']:
        tags.append('Complementary Harmony Detected')
    if harmonies['triadic']:
        tags.append('Triadic Harmony Detected')
    if harmonies['tetradic']:
        tags.append('Tetradic Harmony Detected')
    if harmonies['analogous']:
        tags.append('Analogous Colors Present')
    if harmonies['split_complementary']:
        tags.append('Split-Complementary Scheme')
    if harmonies['monochromatic']:
        tags.append('Monochromatic Palette')
    
    if temp_balance['balance'] == 'warm':
        tags.append('Warm Color Palette')
    elif temp_balance['balance'] == 'cool':
        tags.append('Cool Color Palette')
    else:
        tags.append('Balanced Temperature')
    
    # Analyze saturation
    saturations = [c['hsl']['s'] for c in colors]
    avg_sat = np.mean(saturations)
    if avg_sat > 70:
        tags.append('High Saturation')
    elif avg_sat < 30:
        tags.append('Low Saturation')
    else:
        tags.append('Balanced Saturation')
    
    # Analyze contrast
    lightnesses = [c['hsl']['l'] for c in colors]
    light_range = max(lightnesses) - min(lightnesses)
    if light_range > 60:
        tags.append('High Contrast')
    elif light_range < 20:
        tags.append('Low Contrast')
    
    return {
        'harmonies': harmonies,
        'temperature_balance': temp_balance,
        'score': score,
        'tags': tags,
        'metrics': {
            'hue_diversity': round(np.std(hues), 2),
            'saturation_avg': round(avg_sat, 2),
            'lightness_range': light_range
        }
    }

