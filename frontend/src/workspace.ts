import type { Color, ExtractedColor, RGB } from './api/contracts'

export type WorkspaceView = 'create' | 'review' | 'export'
export type PaletteColor = Color & Partial<Pick<ExtractedColor, 'population' | 'pixelCount'>>

export const workspaceViews: WorkspaceView[] = ['create', 'review', 'export']

export function viewFromLocation(search = window.location.search): WorkspaceView {
  const view = new URLSearchParams(search).get('view')
  return workspaceViews.includes(view as WorkspaceView)
    ? (view as WorkspaceView)
    : 'create'
}

export function urlForView(view: WorkspaceView, href = window.location.href): string {
  const url = new URL(href)
  url.searchParams.set('view', view)
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
