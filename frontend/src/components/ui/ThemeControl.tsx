import { useEffect, useState } from 'react'
import {
  applyTheme,
  persistTheme,
  storedTheme,
  type ThemePreference,
} from '../../theme'

export default function ThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>(() => storedTheme())

  useEffect(() => {
    applyTheme(preference)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (preference === 'system') applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const changeTheme = (next: ThemePreference) => {
    persistTheme(next)
    setPreference(next)
  }

  return (
    <div className="theme-control">
      <label htmlFor="theme-preference">Theme</label>
      <select
        id="theme-preference"
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
