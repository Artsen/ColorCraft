import { useEffect, useRef, useState } from 'react'
import type { Color } from '../api/contracts'
import Dialog from './ui/Dialog'

interface ImageColorPickerProps {
  imageUrl: string
  onColorPicked: (color: Color) => void
  onClose: () => void
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

export default function ImageColorPicker({
  imageUrl,
  onColorPicked,
  onClose,
}: ImageColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [hoveredColor, setHoveredColor] = useState('#000000')

  useEffect(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return
    const context = canvas.getContext('2d', { willReadFrequently: true })

    const loadImage = () => {
      if (!context) return
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      context.drawImage(image, 0, 0)
    }

    if (image.complete) loadImage()
    else image.addEventListener('load', loadImage)
    return () => image.removeEventListener('load', loadImage)
  }, [imageUrl])

  const colorAtPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current
    const image = imageRef.current
    const context = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !image || !context) return null

    const rect = image.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height))
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return null

    const pixel = context.getImageData(x, y, 1, 1).data
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
      .toString(16)
      .slice(1)}`
    return { hex, rgb: { r: pixel[0], g: pixel[1], b: pixel[2] } }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const sampled = colorAtPointer(event)
    if (sampled) setHoveredColor(sampled.hex)
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const sampled = colorAtPointer(event)
    if (!sampled) return
    onColorPicked({ ...sampled, hsl: rgbToHsl(sampled.rgb) })
    onClose()
  }

  return (
    <Dialog open title="Pick a color from the image" onClose={onClose} className="picker-dialog">
      <div className="picker-stage" onMouseMove={handleMouseMove} onClick={handleClick}>
        <div className="picker-preview">
          <div
            className="picker-preview-swatch"
            style={{ backgroundColor: hoveredColor }}
          />
          <div>
            <span className="field-label">Color</span>
            <code>{hoveredColor}</code>
            <p className="field-help">Click the image to select.</p>
          </div>
        </div>
        <img ref={imageRef} src={imageUrl} alt="Choose a color from this source" />
        <canvas ref={canvasRef} className="visually-hidden" />
      </div>
      <p className="dialog-instructions">
        Hover to preview • Click to select • Press Escape to close
      </p>
    </Dialog>
  )
}
