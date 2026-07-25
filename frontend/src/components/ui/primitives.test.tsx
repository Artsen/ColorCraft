import { fireEvent, render, screen } from '@testing-library/react'
import { Sparkles } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import Button from './Button'
import Dialog from './Dialog'
import IconButton from './IconButton'
import Notice from './Notice'
import Tabs from './Tabs'

describe('interface primitives', () => {
  it('applies explicit button variants', () => {
    render(<Button variant="destructive">Remove</Button>)
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass(
      'button-destructive',
    )
  })

  it('gives icon-only controls an accessible name', () => {
    render(<IconButton label="Generate palette" icon={<Sparkles />} />)
    expect(
      screen.getByRole('button', { name: 'Generate palette' }),
    ).toHaveAttribute('title', 'Generate palette')
  })

  it('uses live status semantics for notices', () => {
    render(<Notice variant="error">Could not load colors.</Notice>)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load colors.',
    )
  })

  it('exposes selected tab state', () => {
    render(
      <Tabs
        label="Result view"
        options={[
          { id: 'wheel', label: 'Wheel' },
          { id: 'data', label: 'Data' },
        ]}
        selected="wheel"
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByRole('tab', { name: 'Wheel' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('moves tab selection and focus with arrow and End keys', () => {
    const onSelect = vi.fn()
    render(
      <Tabs
        label="Review sections"
        options={[
          { id: 'overview', label: 'Overview' },
          { id: 'harmony', label: 'Harmony' },
          { id: 'contrast', label: 'Contrast' },
        ]}
        selected="overview"
        onSelect={onSelect}
      />,
    )
    const overview = screen.getByRole('tab', { name: 'Overview' })
    overview.focus()
    fireEvent.keyDown(overview, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith('harmony')
    expect(screen.getByRole('tab', { name: 'Harmony' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Harmony' }), {
      key: 'End',
    })
    expect(onSelect).toHaveBeenLastCalledWith('contrast')
    expect(screen.getByRole('tab', { name: 'Contrast' })).toHaveFocus()
  })

  it('renders an accessible modal and closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Dialog open title="Picker" onClose={onClose}>
        Content
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Picker' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(
      screen.getByRole('button', { name: 'Close dialog' }),
    ).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
