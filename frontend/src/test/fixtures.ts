import type { Analysis, Color } from '../api/contracts'

export const red: Color = {
  hex: '#ff0000',
  rgb: { r: 255, g: 0, b: 0 },
  hsl: { h: 0, s: 100, l: 50 },
}

export const blue: Color = {
  hex: '#0000ff',
  rgb: { r: 0, g: 0, b: 255 },
  hsl: { h: 240, s: 100, l: 50 },
}

export const analysis: Analysis = {
  colorTheory: {
    harmonies: {
      complementary: [],
      analogous: [],
      triadic: [],
      tetradic: [],
      splitComplementary: [],
      monochromatic: [],
    },
    temperatureBalance: {
      balance: 'balanced',
      warmCount: 1,
      coolCount: 1,
      warmRatio: 0.5,
      coolRatio: 0.5,
    },
    relationshipFit: 50,
    relationshipSummary: 'Moderate geometric relationship',
    relationshipFactors: ['A complementary pair was measured.'],
    tags: ['Balanced Temperature'],
    metrics: {
      hueDiversity: 120,
      saturationAvg: 100,
      lightnessRange: 0,
    },
  },
  accessibility: {
    pairs: [
      {
        color1: '#ff0000',
        color2: '#0000ff',
        ratio: 2.15,
        aaNormal: false,
        aaLarge: false,
        aaaNormal: false,
        aaaLarge: false,
      },
    ],
    issues: [
      {
        type: 'low_contrast',
        severity: 'warning',
        message: 'Low contrast detected between #ff0000 and #0000ff.',
        color1: '#ff0000',
        color2: '#0000ff',
        ratio: 2.15,
      },
    ],
    summary: {
      totalPairs: 1,
      aaNormalPasses: 0,
      aaLargePasses: 0,
      aaaNormalPasses: 0,
      aaaLargePasses: 0,
    },
  },
}
