import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ImageColorPicker from './ImageColorPicker'

describe('ImageColorPicker dialog focus', () => {
  it('traps focus, closes with Escape, and returns focus to the trigger', () => {
    const onClose = vi.fn()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open picker'
    document.body.appendChild(trigger)
    trigger.focus()

    const view = render(
      <ImageColorPicker
        imageUrl="blob:source"
        onColorPicked={vi.fn()}
        onClose={onClose}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Pick a color from the image' }),
    ).toBeInTheDocument()
    const close = screen.getByRole('button', { name: 'Close dialog' })
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    expect(close).toHaveFocus()

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(cancel).toHaveFocus()
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(close).toHaveFocus()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    view.unmount()
    expect(trigger).toHaveFocus()
    trigger.remove()
  })
})
