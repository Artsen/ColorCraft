import { useEffect, useId, useState } from 'react'
import {
  applyTheme,
  persistTheme,
  storedTheme,
  type ThemePreference,
} from '../../theme'

export default function ThemeControl() {
  const inputId = useId()
  const [preference, setPreference] = useState<ThemePreference>(() =>
    storedTheme(),
  )

  useEffect(() => {
    applyTheme(preference)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (preference === 'system') applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  useEffect(() => {
    const syncPreference = (event: Event) => {
      setPreference((event as CustomEvent<ThemePreference>).detail)
    }
    window.addEventListener('colorcraft-theme-change', syncPreference)
    return () =>
      window.removeEventListener('colorcraft-theme-change', syncPreference)
  }, [])

  const changeTheme = (next: ThemePreference) => {
    persistTheme(next)
    setPreference(next)
    window.dispatchEvent(
      new CustomEvent<ThemePreference>('colorcraft-theme-change', {
        detail: next,
      }),
    )
  }

  return (
    <div className="theme-control">
      <label htmlFor={inputId}>Theme</label>
      <select
        id={inputId}
        value={preference}
        onChange={(event) => changeTheme(event.target.value as ThemePreference)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  )
}
