export const THEME_STORAGE_KEY = 'colorcraft-theme'
export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export function storedTheme(
  storage: Pick<Storage, 'getItem'> = localStorage,
): ThemePreference {
  const value = storage.getItem(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : 'system'
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches,
): ResolvedTheme {
  return preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference
}

export function applyTheme(
  preference: ThemePreference,
  root: HTMLElement = document.documentElement,
): ResolvedTheme {
  const resolved = resolveTheme(preference)
  root.dataset.theme = resolved
  root.dataset.themePreference = preference
  root.style.colorScheme = resolved
  return resolved
}

export function persistTheme(
  preference: ThemePreference,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(THEME_STORAGE_KEY, preference)
}
