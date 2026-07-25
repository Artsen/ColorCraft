import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { red } from '../test/fixtures'
import PaletteItem from './PaletteItem'

function renderItem(onChange = vi.fn()) {
  const props = {
    color: red,
    index: 0,
    selected: true,
    sourceAvailable: true,
    onSelect: vi.fn(),
    onChange,
    onDuplicate: vi.fn(),
    onRemove: vi.fn(),
    onPickFromImage: vi.fn(),
  }
  render(<PaletteItem {...props} />)
  return props
}

describe('PaletteItem HEX draft behavior', () => {
  it('does not commit partial or invalid typing', () => {
    const onChange = vi.fn()
    renderItem(onChange)
    const input = screen.getByLabelText('Color 1')
    fireEvent.change(input, { target: { value: '#12' } })
    expect(input).toHaveValue('#12')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('commits valid HEX on blur and Enter', () => {
    const onChange = vi.fn()
    renderItem(onChange)
    const input = screen.getByLabelText('Color 1')
    fireEvent.change(input, { target: { value: '#00ff00' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 } }),
    )

    fireEvent.change(input, { target: { value: '#0000ff' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 } }),
    )
  })

  it('reverts with Escape and normalizes an unprefixed paste', () => {
    renderItem()
    const input = screen.getByLabelText('Color 1')
    fireEvent.change(input, { target: { value: '#12' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveValue('#FF0000')

    fireEvent.paste(input, {
      clipboardData: { getData: () => '00ff00' },
    })
    expect(input).toHaveValue('#00FF00')
  })

  it('keeps invalid input visible after blur', () => {
    const onChange = vi.fn()
    renderItem(onChange)
    const input = screen.getByLabelText('Color 1')
    fireEvent.change(input, { target: { value: '#xyz' } })
    fireEvent.blur(input)
    expect(screen.getByText('Enter a six-digit HEX value.')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('runs duplicate and remove actions from a labeled context menu', () => {
    const props = renderItem()
    fireEvent.click(screen.getByRole('button', { name: 'Actions for color 1' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate color' }))
    expect(props.onDuplicate).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Actions for color 1' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove color' }))
    expect(props.onRemove).toHaveBeenCalledOnce()
  })
})
