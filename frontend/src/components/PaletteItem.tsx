import { Copy, Pipette, SwatchBook, Trash2 } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'
import type { Color } from '../api/contracts'
import {
  colorFromHex,
  isValidHex,
  normalizeHexDraft,
  type PaletteColor,
} from '../workspace'
import ContextMenu from './ui/ContextMenu'
import IconButton from './ui/IconButton'

interface PaletteItemProps {
  color: PaletteColor
  index: number
  selected: boolean
  sourceAvailable: boolean
  onSelect: () => void
  onChange: (color: Color) => void
  onDuplicate: () => void
  onRemove: () => void
  onPickFromImage: () => void
}

export default function PaletteItem({
  color,
  index,
  selected,
  sourceAvailable,
  onSelect,
  onChange,
  onDuplicate,
  onRemove,
  onPickFromImage,
}: PaletteItemProps) {
  const inputId = useId()
  const nativePickerRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(color.hex.toUpperCase())
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    setDraft(color.hex.toUpperCase())
    setInvalid(false)
  }, [color.hex])

  const commit = () => {
    const normalized = normalizeHexDraft(draft)
    const nextColor = colorFromHex(normalized)
    if (!nextColor) {
      setInvalid(true)
      return false
    }
    setDraft(nextColor.hex)
    setInvalid(false)
    if (nextColor.hex !== color.hex.toUpperCase()) onChange(nextColor)
    return true
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setDraft(color.hex.toUpperCase())
      setInvalid(false)
      event.currentTarget.blur()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = normalizeHexDraft(event.clipboardData.getData('text'))
    if (isValidHex(pasted)) {
      event.preventDefault()
      setDraft(pasted.toUpperCase())
      setInvalid(false)
    }
  }

  return (
    <article
      className="palette-row"
      data-selected={selected || undefined}
      onClick={onSelect}
      onFocusCapture={onSelect}
      aria-label={`Palette color ${index + 1}`}
    >
      <div
        className="palette-row-swatch"
        style={{ backgroundColor: color.hex }}
      />
      <div className="palette-row-editor">
        <label htmlFor={inputId}>Color {index + 1}</label>
        <input
          id={inputId}
          value={draft}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${inputId}-error` : undefined}
          spellCheck={false}
          onChange={(event) => {
            setDraft(event.target.value)
            setInvalid(!isValidHex(normalizeHexDraft(event.target.value)))
          }}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        {invalid && (
          <span className="field-error" id={`${inputId}-error`}>
            Enter a six-digit HEX value.
          </span>
        )}
      </div>
      <dl className="palette-row-metadata">
        <div>
          <dt>RGB</dt>
          <dd>
            {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
          </dd>
        </div>
        <div>
          <dt>HSL</dt>
          <dd>
            {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
          </dd>
        </div>
        {color.population !== undefined && (
          <div>
            <dt>Population</dt>
            <dd>{(color.population * 100).toFixed(1)}%</dd>
          </div>
        )}
      </dl>
      <div className="palette-row-actions">
        <input
          ref={nativePickerRef}
          type="color"
          value={color.hex}
          className="visually-hidden"
          tabIndex={-1}
          aria-label={`Native color picker for color ${index + 1}`}
          onChange={(event) => {
            const next = colorFromHex(event.target.value)
            if (next) onChange(next)
          }}
        />
        <IconButton
          compact
          label={`Open native color picker for color ${index + 1}`}
          icon={<SwatchBook size={15} aria-hidden="true" />}
          onClick={() => nativePickerRef.current?.click()}
        />
        {sourceAvailable && (
          <IconButton
            compact
            label={`Pick color ${index + 1} from image`}
            icon={<Pipette size={15} aria-hidden="true" />}
            onClick={onPickFromImage}
          />
        )}
        <ContextMenu
          label={`Actions for color ${index + 1}`}
          items={[
            {
              label: 'Duplicate color',
              icon: <Copy size={15} aria-hidden="true" />,
              onSelect: onDuplicate,
            },
            {
              label: 'Remove color',
              icon: <Trash2 size={15} aria-hidden="true" />,
              destructive: true,
              onSelect: onRemove,
            },
          ]}
        />
      </div>
    </article>
  )
}
