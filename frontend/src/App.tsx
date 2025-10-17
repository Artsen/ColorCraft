import { useState } from 'react'
import ImageUpload from './components/ImageUpload'
import ColorPalette from './components/ColorPalette'
import ColorWheel from './components/ColorWheel'
import AnalysisResults from './components/AnalysisResults'
import ColorSuggestions from './components/ColorSuggestions'

export interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
}

export interface Analysis {
  color_theory: {
    harmonies: any
    temperature_balance: any
    score: number
    tags: string[]
    metrics: any
  }
  accessibility: {
    pairs: any[]
    issues: any[]
    summary: any
  }
}

function App() {
  const [colors, setColors] = useState<Color[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(true)
  const [uploadedImage, setUploadedImage] = useState<{
    file: File
    previewUrl: string
  } | null>(null)
  const [nColors, setNColors] = useState(5)
  const [extracting, setExtracting] = useState(false)

  const handleColorsExtracted = (extractedColors: Color[], imageFile?: File, imageUrl?: string) => {
    setColors(extractedColors)
    setAnalysis(null)
    setShowUpload(false)
    
    if (imageFile && imageUrl) {
      setUploadedImage({ file: imageFile, previewUrl: imageUrl })
    }
  }

  const handleReExtract = async () => {
    if (!uploadedImage) return

    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadedImage.file)

      const response = await fetch(`/api/extract-colors?n_colors=${nColors}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setColors(data.colors)
        setAnalysis(null)
      }
    } catch (error) {
      console.error('Error re-extracting colors:', error)
      alert('Failed to re-extract colors. Please try again.')
    } finally {
      setExtracting(false)
    }
  }

  const handleSkipUpload = () => {
    setShowUpload(false)
    const defaultColors: Color[] = [
      {
        hex: '#667eea',
        rgb: { r: 102, g: 126, b: 234 },
        hsl: { h: 229, s: 75, l: 66 }
      },
      {
        hex: '#764ba2',
        rgb: { r: 118, g: 75, b: 162 },
        hsl: { h: 270, s: 37, l: 46 }
      },
      {
        hex: '#f093fb',
        rgb: { r: 240, g: 147, b: 251 },
        hsl: { h: 294, s: 92, l: 78 }
      }
    ]
    setColors(defaultColors)
  }

  const handleColorChange = (index: number, newColor: Color) => {
    const newColors = [...colors]
    newColors[index] = newColor
    setColors(newColors)
    setAnalysis(null)
  }

  const handleAddColor = (color?: Color) => {
    const newColor: Color = color || {
      hex: '#808080',
      rgb: { r: 128, g: 128, b: 128 },
      hsl: { h: 0, s: 0, l: 50 }
    }
    setColors([...colors, newColor])
    setAnalysis(null)
  }

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index))
    setAnalysis(null)
  }

  const handleAnalyze = async () => {
    if (colors.length < 2) {
      alert('Please add at least 2 colors to analyze')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/analyze-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ colors }),
      })

      const data = await response.json()
      if (data.success) {
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Error analyzing colors:', error)
      alert('Failed to analyze colors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setColors([])
    setAnalysis(null)
    setShowUpload(true)
    setUploadedImage(null)
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-text-primary mb-2">ColorCraft</h1>
          <p className="text-text-secondary text-sm">
            Intelligent color theory analysis and harmony detection
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {showUpload ? (
            <ImageUpload 
              onColorsExtracted={handleColorsExtracted}
              onSkipUpload={handleSkipUpload}
            />
          ) : (
            <>
              {/* Uploaded Image Preview */}
              {uploadedImage && (
                <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-text-primary">Source Image</h2>
                    <button
                      onClick={handleReset}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Change image
                    </button>
                  </div>

                  <div className="space-y-4">
                    <img
                      src={uploadedImage.previewUrl}
                      alt="Uploaded"
                      className="max-h-48 mx-auto rounded-lg"
                    />

                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-border-subtle">
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-text-secondary">
                          Colors:
                        </label>
                        <input
                          type="range"
                          min="3"
                          max="10"
                          value={nColors}
                          onChange={(e) => setNColors(parseInt(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm font-medium text-text-primary w-6">
                          {nColors}
                        </span>
                      </div>

                      <button
                        onClick={handleReExtract}
                        disabled={extracting}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {extracting ? 'Extracting...' : 'Re-extract'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Palette */}
              <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-text-primary">Color Palette</h2>
                  {!uploadedImage && (
                    <button
                      onClick={handleReset}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Start over
                    </button>
                  )}
                </div>

                <ColorPalette
                  colors={colors}
                  onColorChange={handleColorChange}
                  onAddColor={handleAddColor}
                  onRemoveColor={handleRemoveColor}
                />

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || colors.length < 2}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Colors'}
                  </button>
                </div>
                
                {colors.length < 2 && (
                  <p className="text-xs text-text-tertiary text-center mt-2">
                    Add at least 2 colors to analyze
                  </p>
                )}
              </div>

              {/* Color Suggestions */}
              {colors.length > 0 && (
                <ColorSuggestions colors={colors} onAddColor={handleAddColor} />
              )}
            </>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-6 space-y-6">
            {/* Color Wheel */}
            <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
              <h2 className="text-lg font-medium text-text-primary mb-6">
                Color Wheel
              </h2>
              <ColorWheel colors={colors} analysis={analysis} />
            </div>

            {/* Analysis Details */}
            <AnalysisResults analysis={analysis} colors={colors} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App

