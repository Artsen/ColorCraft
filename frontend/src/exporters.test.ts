import { describe, expect, it } from 'vitest'
import { blue, red } from './test/fixtures'
import {
  exportTokens,
  generateCss,
  generateJson,
  generateSvg,
  generateTailwind,
  reservedSemanticTokens,
  sanitizeFilename,
} from './exporters'

const palette = {
  name: 'Launch </title><script>alert("x")</script> / Summer',
  colors: [
    { ...red, population: 0.7 },
    { ...blue, population: 0.3 },
  ],
  roles: {
    primaryText: red.id,
    pageBackground: blue.id,
  },
}

describe('browser palette exporters', () => {
  it('generates ordered CSS custom properties with a safe comment', () => {
    const output = generateCss(palette)
    expect(output).toContain('--color-palette-1: #ff0000;')
    expect(output).toContain('--role-page-background: var(--color-palette-2);')
    expect(output).toContain('--role-primary-text: var(--color-palette-1);')
    expect(output.indexOf('--role-page-background')).toBeLessThan(
      output.indexOf('--role-primary-text'),
    )
    expect(output).not.toContain('--role-surface')
    expect(output.indexOf('#ff0000')).toBeLessThan(output.indexOf('#0000ff'))
    expect(output).not.toContain('*/ Summer')
  })

  it('generates schema-versioned JSON with population and roles', () => {
    const output = JSON.parse(generateJson(palette))
    expect(output.schemaVersion).toBe(3)
    expect(output.format).toBe('colorcraft-palette')
    expect(output.paletteName).toBe(palette.name)
    expect(output.colors.map((color: { hex: string }) => color.hex)).toEqual([
      '#FF0000',
      '#0000FF',
    ])
    expect(output.colors[0].population).toBe(0.7)
    expect(output.colors.map((color: { key: string }) => color.key)).toEqual([
      'color-1',
      'color-2',
    ])
    expect(output.roleAssignments.primaryText).toBe('color-1')
    expect(output.colors[0]).not.toHaveProperty('id')
  })

  it('generates a usable ordered Tailwind configuration fragment', () => {
    const output = generateTailwind(palette)
    expect(output).toContain('colors: {')
    expect(output).toContain("'palette-1': '#ff0000'")
    expect(output).toContain("'palette-2': '#0000ff'")
    expect(output).toContain("'role-page-background': '#0000ff'")
    expect(output).toContain("'role-primary-text': '#ff0000'")
  })

  it('escapes user text in SVG and includes readable ordered swatches', () => {
    const output = generateSvg(palette)
    expect(output).toContain('&lt;/title&gt;&lt;script&gt;')
    expect(output).not.toContain('<script>')
    expect(output.indexOf('#FF0000')).toBeLessThan(output.indexOf('#0000FF'))
    expect(output).toContain('<title id="title">')
    expect(output).toContain('Page background')
    expect(output).toContain('Primary text')
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

  it('reserves every semantic role token even when roles are unassigned', () => {
    const colors = reservedSemanticTokens.map((token, index) => ({
      ...(index % 2 === 0 ? red : blue),
      id: `reserved-${index}`,
      name: token
        .split('-')
        .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
        .join(' '),
    }))
    expect(exportTokens(colors)).toEqual(
      reservedSemanticTokens.map((token) => `${token}-2`),
    )
    const withoutRoles = generateTailwind({
      ...palette,
      colors,
      roles: {},
    })
    const withRoles = generateTailwind({
      ...palette,
      colors,
      roles: { primaryAction: colors[0].id },
    })
    const keys = (output: string) =>
      [...output.matchAll(/^\s+'([^']+)':/gm)].map((match) => match[1])
    expect(keys(withRoles).slice(0, colors.length)).toEqual(
      keys(withoutRoles).slice(0, colors.length),
    )
  })

  it('allocates deterministic suffixes across reserved and existing suffixes', () => {
    const colors = [
      { ...red, id: 'one', name: 'Role primary action' },
      { ...blue, id: 'two', name: 'Role primary action 2' },
      { ...red, id: 'three', name: 'Role primary action' },
      { ...blue, id: 'four', name: 'Ordinary' },
      { ...red, id: 'five', name: 'Ordinary' },
      { ...blue, id: 'six', name: 'Ordinary 2' },
    ]
    expect(exportTokens(colors)).toEqual([
      'role-primary-action-2',
      'role-primary-action-2-2',
      'role-primary-action-3',
      'ordinary',
      'ordinary-2',
      'ordinary-2-2',
    ])
  })

  it.each([
    'Role primary action',
    'ROLE PRIMARY ACTION',
    'role---primary___action!!!',
  ])('normalizes the reserved-name variant %s safely', (name) => {
    expect(exportTokens([{ ...red, name }])).toEqual(['role-primary-action-2'])
  })

  it('keeps unnamed fallbacks and ordinary names unchanged', () => {
    expect(exportTokens([red, blue])).toEqual(['palette-1', 'palette-2'])
    expect(
      exportTokens([
        { ...red, name: 'Primary action' },
        { ...blue, name: 'Surface neutral' },
      ]),
    ).toEqual(['primary-action', 'surface-neutral'])
  })

  it('uses collision-safe base tokens consistently in CSS and Tailwind', () => {
    const collisionPalette = {
      ...palette,
      colors: [
        { ...red, name: 'Role primary action' },
        { ...blue, name: 'Role primary action' },
      ],
      roles: {
        primaryAction: red.id,
        pageBackground: blue.id,
      },
    }
    const css = generateCss(collisionPalette)
    expect(css).toContain('--color-role-primary-action-2: #ff0000;')
    expect(css).toContain('--color-role-primary-action-3: #0000ff;')
    expect(css).toContain(
      '--role-primary-action: var(--color-role-primary-action-2);',
    )
    expect(css).toContain(
      '--role-page-background: var(--color-role-primary-action-3);',
    )

    const tailwind = generateTailwind(collisionPalette)
    const keys = [...tailwind.matchAll(/^\s+'([^']+)':/gm)].map(
      (match) => match[1],
    )
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual([
      'role-primary-action-2',
      'role-primary-action-3',
      'role-page-background',
      'role-primary-action',
    ])
  })

  it('keeps duplicate-color semantic ownership distinct', () => {
    const duplicate = { ...red, id: 'second-red', name: 'Second red' }
    const duplicatePalette = {
      ...palette,
      colors: [{ ...red, name: 'First red' }, duplicate],
      roles: {
        pageBackground: red.id,
        primaryAction: duplicate.id,
      },
    }
    const css = generateCss(duplicatePalette)
    expect(css).toContain('--role-page-background: var(--color-first-red);')
    expect(css).toContain('--role-primary-action: var(--color-second-red);')
    expect(generateTailwind(duplicatePalette)).toContain(
      "'role-primary-action': '#ff0000'",
    )
    expect(generateSvg(duplicatePalette)).toMatch(
      /First red[\s\S]*Page background[\s\S]*Second red[\s\S]*Primary action/,
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
