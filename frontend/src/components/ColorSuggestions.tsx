import { useState } from 'react'
import { Color } from '../App'

interface Suggestion {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  name: string
  description: string
}

interface HarmonyGroup {
  type: string
  angle: string
  description: string
  use_cases: string[]
  mood: string
  examples: string
  suggestions: Suggestion[]
}

interface ColorSuggestionData {
  base_color: Color
  harmonies: HarmonyGroup[]
}

interface ColorSuggestionsProps {
  colors: Color[]
  onAddColor: (color: Color) => void
}

export default function ColorSuggestions({ colors, onAddColor }: ColorSuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<ColorSuggestionData[]>([])
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0)
  const [expandedHarmony, setExpandedHarmony] = useState<string | null>(null)

  const fetchSuggestions = async () => {
    if (colors.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/suggest-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ colors }),
      })

      const data = await response.json()
      if (data.success) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      alert('Failed to generate suggestions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSuggestion = (suggestion: Suggestion) => {
    const newColor: Color = {
      hex: suggestion.hex,
      rgb: suggestion.rgb,
      hsl: suggestion.hsl,
    }
    onAddColor(newColor)
  }

  const toggleHarmony = (harmonyType: string) => {
    setExpandedHarmony(expandedHarmony === harmonyType ? null : harmonyType)
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <button
          onClick={fetchSuggestions}
          disabled={loading || colors.length === 0}
          className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? 'Generating Suggestions...' : '✨ Suggest Harmonious Colors'}
        </button>
        {colors.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Add colors to your palette first
          </p>
        )}
      </div>
    )
  }

  const currentSuggestion = suggestions[selectedColorIndex]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Color Suggestions & Harmony Guide
        </h2>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="text-sm text-purple-600 hover:text-purple-700 underline"
        >
          Refresh Suggestions
        </button>
      </div>

      {/* Color Selector */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select a base color to see suggestions:
        </label>
        <div className="flex flex-wrap gap-3">
          {colors.map((color, index) => (
            <button
              key={index}
              onClick={() => setSelectedColorIndex(index)}
              className={`relative group ${
                selectedColorIndex === index ? 'ring-4 ring-purple-500' : ''
              }`}
            >
              <div
                className="w-16 h-16 rounded-lg shadow-md transition-transform hover:scale-110"
                style={{ backgroundColor: color.hex }}
              />
              {selectedColorIndex === index && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Base Color Info */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border-l-4 border-purple-500">
        <div className="flex items-center space-x-4">
          <div
            className="w-20 h-20 rounded-lg shadow-lg"
            style={{ backgroundColor: currentSuggestion.base_color.hex }}
          />
          <div>
            <h3 className="text-lg font-bold text-gray-800">Base Color</h3>
            <p className="text-sm text-gray-600 font-mono">
              {currentSuggestion.base_color.hex}
            </p>
            <p className="text-xs text-gray-500">
              HSL: {currentSuggestion.base_color.hsl.h}°,{' '}
              {currentSuggestion.base_color.hsl.s}%,{' '}
              {currentSuggestion.base_color.hsl.l}%
            </p>
          </div>
        </div>
      </div>

      {/* Harmony Groups */}
      <div className="space-y-4">
        {currentSuggestion.harmonies.map((harmony, harmonyIndex) => (
          <div
            key={harmonyIndex}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            {/* Harmony Header */}
            <button
              onClick={() => toggleHarmony(harmony.type)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-gray-800">
                    {harmony.type}
                  </h3>
                  <span className="text-sm text-purple-600 font-semibold">
                    {harmony.angle}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {harmony.description}
                </p>
              </div>
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform ${
                  expandedHarmony === harmony.type ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Expanded Content */}
            {expandedHarmony === harmony.type && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                {/* Mood & Examples */}
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      🎨 Mood & Feel
                    </h4>
                    <p className="text-sm text-gray-600">{harmony.mood}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      💡 Examples
                    </h4>
                    <p className="text-sm text-gray-600">{harmony.examples}</p>
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    ✅ Best Used For:
                  </h4>
                  <ul className="space-y-1">
                    {harmony.use_cases.map((useCase, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {useCase}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Colors */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Suggested Colors:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {harmony.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div
                          className="w-full h-20 rounded-md mb-2 shadow-sm"
                          style={{ backgroundColor: suggestion.hex }}
                        />
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          {suggestion.name}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {suggestion.description}
                        </p>
                        <p className="text-xs font-mono text-gray-600 mb-2">
                          {suggestion.hex}
                        </p>
                        <button
                          onClick={() => handleAddSuggestion(suggestion)}
                          className="w-full bg-purple-600 text-white text-xs py-1.5 rounded hover:bg-purple-700 transition-colors font-medium"
                        >
                          + Add to Palette
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
        <h4 className="text-sm font-bold text-blue-900 mb-2">💡 Pro Tips</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Click any harmony type to expand and see suggested colors</li>
          <li>• Use "Add to Palette" to quickly test suggestions</li>
          <li>• Combine multiple harmony types for rich, complex palettes</li>
          <li>• Start with 2-3 colors, then add complementary accents</li>
          <li>• Check accessibility after adding new colors</li>
        </ul>
      </div>
    </div>
  )
}

