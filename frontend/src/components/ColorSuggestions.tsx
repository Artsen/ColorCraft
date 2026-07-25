import { Check, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { suggestColors } from '../api/client'
import type { Color, SuggestionColor, SuggestionResult } from '../api/contracts'
import { errorMessage } from '../api/errors'
import InlineNotice, { type NoticeState } from './InlineNotice'
import MiniColorWheel from './MiniColorWheel'
import Button from './ui/Button'
import Notice from './ui/Notice'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'

interface ColorSuggestionsProps {
  colors: Color[]
  onAddColor: (color?: Color) => void
}

function oneSentence(value: string): string {
  const match = value.trim().match(/^.*?[.!?](?:\s|$)/)
  return match?.[0].trim() ?? value.trim()
}

export default function ColorSuggestions({
  colors,
  onAddColor,
}: ColorSuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([])
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [addedHexes, setAddedHexes] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [suggestionsFingerprint, setSuggestionsFingerprint] = useState<
    string | null
  >(null)
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
    setShowAll(false)
    setAddedHexes(new Set())
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
    setShowAll(false)
    setAddedHexes(new Set())

    try {
      const data = await suggestColors(colors, controller.signal)
      if (
        requestId !== requestIdRef.current ||
        requestedFingerprint !== fingerprintRef.current
      )
        return
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
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  const addSuggestion = (suggestion: SuggestionColor) => {
    const key = suggestion.hex.toLowerCase()
    setAddedHexes((current) => new Set(current).add(key))
    onAddColor({
      hex: suggestion.hex,
      rgb: suggestion.rgb,
      hsl: suggestion.hsl,
    })
  }

  const paletteHexes = new Set(colors.map((color) => color.hex.toLowerCase()))
  const hasCurrentSuggestions =
    suggestions.length > 0 && suggestionsFingerprint === fingerprint

  return (
    <Panel>
      <SectionHeader
        title="Palette suggestions"
        description="Choose a base color, then compare a few useful geometric approaches."
        action={
          hasCurrentSuggestions ? (
            <Button
              variant="secondary"
              icon={<RefreshCw size={16} aria-hidden="true" />}
              onClick={() => void fetchSuggestions()}
              disabled={loading}
            >
              {loading ? 'Regenerating…' : 'Regenerate'}
            </Button>
          ) : undefined
        }
      />
      {notice && (
        <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
      )}

      <div className="panel-stack">
        <div>
          <p className="field-label">1. Select a base color</p>
          <div className="suggestion-selector">
            {colors.map((color, index) => (
              <button
                type="button"
                key={`${color.hex}-${index}`}
                onClick={() => {
                  setSelectedColorIndex(index)
                  setShowAll(false)
                }}
                className="color-select"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
                aria-label={`Use ${color.hex} as the base color`}
                aria-pressed={selectedColorIndex === index}
              />
            ))}
          </div>
        </div>

        {!hasCurrentSuggestions ? (
          <div className="suggestion-empty">
            <p>
              Generate relationship ideas for the current palette. Results are
              discarded whenever a palette color changes.
            </p>
            <Button
              variant="primary"
              onClick={() => void fetchSuggestions()}
              disabled={loading || colors.length === 0}
            >
              {loading ? 'Generating…' : 'Generate suggestions'}
            </Button>
          </div>
        ) : (
          <SuggestionResults
            result={
              suggestions[Math.min(selectedColorIndex, suggestions.length - 1)]
            }
            paletteHexes={paletteHexes}
            addedHexes={addedHexes}
            showAll={showAll}
            onShowAll={() => setShowAll((current) => !current)}
            onAdd={addSuggestion}
          />
        )}
      </div>
    </Panel>
  )
}

function SuggestionResults({
  result,
  paletteHexes,
  addedHexes,
  showAll,
  onShowAll,
  onAdd,
}: {
  result: SuggestionResult
  paletteHexes: Set<string>
  addedHexes: Set<string>
  showAll: boolean
  onShowAll: () => void
  onAdd: (suggestion: SuggestionColor) => void
}) {
  const visibleHarmonies = result.harmonies.slice(0, 3)
  return (
    <>
      <div className="compact-suggestion-list">
        {visibleHarmonies.map((harmony) => (
          <article className="compact-suggestion-group" key={harmony.type}>
            <div>
              <h3>{harmony.type}</h3>
              <p>{oneSentence(harmony.description)}</p>
            </div>
            <div className="compact-suggestion-colors">
              {harmony.suggestions.slice(0, 3).map((suggestion) => {
                const key = suggestion.hex.toLowerCase()
                const duplicate = paletteHexes.has(key)
                const added = addedHexes.has(key)
                return (
                  <div
                    className="compact-suggestion"
                    key={`${harmony.type}-${suggestion.hex}`}
                  >
                    <span
                      className="suggestion-preview"
                      style={{ backgroundColor: suggestion.hex }}
                      aria-label={`Suggested color ${suggestion.hex}`}
                    />
                    <code>{suggestion.hex}</code>
                    <Button
                      variant="quiet"
                      icon={
                        added || duplicate ? (
                          <Check size={15} aria-hidden="true" />
                        ) : (
                          <Plus size={15} aria-hidden="true" />
                        )
                      }
                      onClick={() => onAdd(suggestion)}
                      disabled={duplicate || added}
                      aria-label={`${added ? 'Added' : duplicate ? 'Already in palette' : 'Add'} ${suggestion.hex}`}
                    >
                      {added ? 'Added' : duplicate ? 'In palette' : 'Add'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
      <Button variant="secondary" onClick={onShowAll} aria-expanded={showAll}>
        {showAll ? 'Hide educational details' : 'Explore all relationships'}
      </Button>
      {showAll && (
        <div className="suggestion-education">
          {result.harmonies.map((harmony) => (
            <article key={harmony.type}>
              <MiniColorWheel
                baseHue={result.baseColor.hsl.h}
                angles={[
                  result.baseColor.hsl.h,
                  ...harmony.suggestions.map((item) => item.hsl.h),
                ]}
                colors={[
                  result.baseColor.hex,
                  ...harmony.suggestions.map((item) => item.hex),
                ]}
                size={120}
              />
              <div>
                <h3>
                  {harmony.type} · {harmony.angle}
                </h3>
                <p>{harmony.description}</p>
                <dl>
                  <div>
                    <dt>Mood</dt>
                    <dd>{harmony.mood}</dd>
                  </div>
                  <div>
                    <dt>Examples</dt>
                    <dd>{harmony.examples}</dd>
                  </div>
                  <div>
                    <dt>Useful for</dt>
                    <dd>{harmony.useCases.join(', ')}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
      {visibleHarmonies.length === 0 && (
        <Notice>No suggestions were returned for this base color.</Notice>
      )}
    </>
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
