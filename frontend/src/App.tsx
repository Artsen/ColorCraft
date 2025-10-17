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
    // Start with 3 default colors
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">ColorCraft</h1>
          <p className="text-xl text-purple-100">
            Intelligent Color Theory Analysis & Harmony Detection
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          {/* Image Upload Section */}
          {showUpload ? (
            <ImageUpload 
              onColorsExtracted={handleColorsExtracted}
              onSkipUpload={handleSkipUpload}
            />
          ) : (
            <>
              {/* Uploaded Image Preview & Re-extraction */}
              {uploadedImage && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Source Image</h2>
                    <button
                      onClick={handleReset}
                      className="text-sm text-gray-600 hover:text-purple-600 underline"
                    >
                      Upload Different Image
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    {/* Image Preview */}
                    <div className="mb-4">
                      <img
                        src={uploadedImage.previewUrl}
                        alt="Uploaded"
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                    </div>

                    {/* Re-extraction Controls */}
                    <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <label className="text-gray-700 font-medium">
                          Number of colors:
                        </label>
                        <input
                          type="range"
                          min="3"
                          max="10"
                          value={nColors}
                          onChange={(e) => setNColors(parseInt(e.target.value))}
                          className="w-32"
                        />
                        <span className="text-lg font-bold text-purple-600 w-8">
                          {nColors}
                        </span>
                      </div>

                      <button
                        onClick={handleReExtract}
                        disabled={extracting}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        {extracting ? 'Re-extracting...' : '🔄 Re-extract Colors'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Palette Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Your Color Palette</h2>
                  {!uploadedImage && (
                    <button
                      onClick={handleReset}
                      className="text-sm text-gray-600 hover:text-purple-600 underline"
                    >
                      Start Over
                    </button>
                  )}
                </div>

                <ColorPalette
                  colors={colors}
                  onColorChange={handleColorChange}
                  onAddColor={handleAddColor}
                  onRemoveColor={handleRemoveColor}
                />

                {/* Analyze Button */}
                <div className="text-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || colors.length < 2}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? 'Analyzing...' : 'Apply Color Theory'}
                  </button>
                  {colors.length < 2 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Add at least 2 colors to analyze
                    </p>
                  )}
                </div>
              </div>

              {/* Color Suggestions */}
              {colors.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <ColorSuggestions colors={colors} onAddColor={handleAddColor} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-8">
            {/* Color Wheel Visualization */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Color Wheel Visualization
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

