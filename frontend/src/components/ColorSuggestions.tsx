import { useEffect, useRef, useState } from 'react'
import { suggestColors } from '../api/client'
import type {
  Color,
  HarmonySuggestion,
  SuggestionColor,
  SuggestionResult,
} from '../api/contracts'
import { errorMessage } from '../api/errors'
import InlineNotice, { type NoticeState } from './InlineNotice'
import MiniColorWheel from './MiniColorWheel'

interface ColorSuggestionsProps {
  colors: Color[]
  onAddColor: (color?: Color) => void
}

export default function ColorSuggestions({ colors, onAddColor }: ColorSuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([])
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0)
  const [expandedHarmony, setExpandedHarmony] = useState<string | null>(null)
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [suggestionsFingerprint, setSuggestionsFingerprint] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)
  const fingerprint = paletteFingerprint(colors)
  const fingerprintRef = useRef(fingerprint)
  fingerprintRef.current = fingerprint

  useEffect(() => {
    requestIdRef.current += 1
    controllerRef.current?.abort()
    controllerRef.current = null
    setSuggestions([])
    setSuggestionsFingerprint(null)
    setExpandedHarmony(null)
    setLoading(false)
    setNotice(null)
    setSelectedColorIndex((current) =>
      Math.max(0, Math.min(current, colors.length - 1)),
    )
  }, [fingerprint, colors.length])

  useEffect(
    () => () => {
      requestIdRef.current += 1
      controllerRef.current?.abort()
    },
    [],
  )

  const fetchSuggestions = async () => {
    if (colors.length === 0) return

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    const requestedFingerprint = fingerprint
    setLoading(true)
    setNotice(null)
    try {
      const data = await suggestColors(colors, controller.signal)
      if (
        requestId !== requestIdRef.current ||
        requestedFingerprint !== fingerprintRef.current
      ) {
        return
      }
      setSuggestions(data.suggestions)
      setSuggestionsFingerprint(requestedFingerprint)
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Error fetching suggestions:', error)
      setNotice({
        message: errorMessage(error),
        retry: () => void fetchSuggestions(),
      })
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  const handleAddSuggestion = (suggestion: SuggestionColor) => {
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

  const hasCurrentSuggestions =
    suggestions.length > 0 && suggestionsFingerprint === fingerprint

  // Helper to extract angles and colors for mini wheel
  const getHarmonyVisualization = (harmony: HarmonySuggestion, baseHue: number) => {
    const angles = [baseHue]
    const colors = [suggestions[selectedColorIndex].baseColor.hex]
    
    harmony.suggestions.forEach(sug => {
      angles.push(sug.hsl.h)
      colors.push(sug.hex)
    })
    
    return { angles, colors }
  }

  if (!hasCurrentSuggestions) {
    return (
      <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-text-primary mb-4">Color Suggestions</h2>
          {notice && (
            <div className="mb-4 text-left">
              <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
            </div>
          )}
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

  const safeSelectedIndex = Math.min(
    selectedColorIndex,
    suggestions.length - 1,
    colors.length - 1,
  )
  const currentSuggestion = suggestions[safeSelectedIndex]

  return (
    <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
      <h2 className="text-lg font-medium text-text-primary mb-4">Color Suggestions & Harmony Guide</h2>
      {notice && (
        <div className="mb-4">
          <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
        </div>
      )}

      {/* Base Color Selector */}
      <div className="mb-6">
        <p className="text-sm text-text-secondary mb-3">Select a base color:</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedColorIndex(index)
                setExpandedHarmony(null)
              }}
              className={`w-12 h-12 rounded-md transition-all ${
                safeSelectedIndex === index
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
            currentSuggestion.baseColor.hsl.h
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
                        baseHue={currentSuggestion.baseColor.hsl.h}
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
                        {harmony.useCases.map((useCase, idx) => (
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

export function paletteFingerprint(colors: Color[]): string {
  return colors
    .map(
      (color) =>
        `${color.hex.toLowerCase()}:${color.rgb.r},${color.rgb.g},${color.rgb.b}:` +
        `${color.hsl.h},${color.hsl.s},${color.hsl.l}`,
    )
    .join('|')
}

