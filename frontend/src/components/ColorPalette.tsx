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
      <h3 className="text-xl font-bold text-gray-800">Color Palette</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {colors.map((color, index) => (
          <div
            key={index}
            className="relative bg-gray-50 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
          >
            {/* Remove Button */}
            <button
              onClick={() => onRemoveColor(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-xs font-bold"
            >
              ×
            </button>

            {/* Color Swatch */}
            <div
              className="w-full h-24 rounded-md mb-3 border-2 border-gray-200 cursor-pointer"
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
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-600">HEX:</span>
                <input
                  type="text"
                  value={color.hex}
                  onChange={(e) => handleHexChange(index, e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                />
              </div>

              <div className="text-gray-600">
                <span className="font-semibold">RGB:</span>{' '}
                {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
              </div>

              <div className="text-gray-600">
                <span className="font-semibold">HSL:</span>{' '}
                {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
              </div>
            </div>
          </div>
        ))}

        {/* Add Color Button */}
        <button
          onClick={onAddColor}
          className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center min-h-[180px]"
        >
          <div className="text-center">
            <div className="text-4xl text-gray-400 mb-2">+</div>
            <div className="text-sm text-gray-600 font-medium">Add Color</div>
          </div>
        </button>
      </div>
    </div>
  )
}

