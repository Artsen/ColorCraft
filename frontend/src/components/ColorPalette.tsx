import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { Color } from '../api/contracts'
import type { PaletteColor } from '../workspace'
import PaletteItem from './PaletteItem'
import Button from './ui/Button'

interface ColorPaletteProps {
  colors: PaletteColor[]
  selectedColorId: string | null
  sourceAvailable: boolean
  onSelect: (id: string) => void
  onColorChange: (id: string, color: Color) => void
  onNameChange: (id: string, name?: string) => void
  onAddColor: () => void
  onDuplicateColor: (id: string) => void
  onRemoveColor: (id: string) => void
  onMoveColor: (id: string, direction: -1 | 1) => void
  onPickFromImage: (id: string) => void
}

export default function ColorPalette({
  colors,
  selectedColorId,
  sourceAvailable,
  onSelect,
  onColorChange,
  onNameChange,
  onAddColor,
  onDuplicateColor,
  onRemoveColor,
  onMoveColor,
  onPickFromImage,
}: ColorPaletteProps) {
  const [moveStatus, setMoveStatus] = useState('')
  const moveColor = (color: PaletteColor, index: number, direction: -1 | 1) => {
    onMoveColor(color.id, direction)
    setMoveStatus(
      `Moved ${color.name ?? `Color ${index + 1}`} to position ${index + direction + 1} of ${colors.length}.`,
    )
  }

  return (
    <div className="palette-editor">
      <p className="visually-hidden" aria-live="polite">
        {moveStatus}
      </p>
      <div className="palette-list">
        {colors.map((color, index) => (
          <PaletteItem
            key={color.id}
            color={color}
            index={index}
            selected={selectedColorId === color.id}
            sourceAvailable={sourceAvailable}
            onSelect={() => onSelect(color.id)}
            onChange={(next) => onColorChange(color.id, next)}
            onNameChange={(name) => onNameChange(color.id, name)}
            onDuplicate={() => onDuplicateColor(color.id)}
            onRemove={() => onRemoveColor(color.id)}
            onMoveUp={() => moveColor(color, index, -1)}
            onMoveDown={() => moveColor(color, index, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < colors.length - 1}
            onPickFromImage={() => onPickFromImage(color.id)}
          />
        ))}
      </div>
      <Button
        variant="quiet"
        icon={<Plus size={16} aria-hidden="true" />}
        onClick={onAddColor}
        disabled={colors.length >= 10}
        className="add-color-row"
      >
        {colors.length >= 10 ? '10 color maximum' : 'Add color'}
      </Button>
    </div>
  )
}
