import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { extractColors } from '../api/client'
import { ColorCraftApiError } from '../api/errors'
import ImageUpload from './ImageUpload'

vi.mock('../api/client', () => ({
  extractColors: vi.fn(),
}))

describe('ImageUpload inline notices', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.mocked(extractColors).mockReset()
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
    })
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('shows an actionable inline notice and retries extraction', async () => {
    vi.mocked(extractColors).mockRejectedValue(
      new ColorCraftApiError(
        'The image could not be decoded. Choose a valid JPG, PNG, or WebP image.',
        { code: 'image_decode_error', status: 422 },
      ),
    )
    const { container } = render(
      <ImageUpload onColorsExtracted={vi.fn()} onSkipUpload={vi.fn()} />,
    )
    const input = container.querySelector('input[type="file"]')
    expect(input).not.toBeNull()

    fireEvent.change(input!, {
      target: {
        files: [new File(['invalid'], 'invalid.png', { type: 'image/png' })],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Extract Colors' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The image could not be decoded. Choose a valid JPG, PNG, or WebP image.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(extractColors).toHaveBeenCalledTimes(2))
  })
})
