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
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('button-destructive')
  })

  it('gives icon-only controls an accessible name', () => {
    render(<IconButton label="Generate palette" icon={<Sparkles />} />)
    expect(screen.getByRole('button', { name: 'Generate palette' })).toHaveAttribute(
      'title',
      'Generate palette',
    )
  })

  it('uses live status semantics for notices', () => {
    render(<Notice variant="error">Could not load colors.</Notice>)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load colors.')
  })

  it('exposes selected tab state', () => {
    render(
      <Tabs
        label="Result view"
        options={[{ id: 'wheel', label: 'Wheel' }, { id: 'data', label: 'Data' }]}
        selected="wheel"
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByRole('tab', { name: 'Wheel' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders an accessible modal and closes on Escape', () => {
    const onClose = vi.fn()
    render(<Dialog open title="Picker" onClose={onClose}>Content</Dialog>)
    const dialog = screen.getByRole('dialog', { name: 'Picker' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
