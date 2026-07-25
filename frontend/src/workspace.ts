import type { Color, ExtractedColor, RGB } from './api/contracts'

export type WorkspaceView = 'create' | 'review' | 'export' | 'library'
export type ReviewView = 'overview' | 'harmony' | 'contrast' | 'suggestions'
export const MAX_COLOR_NAME_LENGTH = 80

export type PaletteColor = Color &
  Partial<Pick<ExtractedColor, 'population' | 'pixelCount'>> & {
    id: string
    name?: string
  }

export const workspaceViews: WorkspaceView[] = [
  'create',
  'review',
  'export',
  'library',
]
export const reviewViews: ReviewView[] = [
  'overview',
  'harmony',
  'contrast',
  'suggestions',
]

export function viewFromLocation(
  search = window.location.search,
): WorkspaceView {
  const view = new URLSearchParams(search).get('view')
  return workspaceViews.includes(view as WorkspaceView)
    ? (view as WorkspaceView)
    : 'create'
}

export function urlForView(
  view: WorkspaceView,
  href = window.location.href,
): string {
  const url = new URL(href)
  url.searchParams.set('view', view)
  if (view !== 'review') url.searchParams.delete('review')
  return `${url.pathname}${url.search}${url.hash}`
}

export function reviewFromLocation(
  search = window.location.search,
): ReviewView {
  const review = new URLSearchParams(search).get('review')
  return reviewViews.includes(review as ReviewView)
    ? (review as ReviewView)
    : 'overview'
}

export function urlForReview(
  review: ReviewView,
  href = window.location.href,
): string {
  const url = new URL(href)
  url.searchParams.set('view', 'review')
  url.searchParams.set('review', review)
  return `${url.pathname}${url.search}${url.hash}`
}

export function normalizeHexDraft(value: string): string {
  const trimmed = value.trim()
  return /^[0-9a-f]{6}$/i.test(trimmed) ? `#${trimmed}` : trimmed
}

export function isValidHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

export function rgbToHsl(rgb: RGB) {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const delta = max - min
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / delta + 2) / 6
    else h = ((r - g) / delta + 4) / 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function colorFromHex(value: string): Color | null {
  const hex = normalizeHexDraft(value)
  if (!isValidHex(hex)) return null
  const rgb = {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
  return { hex: hex.toUpperCase(), rgb, hsl: rgbToHsl(rgb) }
}

let fallbackColorId = 0

export function createPaletteColorId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `color-${Date.now().toString(36)}-${(++fallbackColorId).toString(36)}`
  )
}

export function normalizeColorName(value: string): string | undefined {
  const name = value.trim().slice(0, MAX_COLOR_NAME_LENGTH)
  return name || undefined
}

export function paletteColorFromApi(
  color: Color | ExtractedColor,
  options: { id?: string; name?: string } = {},
): PaletteColor {
  const name = options.name ? normalizeColorName(options.name) : undefined
  return {
    id: options.id ?? createPaletteColorId(),
    ...(name ? { name } : {}),
    hex: color.hex.toUpperCase(),
    rgb: { ...color.rgb },
    hsl: { ...color.hsl },
    ...('population' in color ? { population: color.population } : {}),
    ...('pixelCount' in color ? { pixelCount: color.pixelCount } : {}),
  }
}

export function replacePaletteColorValue(
  current: PaletteColor,
  color: Color,
): PaletteColor {
  return paletteColorFromApi(color, { id: current.id, name: current.name })
}

export function clonePaletteColor(
  color: PaletteColor,
  options: { newId?: boolean; copyName?: boolean } = {},
): PaletteColor {
  const sourceName =
    options.copyName && color.name
      ? `${color.name.slice(0, MAX_COLOR_NAME_LENGTH - 5).trimEnd()} copy`
      : color.name
  return {
    ...paletteColorFromApi(color, {
      id: options.newId ? undefined : color.id,
      name: sourceName,
    }),
    ...(color.population === undefined ? {} : { population: color.population }),
    ...(color.pixelCount === undefined ? {} : { pixelCount: color.pixelCount }),
  }
}

export function paletteColorLabel(color: PaletteColor, index: number): string {
  return `${color.name ?? `Color ${index + 1}`} · ${color.hex.toUpperCase()}`
}

export function paletteRoleOptionLabel(
  color: PaletteColor,
  index: number,
): string {
  const position = `Color ${index + 1}`
  return color.name
    ? `${color.name} · ${color.hex.toUpperCase()} · ${position}`
    : `${position} · ${color.hex.toUpperCase()}`
}

export function deterministicPaletteColorId(
  paletteId: string,
  index: number,
  hex: string,
): string {
  const input = `${paletteId}:${index}:${hex.toLowerCase()}`
  let hash = 2166136261
  for (let position = 0; position < input.length; position += 1) {
    hash ^= input.charCodeAt(position)
    hash = Math.imul(hash, 16777619)
  }
  return `legacy-${index + 1}-${(hash >>> 0).toString(36)}`
}
