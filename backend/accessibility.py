"""WCAG relative-luminance and contrast calculations for sRGB colors."""

AA_NORMAL_MINIMUM = 4.5
AA_LARGE_MINIMUM = 3.0
AAA_NORMAL_MINIMUM = 7.0
AAA_LARGE_MINIMUM = 4.5


def hex_to_rgb(hex_color):
    """Convert hex color to RGB."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def relative_luminance(rgb):
    """Calculate relative luminance using the current sRGB breakpoint."""
    def adjust(channel):
        channel = channel / 255.0
        if channel <= 0.04045:
            return channel / 12.92
        return ((channel + 0.055) / 1.055) ** 2.4
    
    r, g, b = [adjust(c) for c in rgb]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(color1, color2):
    """
    Calculate WCAG contrast ratio between two colors.
    
    Args:
        color1: RGB tuple or hex string
        color2: RGB tuple or hex string
        
    Returns:
        Contrast ratio (1-21)
    """
    if isinstance(color1, str):
        color1 = hex_to_rgb(color1)
    if isinstance(color2, str):
        color2 = hex_to_rgb(color2)
    
    l1 = relative_luminance(color1)
    l2 = relative_luminance(color2)
    
    lighter = max(l1, l2)
    darker = min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)


def wcag_rating(ratio):
    """
    Get WCAG rating for a contrast ratio.
    
    Returns:
        Dictionary with AA and AAA compliance for normal and large text
    """
    return {
        'ratio': round(ratio, 2),
        'aa_normal': ratio >= AA_NORMAL_MINIMUM,
        'aa_large': ratio >= AA_LARGE_MINIMUM,
        'aaa_normal': ratio >= AAA_NORMAL_MINIMUM,
        'aaa_large': ratio >= AAA_LARGE_MINIMUM
    }


def analyze_accessibility(colors):
    """
    Analyze accessibility for all color pairs.
    
    Args:
        colors: List of color dictionaries with 'hex' key
        
    Returns:
        Dictionary with accessibility analysis
    """
    results = {
        'pairs': [],
        'issues': [],
        'summary': {
            'total_pairs': 0,
            'aa_normal_passes': 0,
            'aa_large_passes': 0,
            'aaa_normal_passes': 0,
            'aaa_large_passes': 0
        }
    }
    
    # Analyze all pairs
    for i, color1 in enumerate(colors):
        for j, color2 in enumerate(colors):
            if i >= j:
                continue
            
            ratio = contrast_ratio(color1['hex'], color2['hex'])
            rating = wcag_rating(ratio)
            
            pair_result = {
                'color1': color1['hex'],
                'color2': color2['hex'],
                'ratio': rating['ratio'],
                'aa_normal': rating['aa_normal'],
                'aa_large': rating['aa_large'],
                'aaa_normal': rating['aaa_normal'],
                'aaa_large': rating['aaa_large']
            }
            
            results['pairs'].append(pair_result)
            results['summary']['total_pairs'] += 1

            if rating['aa_normal']:
                results['summary']['aa_normal_passes'] += 1
            if rating['aa_large']:
                results['summary']['aa_large_passes'] += 1
            if rating['aaa_normal']:
                results['summary']['aaa_normal_passes'] += 1
            if rating['aaa_large']:
                results['summary']['aaa_large_passes'] += 1
            
            # Flag potential issues
            if not rating['aa_large']:
                results['issues'].append({
                    'type': 'low_contrast',
                    'message': f"Low contrast detected between {color1['hex']} and {color2['hex']} (ratio: {rating['ratio']})",
                    'severity': 'warning',
                    'color1': color1['hex'],
                    'color2': color2['hex'],
                    'ratio': rating['ratio']
                })
    
    return results

