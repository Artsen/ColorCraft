import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeControl from './components/ui/ThemeControl'
import {
  THEME_STORAGE_KEY,
  applyTheme,
  persistTheme,
  resolveTheme,
  storedTheme,
} from './theme'

function matchMedia(prefersDark: boolean): MediaQueryList {
  return {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

describe('theme preferences', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('matchMedia', vi.fn(() => matchMedia(false)))
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-preference')
  })

  it('resolves system light and dark preferences', () => {
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('stores, reads, and applies a preference', () => {
    persistTheme('dark')
    expect(storedTheme()).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(applyTheme('dark')).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement).toHaveAttribute('data-theme-preference', 'dark')
  })

  it('switches and persists from the theme control', () => {
    render(<ThemeControl />)
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'light' } })
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('boots the stored theme before the application module', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    expect(html).toContain("localStorage.getItem('colorcraft-theme')")
    expect(html.indexOf('colorcraft-theme')).toBeLessThan(html.indexOf('/src/main.tsx'))
  })
})
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
