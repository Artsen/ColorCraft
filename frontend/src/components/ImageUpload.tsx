import { useState, useRef } from 'react'
import { Color } from '../App'

interface ImageUploadProps {
  onColorsExtracted: (colors: Color[], imageFile?: File, imageUrl?: string) => void
  onSkipUpload: () => void
}

export default function ImageUpload({ onColorsExtracted, onSkipUpload }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [nColors, setNColors] = useState(5)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleExtractColors = async () => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('n_colors', nColors.toString())

      const response = await fetch(`/api/extract-colors?n_colors=${nColors}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        onColorsExtracted(data.colors, selectedFile, previewUrl || undefined)
      }
    } catch (error) {
      console.error('Error extracting colors:', error)
      alert('Failed to extract colors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-text-primary mb-2">
          Upload Image & Extract Colors
        </h2>
        <p className="text-sm text-text-secondary">
          Upload an image to extract dominant colors, or skip to add colors manually
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border-default rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors mb-6"
      >
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg"
            />
            <p className="text-sm text-text-secondary">{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <svg
              className="mx-auto h-12 w-12 text-text-tertiary"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-text-secondary text-sm">
              <span className="font-medium text-purple-500">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-text-tertiary">JPG, PNG, or WebP</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        {selectedFile ? (
          <>
            {/* Number of Colors Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-text-secondary">Colors:</label>
              <input
                type="range"
                min="3"
                max="10"
                value={nColors}
                onChange={(e) => setNColors(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm font-medium text-text-primary w-6">{nColors}</span>
            </div>

            <button
              onClick={handleExtractColors}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Extracting...' : 'Extract Colors'}
            </button>
          </>
        ) : (
          <button
            onClick={onSkipUpload}
            className="bg-dark-tertiary hover:bg-dark-hover text-text-primary text-sm px-6 py-2.5 rounded-md transition-colors border border-border-default font-medium"
          >
            Skip & Add Colors Manually
          </button>
        )}
      </div>
    </div>
  )
}

