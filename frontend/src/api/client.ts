import type { ZodType } from 'zod'
import {
  analysisResponseSchema,
  applicationMetadataSchema,
  extractionResponseSchema,
  suggestionResponseSchema,
  type AnalysisResponse,
  type ApplicationMetadata,
  type Color,
  type ExtractionResponse,
  type SuggestionResponse,
} from './contracts'
import {
  backendError,
  connectionError,
  contractError,
  ColorCraftApiError,
} from './errors'

const configuredBaseUrl = (
  import.meta.env.VITE_COLORCRAFT_API_URL || ''
).replace(/\/$/, '')

function apiUrl(path: string): string {
  return `${configuredBaseUrl}${path}`
}

function canonicalColors(colors: Color[]): Color[] {
  return colors.map((color) => ({
    hex: color.hex,
    rgb: color.rgb,
    hsl: color.hsl,
  }))
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  schema: ZodType<T>,
  init: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(apiUrl(path), init)
    const payload = await readJson(response)
    if (!response.ok) {
      throw backendError(response.status, payload)
    }

    const parsed = schema.safeParse(payload)
    if (!parsed.success) {
      throw contractError(parsed.error)
    }
    return parsed.data
  } catch (error) {
    if (error instanceof ColorCraftApiError) throw error
    throw connectionError(error)
  }
}

export function extractColors(
  file: File,
  colorCount: number,
  signal?: AbortSignal,
): Promise<ExtractionResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return request(
    `/api/extract-colors?n_colors=${encodeURIComponent(colorCount)}`,
    extractionResponseSchema,
    { method: 'POST', body: formData, signal },
  )
}

export function getMetadata(
  signal?: AbortSignal,
): Promise<ApplicationMetadata> {
  return request('/metadata', applicationMetadataSchema, {
    method: 'GET',
    signal,
  })
}

export function analyzeColors(
  colors: Color[],
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  return request('/api/analyze-colors', analysisResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ colors: canonicalColors(colors) }),
    signal,
  })
}

export function suggestColors(
  colors: Color[],
  signal?: AbortSignal,
): Promise<SuggestionResponse> {
  return request('/api/suggest-colors', suggestionResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ colors: canonicalColors(colors) }),
    signal,
  })
}
