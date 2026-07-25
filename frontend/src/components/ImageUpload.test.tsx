import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ImageUpload, { MAX_IMAGE_BYTES } from './ImageUpload'

function imageFile(name = 'source.png', type = 'image/png') {
  return new File(['image'], name, { type })
}

describe('ImageUpload', () => {
  it('accepts a valid image through drag and drop', async () => {
    const onImageSelected = vi.fn()
    render(<ImageUpload onImageSelected={onImageSelected} onStartManual={vi.fn()} />)
    const zone = screen.getByRole('button', { name: 'Choose or drop a source image' })
    const file = imageFile()

    fireEvent.dragEnter(zone, { dataTransfer: { files: [file] } })
    expect(screen.getByText('Release to use this image')).toBeInTheDocument()
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })

    await waitFor(() => expect(onImageSelected).toHaveBeenCalledWith(file))
  })

  it('opens the file input from the keyboard', () => {
    const { container } = render(
      <ImageUpload onImageSelected={vi.fn()} onStartManual={vi.fn()} />,
    )
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const click = vi.spyOn(input, 'click')
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Choose or drop a source image' }),
      { key: 'Enter' },
    )
    expect(click).toHaveBeenCalledOnce()
  })

  it('rejects unsupported and oversized files inline', async () => {
    const onImageSelected = vi.fn()
    const { container } = render(
      <ImageUpload onImageSelected={onImageSelected} onStartManual={vi.fn()} />,
    )
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!

    fireEvent.change(input, { target: { files: [imageFile('notes.txt', 'text/plain')] } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a JPG, PNG, or WebP image.')

    const oversized = imageFile()
    Object.defineProperty(oversized, 'size', { value: MAX_IMAGE_BYTES + 1 })
    fireEvent.change(input, { target: { files: [oversized] } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an image smaller than 15 MB.')
    expect(onImageSelected).not.toHaveBeenCalled()
  })
})
