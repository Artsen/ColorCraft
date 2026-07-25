import { useState } from 'react'
import { Pipette, Plus, Trash2 } from 'lucide-react'
import type { Color } from '../api/contracts'
import ImageColorPicker from './ImageColorPicker'
import IconButton from './ui/IconButton'

interface ColorPaletteProps {
  colors: Color[]
  onColorChange: (index: number, color: Color) => void
  onAddColor: () => void
  onRemoveColor: (index: number) => void
  imageUrl?: string
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHsl(rgb: { r: number; g: number; b: number }) {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const delta = max - min
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / delta + 2) / 6
        break
      case b:
        h = ((r - g) / delta + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export default function ColorPalette({
  colors,
  onColorChange,
  onAddColor,
  onRemoveColor,
  imageUrl,
}: ColorPaletteProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerColorIndex, setPickerColorIndex] = useState<number | null>(null)

  const handleHexChange = (index: number, hex: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex) && hex.length === 7) return
    const rgb = hexToRgb(hex)
    onColorChange(index, { hex, rgb, hsl: rgbToHsl(rgb) })
  }

  const handleOpenPicker = (index: number) => {
    if (!imageUrl) return
    setPickerColorIndex(index)
    setPickerOpen(true)
  }

  const handleColorPicked = (color: Color) => {
    if (pickerColorIndex !== null) onColorChange(pickerColorIndex, color)
  }

  return (
    <>
      <div className="palette-grid">
        {colors.map((color, index) => (
          <div key={`${color.hex}-${index}`} className="swatch-card">
            <IconButton
              compact
              label={`Remove ${color.hex || `color ${index + 1}`}`}
              icon={<Trash2 size={14} aria-hidden="true" />}
              onClick={() => onRemoveColor(index)}
              className="swatch-remove"
            />

            <button
              type="button"
              className="swatch-preview"
              style={{ backgroundColor: color.hex }}
              aria-label={`Change ${color.hex || `color ${index + 1}`}`}
              onClick={() => {
                const input = document.getElementById(`color-picker-${index}`) as HTMLInputElement
                input?.click()
              }}
            />
            <input
              id={`color-picker-${index}`}
              type="color"
              value={color.hex || '#000000'}
              onChange={(event) => handleHexChange(index, event.target.value)}
              className="visually-hidden"
              tabIndex={-1}
            />

            <div className="swatch-values">
              <div className="swatch-code-row">
                <label htmlFor={`hex-value-${index}`}>HEX</label>
                <input
                  id={`hex-value-${index}`}
                  type="text"
                  value={color.hex || ''}
                  onChange={(event) => handleHexChange(index, event.target.value)}
                />
                {imageUrl && (
                  <IconButton
                    compact
                    label={`Pick ${color.hex} from image`}
                    icon={<Pipette size={14} aria-hidden="true" />}
                    onClick={() => handleOpenPicker(index)}
                  />
                )}
              </div>
              <div>RGB: {color.rgb?.r ?? 0}, {color.rgb?.g ?? 0}, {color.rgb?.b ?? 0}</div>
              <div>HSL: {color.hsl?.h ?? 0}°, {color.hsl?.s ?? 0}%, {color.hsl?.l ?? 0}%</div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onAddColor}
          disabled={colors.length >= 10}
          className="add-color"
        >
          <span>
            <Plus size={24} aria-hidden="true" />
            {colors.length >= 10 ? '10 color maximum' : 'Add color'}
          </span>
        </button>
      </div>

      {pickerOpen && imageUrl && (
        <ImageColorPicker
          imageUrl={imageUrl}
          onColorPicked={handleColorPicked}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}
