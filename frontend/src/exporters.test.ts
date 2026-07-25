import { describe, expect, it } from 'vitest'
import { blue, red } from './test/fixtures'
import {
  exportTokens,
  generateCss,
  generateJson,
  generateSvg,
  generateTailwind,
  sanitizeFilename,
} from './exporters'

const palette = {
  name: 'Launch </title><script>alert("x")</script> / Summer',
  colors: [
    { ...red, population: 0.7 },
    { ...blue, population: 0.3 },
  ],
  roles: {
    primaryText: red.hex,
    pageBackground: blue.hex,
  },
}

describe('browser palette exporters', () => {
  it('generates ordered CSS custom properties with a safe comment', () => {
    const output = generateCss(palette)
    expect(output).toContain('--color-palette-1: #ff0000;')
    expect(output.indexOf('#ff0000')).toBeLessThan(output.indexOf('#0000ff'))
    expect(output).not.toContain('*/ Summer')
  })

  it('generates schema-versioned JSON with population and roles', () => {
    const output = JSON.parse(generateJson(palette))
    expect(output.schemaVersion).toBe(2)
    expect(output.format).toBe('colorcraft-palette')
    expect(output.paletteName).toBe(palette.name)
    expect(output.colors.map((color: { hex: string }) => color.hex)).toEqual([
      '#FF0000',
      '#0000FF',
    ])
    expect(output.colors[0].population).toBe(0.7)
    expect(output.roleAssignments.primaryText).toBe('#FF0000')
    expect(output.colors[0]).not.toHaveProperty('id')
  })

  it('generates a usable ordered Tailwind configuration fragment', () => {
    const output = generateTailwind(palette)
    expect(output).toContain('colors: {')
    expect(output).toContain("'palette-1': '#ff0000'")
    expect(output).toContain("'palette-2': '#0000ff'")
  })

  it('escapes user text in SVG and includes readable ordered swatches', () => {
    const output = generateSvg(palette)
    expect(output).toContain('&lt;/title&gt;&lt;script&gt;')
    expect(output).not.toContain('<script>')
    expect(output.indexOf('#FF0000')).toBeLessThan(output.indexOf('#0000FF'))
    expect(output).toContain('<title id="title">')
    expect(output).toMatch(
      /fill="#ff0000"[\s\S]*?<text[^>]+fill="#000000"[^>]*>1\. #FF0000/,
    )
    expect(output).toMatch(
      /fill="#0000ff"[\s\S]*?<text[^>]+fill="#ffffff"[^>]*>2\. #0000FF/,
    )
  })

  it('sanitizes unusual and path-like filenames', () => {
    expect(sanitizeFilename('../../Launch: Summer?')).toBe('launch-summer')
    expect(sanitizeFilename('<script>')).toBe('script')
    expect(sanitizeFilename('///')).toBe('colorcraft-palette')
  })

  it('generates safe deterministic tokens from optional Unicode names', () => {
    const colors = [
      { ...red, name: 'Prímary action!' },
      { ...blue, id: 'blue-2', name: 'Primary action' },
      { ...red, id: 'red-2', name: '🎨' },
      { ...blue, id: 'blue-3', name: '<script> */' },
    ]
    expect(exportTokens(colors)).toEqual([
      'primary-action',
      'primary-action-2',
      'palette-3',
      'script',
    ])
    expect(generateCss({ ...palette, colors })).toContain(
      '--color-primary-action-2',
    )
    expect(generateTailwind({ ...palette, colors })).toContain(
      "'palette-3': '#ff0000'",
    )
  })

  it('includes and escapes visible names in SVG', () => {
    const output = generateSvg({
      ...palette,
      colors: [{ ...red, name: 'Primary <Action> & "Go"' }],
    })
    expect(output).toContain(
      'Primary &lt;Action&gt; &amp; &quot;Go&quot; · #FF0000',
    )
  })
})
