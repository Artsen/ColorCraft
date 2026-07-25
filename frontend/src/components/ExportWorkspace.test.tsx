import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { red } from '../test/fixtures'
import ExportWorkspace from './ExportWorkspace'

describe('ExportWorkspace actions', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:export'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('reports Clipboard API success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(
      <ExportWorkspace
        colors={[red]}
        paletteName="Launch colors"
        roles={{}}
        onPaletteNameChange={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(screen.getByText('CSS custom properties copied to the clipboard.')).toBeInTheDocument()
  })

  it('reports clipboard denial and offers a select-preview recovery action', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    render(
      <ExportWorkspace
        colors={[red]}
        paletteName="Launch colors"
        roles={{}}
        onPaletteNameChange={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Clipboard permission was denied')
    fireEvent.click(screen.getByRole('button', { name: 'Select preview' }))
    expect(screen.getByLabelText('Generated CSS custom properties preview')).toHaveFocus()
  })

  it('downloads with a sanitized filename and revokes the object URL', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(
      <ExportWorkspace
        colors={[red]}
        paletteName="../../Launch: Summer?"
        roles={{}}
        onPaletteNameChange={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export')
    expect(screen.getByText('launch-summer.css downloaded.')).toBeInTheDocument()
    click.mockRestore()
  })
})
