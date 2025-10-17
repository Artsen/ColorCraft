import { useState } from 'react'
import { Color } from '../App'
import MiniColorWheel from './MiniColorWheel'

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
  onAddColor: (color?: Color) => void
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

  // Helper to extract angles and colors for mini wheel
  const getHarmonyVisualization = (harmony: HarmonyGroup, baseHue: number) => {
    const angles = [baseHue]
    const colors = [suggestions[selectedColorIndex].base_color.hex]
    
    harmony.suggestions.forEach(sug => {
      angles.push(sug.hsl.h)
      colors.push(sug.hex)
    })
    
    return { angles, colors }
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-text-primary mb-4">Color Suggestions</h2>
          <button
            onClick={fetchSuggestions}
            disabled={loading || colors.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? 'Generating...' : 'Suggest Harmonious Colors'}
          </button>
          {colors.length === 0 && (
            <p className="text-xs text-text-tertiary mt-2">
              Add colors to your palette first
            </p>
          )}
        </div>
      </div>
    )
  }

  const currentSuggestion = suggestions[selectedColorIndex]

  return (
    <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
      <h2 className="text-lg font-medium text-text-primary mb-4">Color Suggestions & Harmony Guide</h2>

      {/* Base Color Selector */}
      <div className="mb-6">
        <p className="text-sm text-text-secondary mb-3">Select a base color:</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <button
              key={index}
              onClick={() => setSelectedColorIndex(index)}
              className={`w-12 h-12 rounded-md transition-all ${
                selectedColorIndex === index
                  ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-dark-secondary'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.hex}
            />
          ))}
        </div>
      </div>

      {/* Harmony Types */}
      <div className="space-y-3">
        {currentSuggestion.harmonies.map((harmony) => {
          const isExpanded = expandedHarmony === harmony.type
          const { angles, colors: harmonyColors } = getHarmonyVisualization(
            harmony,
            currentSuggestion.base_color.hsl.h
          )

          return (
            <div
              key={harmony.type}
              className="border border-border-subtle rounded-lg overflow-hidden"
            >
              {/* Harmony Header */}
              <button
                onClick={() => toggleHarmony(harmony.type)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-primary">
                    {harmony.type}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {harmony.angle}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-text-secondary transition-transform ${
                    isExpanded ? 'rotate-180' : ''
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

              {/* Harmony Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border-subtle bg-dark-tertiary">
                  <div className="py-4 space-y-4">
                    {/* Mini Color Wheel */}
                    <div className="flex justify-center">
                      <MiniColorWheel
                        baseHue={currentSuggestion.base_color.hsl.h}
                        angles={angles}
                        colors={harmonyColors}
                        size={140}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-sm text-text-secondary mb-2">
                        {harmony.description}
                      </p>
                    </div>

                    {/* Mood */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Mood & Feel:</p>
                      <p className="text-sm text-text-secondary">{harmony.mood}</p>
                    </div>

                    {/* Examples */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Examples:</p>
                      <p className="text-sm text-text-secondary">{harmony.examples}</p>
                    </div>

                    {/* Use Cases */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-2">Best used for:</p>
                      <ul className="space-y-1">
                        {harmony.use_cases.map((useCase, idx) => (
                          <li key={idx} className="text-sm text-text-secondary flex items-start">
                            <span className="text-purple-500 mr-2">•</span>
                            <span>{useCase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggested Colors */}
                    <div>
                      <p className="text-xs text-text-tertiary mb-3">Suggested colors:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {harmony.suggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="bg-dark-secondary rounded-lg p-3 border border-border-subtle"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className="w-10 h-10 rounded-md flex-shrink-0"
                                style={{ backgroundColor: suggestion.hex }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate">
                                  {suggestion.name}
                                </p>
                                <p className="text-xs text-text-tertiary">
                                  {suggestion.hex}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                              {suggestion.description}
                            </p>
                            <button
                              onClick={() => handleAddSuggestion(suggestion)}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
                            >
                              Add to Palette
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pro Tips */}
      <div className="mt-6 p-4 bg-dark-tertiary rounded-lg border border-border-subtle">
        <p className="text-xs font-medium text-text-primary mb-2">💡 Pro Tips</p>
        <ul className="space-y-1 text-xs text-text-secondary">
          <li>• Click any color above to see its harmony suggestions</li>
          <li>• Expand harmony types to view detailed relationships</li>
          <li>• Add suggested colors directly to your palette</li>
          <li>• Combine multiple harmony types for rich palettes</li>
        </ul>
      </div>
    </div>
  )
}

