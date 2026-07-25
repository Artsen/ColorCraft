import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Lightbulb, Plus } from 'lucide-react'
import { suggestColors } from '../api/client'
import type {
  Color,
  SuggestionColor,
  SuggestionResult,
} from '../api/contracts'
import { errorMessage } from '../api/errors'
import InlineNotice, { type NoticeState } from './InlineNotice'
import MiniColorWheel from './MiniColorWheel'
import Button from './ui/Button'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'

interface ColorSuggestionsProps {
  colors: Color[]
  onAddColor: (color?: Color) => void
}

export default function ColorSuggestions({ colors, onAddColor }: ColorSuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([])
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
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
    setSelectedColorIndex((current) => Math.max(0, Math.min(current, colors.length - 1)))
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
      ) return
      setSuggestions(data.suggestions)
      setSuggestionsFingerprint(requestedFingerprint)
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Error fetching suggestions:', error)
      setNotice({ message: errorMessage(error), retry: () => void fetchSuggestions() })
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  const addSuggestion = (suggestion: SuggestionColor) => {
    onAddColor({
      hex: suggestion.hex,
      rgb: suggestion.rgb,
      hsl: suggestion.hsl,
    })
  }

  const hasCurrentSuggestions =
    suggestions.length > 0 && suggestionsFingerprint === fingerprint

  if (!hasCurrentSuggestions) {
    return (
      <Panel>
        <SectionHeader
          title="Color suggestions"
          description="Generate geometric harmonies from the current palette."
        />
        {notice && <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />}
        <div className="section-actions">
          <Button variant="primary" onClick={fetchSuggestions} disabled={loading || colors.length === 0}>
            {loading ? 'Generating…' : 'Suggest Harmonious Colors'}
          </Button>
        </div>
        {colors.length === 0 && <p className="helper-center">Add colors to your palette first.</p>}
      </Panel>
    )
  }

  const safeSelectedIndex = Math.min(
    selectedColorIndex,
    suggestions.length - 1,
    colors.length - 1,
  )
  const currentSuggestion = suggestions[safeSelectedIndex]

  return (
    <Panel>
      <SectionHeader
        title="Color Suggestions & Harmony Guide"
        description="Select a base color, then inspect each relationship."
      />
      {notice && <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />}

      <div className="panel-stack">
        <div>
          <p className="field-label">Base color</p>
          <div className="suggestion-selector">
            {colors.map((color, index) => (
              <button
                type="button"
                key={`${color.hex}-${index}`}
                onClick={() => {
                  setSelectedColorIndex(index)
                  setExpandedHarmony(null)
                }}
                className="color-select"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
                aria-label={`Use ${color.hex} as the base color`}
                aria-pressed={safeSelectedIndex === index}
              />
            ))}
          </div>
        </div>

        <div className="harmony-list">
          {currentSuggestion.harmonies.map((harmony) => {
            const isExpanded = expandedHarmony === harmony.type
            const angles = [
              currentSuggestion.baseColor.hsl.h,
              ...harmony.suggestions.map((suggestion) => suggestion.hsl.h),
            ]
            const harmonyColors = [
              currentSuggestion.baseColor.hex,
              ...harmony.suggestions.map((suggestion) => suggestion.hex),
            ]

            return (
              <div key={harmony.type} className="harmony-item">
                <button
                  type="button"
                  onClick={() => setExpandedHarmony(isExpanded ? null : harmony.type)}
                  className="harmony-trigger"
                  aria-expanded={isExpanded}
                >
                  <span>
                    <strong>{harmony.type}</strong>
                    <small>{harmony.angle}</small>
                  </span>
                  <ChevronDown size={18} aria-hidden="true" />
                </button>

                {isExpanded && (
                  <div className="harmony-content">
                    <div className="harmony-detail">
                      <MiniColorWheel
                        baseHue={currentSuggestion.baseColor.hsl.h}
                        angles={angles}
                        colors={harmonyColors}
                        size={140}
                      />
                      <div className="harmony-copy">
                        <p>{harmony.description}</p>
                        <dl>
                          <dt>Mood and feel</dt>
                          <dd>{harmony.mood}</dd>
                          <dt>Examples</dt>
                          <dd>{harmony.examples}</dd>
                          <dt>Best used for</dt>
                          <dd>{harmony.useCases.join(', ')}</dd>
                        </dl>
                      </div>
                    </div>

                    <div className="suggestion-grid">
                      {harmony.suggestions.map((suggestion) => (
                        <div key={`${harmony.type}-${suggestion.hex}`} className="suggestion-card">
                          <div className="suggestion-card-header">
                            <div
                              className="suggestion-preview"
                              style={{ backgroundColor: suggestion.hex }}
                            />
                            <div>
                              <strong>{suggestion.name}</strong>
                              <code>{suggestion.hex}</code>
                            </div>
                          </div>
                          <p>{suggestion.description}</p>
                          <Button
                            variant="secondary"
                            onClick={() => addSuggestion(suggestion)}
                            icon={<Plus size={15} aria-hidden="true" />}
                          >
                            Add to Palette
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <aside className="tip-callout">
          <Lightbulb size={18} aria-hidden="true" />
          <div>
            <strong>Working with suggestions</strong>
            <ul className="tip-list">
              <li>Change the base color to compare relationships.</li>
              <li>Expand a harmony to inspect its geometry and use cases.</li>
              <li>Add useful suggestions directly to the working palette.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Panel>
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
