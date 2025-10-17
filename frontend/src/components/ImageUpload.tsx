import { useState, useRef } from 'react'
import { Color } from '../App'

interface ImageUploadProps {
  onColorsExtracted: (colors: Color[]) => void
}

export default function ImageUpload({ onColorsExtracted }: ImageUploadProps) {
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
        onColorsExtracted(data.colors)
      }
    } catch (error) {
      console.error('Error extracting colors:', error)
      alert('Failed to extract colors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Upload Image & Extract Colors
        </h2>
        <p className="text-gray-600">
          Upload an image to extract dominant colors using AI-powered clustering
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
      >
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-600">{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <div className="text-gray-600">
              <span className="font-semibold text-purple-600">Click to upload</span> or
              drag and drop
            </div>
            <p className="text-xs text-gray-500">JPG, PNG, or WebP</p>
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

      {/* Number of Colors Selector */}
      {selectedFile && (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <label className="text-gray-700 font-medium">Number of colors:</label>
            <input
              type="range"
              min="3"
              max="10"
              value={nColors}
              onChange={(e) => setNColors(parseInt(e.target.value))}
              className="w-48"
            />
            <span className="text-lg font-bold text-purple-600 w-8">{nColors}</span>
          </div>

          <div className="text-center">
            <button
              onClick={handleExtractColors}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Extracting Colors...' : 'Find Colors'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

