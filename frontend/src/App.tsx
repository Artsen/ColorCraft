import { useState } from 'react'
import ImageUpload from './components/ImageUpload'
import ColorPalette from './components/ColorPalette'
import ColorWheel from './components/ColorWheel'
import AnalysisResults from './components/AnalysisResults'

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

  const handleColorsExtracted = (extractedColors: Color[]) => {
    setColors(extractedColors)
    setAnalysis(null)
  }

  const handleColorChange = (index: number, newColor: Color) => {
    const newColors = [...colors]
    newColors[index] = newColor
    setColors(newColors)
    setAnalysis(null)
  }

  const handleAddColor = () => {
    const newColor: Color = {
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
          <ImageUpload onColorsExtracted={handleColorsExtracted} />

          {/* Color Palette Section */}
          {colors.length > 0 && (
            <div className="mt-8">
              <ColorPalette
                colors={colors}
                onColorChange={handleColorChange}
                onAddColor={handleAddColor}
                onRemoveColor={handleRemoveColor}
              />

              {/* Analyze Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || colors.length < 2}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Analyzing...' : 'Apply Color Theory'}
                </button>
              </div>
            </div>
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

