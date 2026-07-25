import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeColors,
  extractColors,
  getMetadata,
  suggestColors,
} from './client'
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
        colors: [red, blue, red].map((color, index) => ({
          hex: color.hex,
          rgb: color.rgb,
          hsl: color.hsl,
          population: 1 / 3,
          pixelCount: 10 - index,
        })),
        count: 3,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await extractColors(new File(['image'], 'image.png'), 3)

    expect(result.count).toBe(3)
    expect(result.colors[0]).toMatchObject({
      hex: red.hex,
      rgb: red.rgb,
      hsl: red.hsl,
    })
    expect(result.colors[0].population).toBeCloseTo(1 / 3)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('parses the runtime network mode from metadata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          schemaVersion: 1,
          id: 'colorcraft',
          name: 'ColorCraft',
          descriptor: 'Local color utility',
          version: '1.0.0',
          icon: 'http://127.0.0.1:5174/colorcraft-mark.svg',
          webUrl: 'http://127.0.0.1:5174',
          apiUrl: 'http://127.0.0.1:4100',
          healthUrl: 'http://127.0.0.1:4100/health',
          readinessUrl: 'http://127.0.0.1:4100/ready',
          networkMode: 'loopback',
          capabilities: ['contrast-review'],
        }),
      ),
    )

    await expect(getMetadata()).resolves.toMatchObject({
      networkMode: 'loopback',
    })
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
        jsonResponse({
          success: true,
          analysis: { ...analysis, accessibility: {} },
        }),
      ),
    )

    await expect(analyzeColors([red, blue])).rejects.toMatchObject({
      code: 'contract_error',
    })
  })

  it('strips extraction metadata from strict palette requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: true, analysis }))
      .mockResolvedValueOnce(jsonResponse({ success: true, suggestions: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const extractedColor = {
      ...red,
      population: 1,
      pixelCount: 400,
    }

    await analyzeColors([extractedColor, blue])
    await suggestColors([extractedColor])

    for (const call of fetchMock.mock.calls) {
      const request = call[1] as RequestInit
      const payload = JSON.parse(String(request.body))
      expect(payload.colors[0]).toEqual({
        hex: red.hex,
        rgb: red.rgb,
        hsl: red.hsl,
      })
      expect(payload.colors[0]).not.toHaveProperty('id')
      expect(payload.colors[0]).not.toHaveProperty('name')
      expect(payload.colors[0]).not.toHaveProperty('population')
      expect(payload.colors[0]).not.toHaveProperty('pixelCount')
    }
  })
})
