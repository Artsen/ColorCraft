import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { blue, red } from '../test/fixtures'
import ColorPalette from './ColorPalette'

describe('ColorPalette organization', () => {
  it('uses IDs for selection and announces movement', () => {
    const onMoveColor = vi.fn()
    render(
      <ColorPalette
        colors={[{ ...red, name: 'Primary action' }, blue]}
        selectedColorId={red.id}
        sourceAvailable={false}
        onSelect={vi.fn()}
        onColorChange={vi.fn()}
        onNameChange={vi.fn()}
        onAddColor={vi.fn()}
        onDuplicateColor={vi.fn()}
        onRemoveColor={vi.fn()}
        onMoveColor={onMoveColor}
        onPickFromImage={vi.fn()}
      />,
    )
    const menus = screen.getAllByRole('button', { name: /Actions for/ })
    fireEvent.click(menus[0])
    expect(screen.getByRole('menuitem', { name: 'Move up' })).toBeDisabled()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Move down' }))
    expect(onMoveColor).toHaveBeenCalledWith(red.id, 1)
    expect(screen.getByText('Moved Primary action to position 2 of 2.')).toBe(
      screen.getByText('Moved Primary action to position 2 of 2.'),
    )
  })

  it('edits and clears optional names on blur, Enter, and Escape', () => {
    const onNameChange = vi.fn()
    render(
      <ColorPalette
        colors={[{ ...red, name: 'Primary' }]}
        selectedColorId={red.id}
        sourceAvailable={false}
        onSelect={vi.fn()}
        onColorChange={vi.fn()}
        onNameChange={onNameChange}
        onAddColor={vi.fn()}
        onDuplicateColor={vi.fn()}
        onRemoveColor={vi.fn()}
        onMoveColor={vi.fn()}
        onPickFromImage={vi.fn()}
      />,
    )
    const input = screen.getByLabelText('Name for color 1')
    fireEvent.change(input, { target: { value: '  Surface  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onNameChange).toHaveBeenCalledWith(red.id, 'Surface')

    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveValue('Primary')

    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)
    expect(onNameChange).toHaveBeenCalledWith(red.id, undefined)
  })
})
