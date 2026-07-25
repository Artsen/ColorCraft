import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('style accessibility contracts', () => {
  it('removes interface motion when reduced motion is requested', () => {
    const tokens = readFileSync(
      resolve(process.cwd(), 'src/styles/tokens.css'),
      'utf8',
    )
    expect(tokens).toContain('@media (prefers-reduced-motion: reduce)')
    expect(tokens).toContain('--motion-base: 0ms')
  })

  it('provides forced-colors fallbacks for interactive states', () => {
    const features = readFileSync(
      resolve(process.cwd(), 'src/styles/features.css'),
      'utf8',
    )
    expect(features).toContain('@media (forced-colors: active)')
    expect(features).toContain('Highlight')
  })
})
