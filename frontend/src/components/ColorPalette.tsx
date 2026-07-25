import { Plus } from 'lucide-react'
import type { Color } from '../api/contracts'
import type { PaletteColor } from '../workspace'
import PaletteItem from './PaletteItem'
import Button from './ui/Button'

interface ColorPaletteProps {
  colors: PaletteColor[]
  selectedIndex: number | null
  sourceAvailable: boolean
  onSelect: (index: number) => void
  onColorChange: (index: number, color: Color) => void
  onAddColor: () => void
  onDuplicateColor: (index: number) => void
  onRemoveColor: (index: number) => void
  onPickFromImage: (index: number) => void
}

export default function ColorPalette({
  colors,
  selectedIndex,
  sourceAvailable,
  onSelect,
  onColorChange,
  onAddColor,
  onDuplicateColor,
  onRemoveColor,
  onPickFromImage,
}: ColorPaletteProps) {
  return (
    <div className="palette-editor">
      <div className="palette-list">
        {colors.map((color, index) => (
          <PaletteItem
            key={`${index}-${color.hex}`}
            color={color}
            index={index}
            selected={selectedIndex === index}
            sourceAvailable={sourceAvailable}
            onSelect={() => onSelect(index)}
            onChange={(next) => onColorChange(index, next)}
            onDuplicate={() => onDuplicateColor(index)}
            onRemove={() => onRemoveColor(index)}
            onPickFromImage={() => onPickFromImage(index)}
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
