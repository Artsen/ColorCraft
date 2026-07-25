import { useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { extractColors } from '../api/client'
import type { Color } from '../api/contracts'
import { errorMessage } from '../api/errors'
import InlineNotice, { type NoticeState } from './InlineNotice'
import Button from './ui/Button'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'

interface ImageUploadProps {
  onColorsExtracted: (colors: Color[], imageFile?: File, imageUrl?: string) => void
  onSkipUpload: () => void
}

export default function ImageUpload({ onColorsExtracted, onSkipUpload }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [nColors, setNColors] = useState(5)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleExtractColors = async () => {
    if (!selectedFile) return

    setLoading(true)
    setNotice(null)
    try {
      const data = await extractColors(selectedFile, nColors)
      onColorsExtracted(data.colors, selectedFile, previewUrl || undefined)
    } catch (error) {
      console.error('Error extracting colors:', error)
      setNotice({
        message: errorMessage(error),
        retry: () => void handleExtractColors(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel>
      <SectionHeader
        title="Upload and extract"
        description="Choose an image to find its dominant colors, or begin with a manual palette."
      />

      {notice && (
        <div className="panel-stack">
          <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
        </div>
      )}

      <label className="drop-zone" htmlFor="source-image">
        {previewUrl ? (
          <div className="panel-stack">
            <img src={previewUrl} alt="Selected preview" />
            <p>{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="panel-stack">
            <ImagePlus className="drop-zone-icon" size={40} aria-hidden="true" />
            <div>
              <strong>Choose an image</strong> from this device
            </div>
            <p>JPG, PNG, or WebP</p>
          </div>
        )}
        <input
          id="source-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="visually-hidden"
        />
      </label>

      <div className="section-actions upload-actions">
        {selectedFile ? (
          <>
            <div className="inline-field">
              <label htmlFor="extract-count">Colors</label>
              <input
                id="extract-count"
                type="range"
                min="3"
                max="10"
                value={nColors}
                onChange={(event) => setNColors(Number(event.target.value))}
              />
              <output htmlFor="extract-count">{nColors}</output>
            </div>
            <Button variant="primary" onClick={handleExtractColors} disabled={loading}>
              {loading ? 'Extracting…' : 'Extract Colors'}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onSkipUpload}>
            Build a palette manually
          </Button>
        )}
      </div>
    </Panel>
  )
}
