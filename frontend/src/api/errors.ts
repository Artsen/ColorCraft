import { ZodError } from 'zod'
import { errorResponseSchema, type ValidationIssue } from './contracts'

export class ColorCraftApiError extends Error {
  readonly code: string
  readonly status: number | null
  readonly details: ValidationIssue[] | null
  readonly cause: unknown

  constructor(
    message: string,
    options: {
      code: string
      status?: number | null
      details?: ValidationIssue[] | null
      cause?: unknown
    },
  ) {
    super(message)
    this.name = 'ColorCraftApiError'
    this.code = options.code
    this.status = options.status ?? null
    this.details = options.details ?? null
    this.cause = options.cause
  }
}

export function backendError(
  status: number,
  payload: unknown,
): ColorCraftApiError {
  const parsed = errorResponseSchema.safeParse(payload)
  if (parsed.success) {
    return new ColorCraftApiError(parsed.data.error.message, {
      code: parsed.data.error.code,
      status,
      details: parsed.data.error.details ?? null,
    })
  }
  return new ColorCraftApiError(
    `The ColorCraft API returned HTTP ${status}. Check the terminal and retry.`,
    { code: 'http_error', status },
  )
}

export function contractError(error: ZodError): ColorCraftApiError {
  return new ColorCraftApiError(
    'The ColorCraft API returned an unexpected response. Check the terminal and retry.',
    { code: 'contract_error', cause: error },
  )
}

export function connectionError(error: unknown): ColorCraftApiError {
  if (error instanceof ColorCraftApiError) return error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ColorCraftApiError('The request was canceled.', {
      code: 'request_canceled',
      cause: error,
    })
  }
  return new ColorCraftApiError(
    'The ColorCraft API is not ready. Check the terminal and retry.',
    { code: 'connection_error', cause: error },
  )
}

export function errorMessage(error: unknown): string {
  return connectionError(error).message
}
