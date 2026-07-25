import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SavedPalette } from '../persistence'
import { red, blue } from '../test/fixtures'
import PaletteLibrary from './PaletteLibrary'

const palettes: SavedPalette[] = [
  {
    schemaVersion: 1,
    id: 'newer',
    name: 'Ocean launch',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    sourceType: 'image',
    sourceFilename: 'fixture.png',
    colors: [blue],
    roles: {},
  },
  {
    schemaVersion: 1,
    id: 'older',
    name: 'Ember notes',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    sourceType: 'manual',
    colors: [red],
    roles: {},
  },
]

describe('PaletteLibrary', () => {
  it('renders an actionable empty state', () => {
    const onCreate = vi.fn()
    render(
      <PaletteLibrary
        palettes={[]}
        activePaletteId={null}
        loading={false}
        onCreate={onCreate}
        onOpen={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Create a palette' }))
    expect(onCreate).toHaveBeenCalledOnce()
  })

  it('searches and exposes open, rename, duplicate, and delete actions', () => {
    const onOpen = vi.fn()
    const onRename = vi.fn()
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()
    render(
      <PaletteLibrary
        palettes={palettes}
        activePaletteId="newer"
        loading={false}
        onCreate={vi.fn()}
        onOpen={onOpen}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    )
    expect(
      screen
        .getAllByRole('button', { name: /^Open/ })
        .map((item) => item.getAttribute('aria-label')),
    ).toEqual(['Open Ocean launch', 'Open Ember notes'])
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'ember' },
    })
    expect(screen.queryByText('Ocean launch')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open Ember notes' }))
    expect(onOpen).toHaveBeenCalledWith(palettes[1])
    fireEvent.click(screen.getByRole('button', { name: 'Rename Ember notes' }))
    fireEvent.change(screen.getByLabelText('Palette name'), {
      target: { value: 'Ember final' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }))
    expect(onRename).toHaveBeenCalledWith(palettes[1], 'Ember final')
    fireEvent.click(
      screen.getByRole('button', { name: 'Duplicate Ember notes' }),
    )
    expect(onDuplicate).toHaveBeenCalledWith(palettes[1])
    fireEvent.click(screen.getByRole('button', { name: 'Delete Ember notes' }))
    expect(onDelete).toHaveBeenCalledWith(palettes[1])
  })
})
