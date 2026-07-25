import { beforeEach, describe, expect, it, vi } from 'vitest'
import { analyzeColors, extractColors } from './client'
import { ColorCraftApiError } from './errors'
import { analysis, blue, red } from '../test/fixtures'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('ColorCraft API client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses a successful API response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        colors: [red, blue, red],
        count: 3,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await extractColors(new File(['image'], 'image.png'), 3)

    expect(result.count).toBe(3)
    expect(result.colors[0]).toEqual(red)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('rejects failed HTTP responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'image_decode_error',
              message:
                'The image could not be decoded. Choose a valid JPG, PNG, or WebP image.',
            },
          },
          422,
        ),
      ),
    )

    await expect(
      extractColors(new File(['invalid'], 'image.png'), 3),
    ).rejects.toMatchObject({
      code: 'image_decode_error',
      status: 422,
    })
  })

  it('parses backend validation errors into a stable error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'validation_error',
              message: 'Request validation failed.',
              details: [
                {
                  location: ['body', 'colors', 0, 'hex'],
                  message: 'String should match pattern',
                  type: 'string_pattern_mismatch',
                },
              ],
            },
          },
          422,
        ),
      ),
    )

    try {
      await analyzeColors([red, blue])
      throw new Error('Expected analyzeColors to reject')
    } catch (error) {
      expect(error).toBeInstanceOf(ColorCraftApiError)
      expect(error).toMatchObject({
        code: 'validation_error',
        status: 422,
        details: [
          {
            location: ['body', 'colors', 0, 'hex'],
          },
        ],
      })
    }
  })

  it('rejects a successful response that violates the contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ success: true, analysis: { ...analysis, accessibility: {} } }),
      ),
    )

    await expect(analyzeColors([red, blue])).rejects.toMatchObject({
      code: 'contract_error',
    })
  })
})
