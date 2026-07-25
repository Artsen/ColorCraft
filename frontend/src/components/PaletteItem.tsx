import {
  ArrowDown,
  ArrowUp,
  Copy,
  Pipette,
  SwatchBook,
  Trash2,
} from 'lucide-react'
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
  MAX_COLOR_NAME_LENGTH,
  normalizeColorName,
  paletteColorLabel,
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
  onNameChange?: (name?: string) => void
  onDuplicate: () => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onPickFromImage: () => void
}

export default function PaletteItem({
  color,
  index,
  selected,
  sourceAvailable,
  onSelect,
  onChange,
  onNameChange = () => undefined,
  onDuplicate,
  onRemove,
  onMoveUp = () => undefined,
  onMoveDown = () => undefined,
  canMoveUp = false,
  canMoveDown = false,
  onPickFromImage,
}: PaletteItemProps) {
  const inputId = useId()
  const nameInputId = useId()
  const nativePickerRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(color.hex.toUpperCase())
  const [invalid, setInvalid] = useState(false)
  const [nameDraft, setNameDraft] = useState(color.name ?? '')

  useEffect(() => {
    setDraft(color.hex.toUpperCase())
    setInvalid(false)
  }, [color.hex])
  useEffect(() => setNameDraft(color.name ?? ''), [color.name])

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

  const commitName = () => {
    const next = normalizeColorName(nameDraft)
    setNameDraft(next ?? '')
    if (next !== color.name) onNameChange(next)
  }

  return (
    <article
      className="palette-row"
      data-selected={selected || undefined}
      onClick={onSelect}
      onFocusCapture={onSelect}
      aria-label={paletteColorLabel(color, index)}
    >
      <div
        className="palette-row-swatch"
        style={{ backgroundColor: color.hex }}
      />
      <div className="palette-row-editor">
        <label htmlFor={inputId}>Color {index + 1}</label>
        <input
          id={inputId}
          className="palette-hex-input"
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
        <label htmlFor={nameInputId}>Name for color {index + 1}</label>
        <input
          id={nameInputId}
          className="palette-name-input"
          value={nameDraft}
          maxLength={MAX_COLOR_NAME_LENGTH}
          placeholder="Optional name"
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitName()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              setNameDraft(color.name ?? '')
              event.currentTarget.blur()
            }
          }}
        />
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
          aria-label={`Native color picker for ${paletteColorLabel(color, index)}`}
          onChange={(event) => {
            const next = colorFromHex(event.target.value)
            if (next) onChange(next)
          }}
        />
        <IconButton
          compact
          label={`Open native color picker for ${paletteColorLabel(color, index)}`}
          icon={<SwatchBook size={15} aria-hidden="true" />}
          onClick={() => nativePickerRef.current?.click()}
        />
        {sourceAvailable && (
          <IconButton
            compact
            label={`Pick ${paletteColorLabel(color, index)} from image`}
            icon={<Pipette size={15} aria-hidden="true" />}
            onClick={onPickFromImage}
          />
        )}
        <ContextMenu
          label={`Actions for ${paletteColorLabel(color, index)}`}
          items={[
            {
              label: 'Move up',
              icon: <ArrowUp size={15} aria-hidden="true" />,
              disabled: !canMoveUp,
              onSelect: onMoveUp,
            },
            {
              label: 'Move down',
              icon: <ArrowDown size={15} aria-hidden="true" />,
              disabled: !canMoveDown,
              onSelect: onMoveDown,
            },
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
