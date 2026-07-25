import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { ImagePlus, Upload } from 'lucide-react'
import Button from './ui/Button'
import Notice from './ui/Notice'

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validateImageFile(file: File): string | null {
  const supportedExtension = /\.(?:jpe?g|png|webp)$/i.test(file.name)
  if (!acceptedTypes.has(file.type) && !(file.type === '' && supportedExtension)) {
    return 'Choose a JPG, PNG, or WebP image.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Choose an image smaller than 15 MB.'
  }
  return null
}

interface ImageUploadProps {
  onImageSelected: (file: File) => void | Promise<void>
  onStartManual: () => void
}

export default function ImageUpload({
  onImageSelected,
  onStartManual,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragReady, setDragReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectFile = async (file?: File) => {
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setLoading(true)
    try {
      await onImageSelected(file)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragReady(false)
    void selectFile(event.dataTransfer.files[0])
  }

  const openFilePicker = () => inputRef.current?.click()
  const handleDropZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openFilePicker()
    }
  }

  return (
    <section className="create-empty" aria-labelledby="create-palette-title">
      <div>
        <p className="workspace-kicker">New palette</p>
        <h2 id="create-palette-title">Create a palette</h2>
        <p>Drop an image here or choose an image from this computer.</p>
      </div>

      {error && <Notice variant="error">{error}</Notice>}

      <div
        className={`drop-zone ${dragReady ? 'drag-ready' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Choose or drop a source image"
        onClick={openFilePicker}
        onKeyDown={handleDropZoneKeyDown}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragReady(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragReady(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragReady(false)
          }
        }}
        onDrop={handleDrop}
      >
        <ImagePlus className="drop-zone-icon" size={42} aria-hidden="true" />
        <strong>{dragReady ? 'Release to use this image' : 'Drop an image here'}</strong>
        <span>JPG, PNG, or WebP · up to 15 MB</span>
      </div>

      <label className="visually-hidden" htmlFor="source-image">Source image</label>
      <input
        ref={inputRef}
        id="source-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        onChange={(event) => {
          void selectFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <div className="create-actions">
        <Button
          variant="primary"
          icon={<Upload size={17} aria-hidden="true" />}
          onClick={openFilePicker}
          disabled={loading}
        >
          {loading ? 'Reading image…' : 'Choose image'}
        </Button>
        <Button variant="secondary" onClick={onStartManual}>Start manually</Button>
      </div>
      <p className="create-metadata">
        JPG, PNG, or WebP · Processed by the local ColorCraft API
      </p>
    </section>
  )
}
