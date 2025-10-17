import { Color } from '../App'

interface ColorPaletteProps {
  colors: Color[]
  onColorChange: (index: number, color: Color) => void
  onAddColor: () => void
  onRemoveColor: (index: number) => void
}

export default function ColorPalette({
  colors,
  onColorChange,
  onAddColor,
  onRemoveColor,
}: ColorPaletteProps) {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  const rgbToHsl = (rgb: { r: number; g: number; b: number }) => {
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  }

  const handleHexChange = (index: number, hex: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex) && hex.length === 7) return

    const rgb = hexToRgb(hex)
    const hsl = rgbToHsl(rgb)

    onColorChange(index, { hex, rgb, hsl })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {colors.map((color, index) => (
          <div
            key={index}
            className="relative bg-dark-tertiary rounded-lg p-3 border border-border-subtle hover:border-border-default transition-colors"
          >
            {/* Remove Button */}
            <button
              onClick={() => onRemoveColor(index)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors text-xs"
            >
              ×
            </button>

            {/* Color Swatch */}
            <div
              className="w-full h-20 rounded-md mb-3 cursor-pointer"
              style={{ backgroundColor: color.hex }}
              onClick={() => {
                const input = document.getElementById(`color-picker-${index}`) as HTMLInputElement
                input?.click()
              }}
            />

            <input
              id={`color-picker-${index}`}
              type="color"
              value={color.hex}
              onChange={(e) => handleHexChange(index, e.target.value)}
              className="hidden"
            />

            {/* Color Values */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary text-[10px]">HEX</span>
                <input
                  type="text"
                  value={color.hex}
                  onChange={(e) => handleHexChange(index, e.target.value)}
                  className="flex-1 px-2 py-1 bg-dark-secondary border border-border-subtle rounded text-xs font-mono text-text-primary focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="text-text-secondary text-[10px]">
                RGB: {color.rgb?.r ?? 0}, {color.rgb?.g ?? 0}, {color.rgb?.b ?? 0}
              </div>

              <div className="text-text-secondary text-[10px]">
                HSL: {color.hsl?.h ?? 0}°, {color.hsl?.s ?? 0}%, {color.hsl?.l ?? 0}%
              </div>
            </div>
          </div>
        ))}

        {/* Add Color Button */}
        <button
          onClick={onAddColor}
          className="bg-dark-tertiary border border-dashed border-border-default rounded-lg p-3 hover:border-purple-500 hover:bg-dark-hover transition-all flex items-center justify-center min-h-[140px]"
        >
          <div className="text-center">
            <div className="text-3xl text-text-tertiary mb-1">+</div>
            <div className="text-xs text-text-secondary">Add Color</div>
          </div>
        </button>
      </div>
    </div>
  )
}

