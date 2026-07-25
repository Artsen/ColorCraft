import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { suggestColors } from '../api/client'
import type {
  Color,
  SuggestionColor,
  SuggestionResponse,
} from '../api/contracts'
import { blue, red } from '../test/fixtures'
import ColorSuggestions from './ColorSuggestions'

vi.mock('../api/client', () => ({
  suggestColors: vi.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolver) => {
    resolve = resolver
  })
  return { promise, resolve }
}

function response(
  colors: Color[],
  label = 'Complementary',
): SuggestionResponse {
  const suggested: SuggestionColor = {
    ...blue,
    name: `${label} blue`,
    description: 'Generated suggestion',
  }
  return {
    success: true,
    suggestions: colors.map((baseColor) => ({
      baseColor,
      harmonies: [
        {
          type: label,
          angle: '180°',
          description: 'Relationship details',
          useCases: ['Testing'],
          commonAssociations: 'Color separation',
          examples: 'Example',
          suggestions: [suggested],
        },
      ],
    })),
  }
}

async function loadSuggestions(colors: Color[]) {
  vi.mocked(suggestColors).mockResolvedValueOnce(response(colors))
  fireEvent.click(screen.getByRole('button', { name: 'Generate suggestions' }))
  await screen.findByRole('heading', { name: 'Complementary' })
}

describe('ColorSuggestions palette lifecycle', () => {
  beforeEach(() => {
    vi.mocked(suggestColors).mockReset()
  })

  it('adds a suggestion and invalidates it when the palette expands', async () => {
    const onAddColor = vi.fn()
    const view = render(
      <ColorSuggestions colors={[red]} onAddColor={onAddColor} />,
    )
    await loadSuggestions([red])
    fireEvent.click(screen.getByRole('button', { name: 'Add #0000ff' }))
    expect(onAddColor).toHaveBeenCalledWith(expect.objectContaining(blue))
    expect(screen.getByRole('button', { name: 'Added #0000ff' })).toBeDisabled()

    view.rerender(
      <ColorSuggestions colors={[red, blue]} onAddColor={onAddColor} />,
    )
    expect(
      screen.getByRole('button', { name: 'Generate suggestions' }),
    ).toBeInTheDocument()
  })

  it('clamps a removed selected base color without undefined access', async () => {
    const view = render(
      <ColorSuggestions colors={[red, blue]} onAddColor={vi.fn()} />,
    )
    await loadSuggestions([red, blue])
    const selectors = screen.getAllByTitle(/#[0-9a-f]{6}/i)
    fireEvent.click(selectors[1])

    view.rerender(<ColorSuggestions colors={[red]} onAddColor={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: 'Generate suggestions' }),
    ).toBeInTheDocument()

    await loadSuggestions([red])
    expect(screen.getAllByTitle('#ff0000')).toHaveLength(1)
  })

  it('clears loaded suggestions after a color edit', async () => {
    const view = render(
      <ColorSuggestions colors={[red]} onAddColor={vi.fn()} />,
    )
    await loadSuggestions([red])
    const edited = { ...red, hex: '#fe0000', rgb: { ...red.rgb, r: 254 } }
    view.rerender(<ColorSuggestions colors={[edited]} onAddColor={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: 'Generate suggestions' }),
    ).toBeInTheDocument()
  })

  it('ignores an older response that arrives after a newer palette request', async () => {
    const first = deferred<SuggestionResponse>()
    const second = deferred<SuggestionResponse>()
    vi.mocked(suggestColors)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const view = render(
      <ColorSuggestions colors={[red]} onAddColor={vi.fn()} />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Generate suggestions' }),
    )
    view.rerender(<ColorSuggestions colors={[blue]} onAddColor={vi.fn()} />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Generate suggestions' }),
      ).not.toBeDisabled(),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Generate suggestions' }),
    )

    await act(async () => second.resolve(response([blue], 'Newest')))
    expect(
      await screen.findByRole('heading', { name: 'Newest' }),
    ).toBeInTheDocument()
    await act(async () => first.resolve(response([red], 'Stale')))
    expect(
      screen.queryByRole('heading', { name: 'Stale' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Newest' })).toBeInTheDocument()
  })

  it('does not apply a running response after palette reset', async () => {
    const pending = deferred<SuggestionResponse>()
    vi.mocked(suggestColors).mockReturnValueOnce(pending.promise)
    const view = render(
      <ColorSuggestions colors={[red]} onAddColor={vi.fn()} />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Generate suggestions' }),
    )
    view.rerender(<ColorSuggestions colors={[]} onAddColor={vi.fn()} />)
    await act(async () => pending.resolve(response([red], 'Stale')))
    expect(
      screen.queryByRole('heading', { name: 'Stale' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Generate suggestions' }),
    ).toBeDisabled()
  })

  it('marks duplicate suggestions without adding them', async () => {
    render(<ColorSuggestions colors={[red, blue]} onAddColor={vi.fn()} />)
    await loadSuggestions([red, blue])
    expect(
      screen.getByRole('button', { name: 'Already in palette #0000ff' }),
    ).toBeDisabled()
  })

  it('qualifies suggestions and labels conventional guidance', async () => {
    render(<ColorSuggestions colors={[red]} onAddColor={vi.fn()} />)
    await loadSuggestions([red])
    expect(
      screen.getByText(/do not measure palette quality/i),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Explore all relationships' }),
    )
    expect(screen.getByText('Common associations')).toBeInTheDocument()
    expect(screen.queryByText('Mood')).not.toBeInTheDocument()
  })
})
