import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Color } from '../api/contracts'
import { rgbToHsl } from '../workspace'
import Button from './ui/Button'
import Dialog from './ui/Dialog'

const MAX_SAMPLE_DIMENSION = 1600

interface ImageColorPickerProps {
  imageUrl: string
  onColorPicked: (color: Color) => void
  onClose: () => void
}

interface Sample {
  color: Color
  x: number
  y: number
}

export default function ImageColorPicker({
  imageUrl,
  onColorPicked,
  onClose,
}: ImageColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const hoverSwatchRef = useRef<HTMLSpanElement>(null)
  const hoverHexRef = useRef<HTMLElement>(null)
  const coordinateRef = useRef<HTMLElement>(null)
  const [selected, setSelected] = useState<Sample | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const prepareCanvas = () => {
      if (!image.naturalWidth || !image.naturalHeight) return
      const scale = Math.min(
        1,
        MAX_SAMPLE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
      )
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      contextRef.current = context
    }

    if (image.complete) prepareCanvas()
    else image.addEventListener('load', prepareCanvas)

    return () => {
      image.removeEventListener('load', prepareCanvas)
      contextRef.current = null
      canvas.width = 0
      canvas.height = 0
    }
  }, [imageUrl])

  const samplePointer = (event: PointerEvent<HTMLDivElement>): Sample | null => {
    const canvas = canvasRef.current
    const image = imageRef.current
    const context = contextRef.current
    if (!canvas || !image || !context) return null

    const rect = image.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height))
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return null

    const pixel = context.getImageData(x, y, 1, 1).data
    const hex = `#${[pixel[0], pixel[1], pixel[2]]
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')}`.toUpperCase()
    const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] }
    return { color: { hex, rgb, hsl: rgbToHsl(rgb) }, x, y }
  }

  const updateHoverPreview = (sample: Sample) => {
    if (hoverSwatchRef.current) {
      hoverSwatchRef.current.style.backgroundColor = sample.color.hex
    }
    if (hoverHexRef.current) hoverHexRef.current.textContent = sample.color.hex
    if (coordinateRef.current) coordinateRef.current.textContent = `${sample.x}, ${sample.y}`
  }

  return (
    <Dialog open title="Pick a color from the image" onClose={onClose} className="picker-dialog">
      <div className="picker-layout">
        <div
          className="picker-stage"
          onPointerMove={(event) => {
            const sample = samplePointer(event)
            if (sample) updateHoverPreview(sample)
          }}
          onPointerDown={(event) => {
            const sample = samplePointer(event)
            if (sample) {
              updateHoverPreview(sample)
              setSelected(sample)
            }
          }}
        >
          <img ref={imageRef} src={imageUrl} alt="Source image for color sampling" />
          <canvas ref={canvasRef} className="visually-hidden" />
        </div>

        <aside className="picker-details">
          <div className="picker-preview">
            <span
              ref={hoverSwatchRef}
              className="picker-preview-swatch"
              style={{ backgroundColor: selected?.color.hex ?? '#808080' }}
            />
            <div>
              <span className="field-label">Pointer</span>
              <code ref={hoverHexRef}>{selected?.color.hex ?? 'Move over the image'}</code>
              <p className="field-help">
                Coordinate <span ref={coordinateRef}>
                  {selected ? `${selected.x}, ${selected.y}` : '—'}
                </span>
              </p>
            </div>
          </div>
          <div className="picker-selected">
            <span
              className="picker-selected-swatch"
              style={{ backgroundColor: selected?.color.hex ?? 'transparent' }}
            />
            <div>
              <span className="field-label">Selected color</span>
              <code>{selected?.color.hex ?? 'Select a pixel'}</code>
            </div>
          </div>
          <p className="field-help">
            Point, touch, or click the image to select a pixel. Confirm when the color is ready.
          </p>
        </aside>
      </div>

      <div className="dialog-actions">
        <Button variant="quiet" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!selected}
          onClick={() => {
            if (!selected) return
            onColorPicked(selected.color)
            onClose()
          }}
        >
          Use selected color
        </Button>
      </div>
    </Dialog>
  )
}
