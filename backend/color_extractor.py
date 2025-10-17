"""
Color extraction using KMeans clustering in LAB color space.
"""
import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
import io


def rgb_to_lab(rgb):
    """Convert RGB to LAB color space for perceptual clustering."""
    # Normalize RGB to 0-1
    rgb = np.array(rgb) / 255.0
    
    # Convert to XYZ
    def gamma_correction(channel):
        if channel > 0.04045:
            return ((channel + 0.055) / 1.055) ** 2.4
        return channel / 12.92
    
    rgb = np.array([gamma_correction(c) for c in rgb])
    
    # RGB to XYZ transformation matrix (sRGB D65)
    matrix = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041]
    ])
    
    xyz = np.dot(matrix, rgb) * 100
    
    # XYZ to LAB
    def f(t):
        delta = 6/29
        if t > delta**3:
            return t**(1/3)
        return t/(3*delta**2) + 4/29
    
    # D65 white point
    xn, yn, zn = 95.047, 100.000, 108.883
    
    fx = f(xyz[0] / xn)
    fy = f(xyz[1] / yn)
    fz = f(xyz[2] / zn)
    
    L = 116 * fy - 16
    a = 500 * (fx - fy)
    b = 200 * (fy - fz)
    
    return [L, a, b]


def lab_to_rgb(lab):
    """Convert LAB back to RGB."""
    L, a, b = lab
    
    # LAB to XYZ
    fy = (L + 16) / 116
    fx = a / 500 + fy
    fz = fy - b / 200
    
    def f_inv(t):
        delta = 6/29
        if t > delta:
            return t**3
        return 3 * delta**2 * (t - 4/29)
    
    # D65 white point
    xn, yn, zn = 95.047, 100.000, 108.883
    
    xyz = np.array([
        f_inv(fx) * xn,
        f_inv(fy) * yn,
        f_inv(fz) * zn
    ]) / 100
    
    # XYZ to RGB
    matrix = np.array([
        [3.2404542, -1.5371385, -0.4985314],
        [-0.9692660, 1.8760108, 0.0415560],
        [0.0556434, -0.2040259, 1.0572252]
    ])
    
    rgb = np.dot(matrix, xyz)
    
    # Gamma correction
    def gamma_inv(channel):
        if channel > 0.0031308:
            return 1.055 * (channel ** (1/2.4)) - 0.055
        return 12.92 * channel
    
    rgb = np.array([gamma_inv(c) for c in rgb])
    rgb = np.clip(rgb * 255, 0, 255).astype(int)
    
    return rgb.tolist()


def extract_colors(image_bytes: bytes, n_colors: int = 5) -> list:
    """
    Extract dominant colors from an image using KMeans in LAB color space.
    
    Args:
        image_bytes: Image file bytes
        n_colors: Number of colors to extract
        
    Returns:
        List of color dictionaries with hex, rgb, and hsl values
    """
    # Load image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize for faster processing (max dimension 400px)
    max_size = 400
    if max(image.size) > max_size:
        ratio = max_size / max(image.size)
        new_size = tuple(int(dim * ratio) for dim in image.size)
        image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    # Get pixel data
    pixels = np.array(image).reshape(-1, 3)
    
    # Sample pixels if too many (for performance)
    if len(pixels) > 10000:
        indices = np.random.choice(len(pixels), 10000, replace=False)
        pixels = pixels[indices]
    
    # Convert to LAB color space for perceptual clustering
    lab_pixels = np.array([rgb_to_lab(pixel) for pixel in pixels])
    
    # Apply KMeans clustering directly on LAB space
    # Using multiple initializations for better results
    kmeans = KMeans(
        n_clusters=n_colors, 
        random_state=42, 
        n_init=20,
        max_iter=300
    )
    kmeans.fit(lab_pixels)
    
    # Get cluster centers and find representative colors
    cluster_colors = []
    for i in range(n_colors):
        # Find all pixels in this cluster
        cluster_mask = kmeans.labels_ == i
        cluster_lab_pixels = lab_pixels[cluster_mask]
        
        # Use median color of cluster for robustness
        median_lab = np.median(cluster_lab_pixels, axis=0)
        cluster_colors.append(median_lab)
    
    # Convert LAB colors back to RGB
    colors = []
    for lab_color in cluster_colors:
        rgb = lab_to_rgb(lab_color)
        hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
        hsl = rgb_to_hsl(rgb)
        
        colors.append({
            'hex': hex_color,
            'rgb': {'r': rgb[0], 'g': rgb[1], 'b': rgb[2]},
            'hsl': {'h': hsl[0], 's': hsl[1], 'l': hsl[2]}
        })
    
    return colors


def rgb_to_hsl(rgb):
    """Convert RGB to HSL."""
    r, g, b = [x / 255.0 for x in rgb]
    
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    l = (max_c + min_c) / 2
    
    if max_c == min_c:
        h = s = 0
    else:
        d = max_c - min_c
        s = d / (2 - max_c - min_c) if l > 0.5 else d / (max_c + min_c)
        
        if max_c == r:
            h = (g - b) / d + (6 if g < b else 0)
        elif max_c == g:
            h = (b - r) / d + 2
        else:
            h = (r - g) / d + 4
        
        h /= 6
    
    return [round(h * 360), round(s * 100), round(l * 100)]


def hsl_to_rgb(hsl):
    """Convert HSL to RGB."""
    h, s, l = hsl[0] / 360.0, hsl[1] / 100.0, hsl[2] / 100.0
    
    if s == 0:
        r = g = b = l
    else:
        def hue_to_rgb(p, q, t):
            if t < 0:
                t += 1
            if t > 1:
                t -= 1
            if t < 1/6:
                return p + (q - p) * 6 * t
            if t < 1/2:
                return q
            if t < 2/3:
                return p + (q - p) * (2/3 - t) * 6
            return p
        
        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q
        
        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)
    
    return [round(r * 255), round(g * 255), round(b * 255)]

