import { useEffect, useRef, useState } from 'react'
import { Color } from '../App'

interface ImageColorPickerProps {
  imageUrl: string
  onColorPicked: (color: Color) => void
  onClose: () => void
}

export default function ImageColorPicker({ imageUrl, onColorPicked, onClose }: ImageColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [hoveredColor, setHoveredColor] = useState<string>('#000000')
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    const loadImage = () => {
      if (!ctx) return

      // Set canvas size to match image
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      // Draw image on canvas
      ctx.drawImage(img, 0, 0)
    }

    if (img.complete) {
      loadImage()
    } else {
      img.addEventListener('load', loadImage)
    }

    return () => {
      img.removeEventListener('load', loadImage)
    }
  }, [imageUrl])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to canvas coordinates
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = Math.floor(x * scaleX)
    const canvasY = Math.floor(y * scaleY)

    setCursorPosition({ x: e.clientX, y: e.clientY })

    // Get pixel color
    if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
      const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`
      setHoveredColor(hex)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to canvas coordinates
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = Math.floor(x * scaleX)
    const canvasY = Math.floor(y * scaleY)

    // Get pixel color
    if (canvasX >= 0 && canvasX < canvas.width && canvasY >= 0 && canvasY < canvas.height) {
      const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`
      
      // Convert to Color object
      const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] }
      const hsl = rgbToHsl(rgb)
      
      onColorPicked({ hex, rgb, hsl })
      onClose()
    }
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

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div className="relative max-w-6xl max-h-full" onClick={(e) => e.stopPropagation()}>
        {/* Color Preview Box */}
        <div className="absolute top-4 left-4 z-10 bg-dark-secondary border border-border-default rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-md border-2 border-white"
              style={{ backgroundColor: hoveredColor }}
            />
            <div>
              <div className="text-xs text-text-tertiary mb-1">Color</div>
              <div className="text-sm font-mono text-text-primary">{hoveredColor}</div>
              <div className="text-xs text-text-secondary mt-1">Click to select</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-dark-secondary hover:bg-dark-hover border border-border-default rounded-md p-2 text-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Container */}
        <div
          className="relative cursor-crosshair"
          onMouseMove={handleMouseMove}
          onClick={handleClick}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Pick a color"
            className="max-w-full max-h-[80vh] rounded-lg"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-text-secondary">
          Hover over the image to preview colors • Click to select • Press ESC to close
        </div>
      </div>
    </div>
  )
}

