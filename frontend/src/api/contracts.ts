import { z } from 'zod'

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

export const rgbSchema = z
  .object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
  })
  .strict()

export const hslSchema = z
  .object({
    h: z.number().int().min(0).max(360),
    s: z.number().int().min(0).max(100),
    l: z.number().int().min(0).max(100),
  })
  .strict()

export const colorSchema = z
  .object({
    hex: hexColorSchema,
    rgb: rgbSchema,
    hsl: hslSchema,
  })
  .strict()

const pairSchema = z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()])
const triadSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
])
const tetradSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
])

export const harmonyResultsSchema = z
  .object({
    complementary: z.array(pairSchema),
    analogous: z.array(pairSchema),
    triadic: z.array(triadSchema),
    tetradic: z.array(tetradSchema),
    splitComplementary: z.array(triadSchema),
    monochromatic: z.boolean(),
  })
  .strict()

export const temperatureResultsSchema = z
  .object({
    balance: z.enum(['warm', 'cool', 'balanced', 'neutral']),
    warmCount: z.number().int().nonnegative(),
    coolCount: z.number().int().nonnegative(),
    warmRatio: z.number().min(0).max(1),
    coolRatio: z.number().min(0).max(1),
  })
  .strict()

export const metricsSchema = z
  .object({
    hueDiversity: z.number().nonnegative(),
    saturationAvg: z.number().min(0).max(100),
    lightnessRange: z.number().int().min(0).max(100),
  })
  .strict()

export const contrastPairSchema = z
  .object({
    color1: hexColorSchema,
    color2: hexColorSchema,
    ratio: z.number().min(1).max(21),
    aaNormal: z.boolean(),
    aaLarge: z.boolean(),
    aaaNormal: z.boolean(),
    aaaLarge: z.boolean(),
  })
  .strict()

export const accessibilityIssueSchema = z
  .object({
    type: z.string(),
    severity: z.enum(['warning', 'error']),
    message: z.string(),
    color1: hexColorSchema,
    color2: hexColorSchema,
    ratio: z.number().min(1).max(21),
  })
  .strict()

export const accessibilitySummarySchema = z
  .object({
    totalPairs: z.number().int().nonnegative(),
    aaNormalPasses: z.number().int().nonnegative(),
    aaLargePasses: z.number().int().nonnegative(),
    aaaNormalPasses: z.number().int().nonnegative(),
    aaaLargePasses: z.number().int().nonnegative(),
  })
  .strict()

export const accessibilityResultSchema = z
  .object({
    pairs: z.array(contrastPairSchema),
    issues: z.array(accessibilityIssueSchema),
    summary: accessibilitySummarySchema,
  })
  .strict()

export const analysisSchema = z
  .object({
    colorTheory: z
      .object({
        harmonies: harmonyResultsSchema,
        temperatureBalance: temperatureResultsSchema,
        score: z.number().int().min(0).max(100),
        tags: z.array(z.string()),
        metrics: metricsSchema,
      })
      .strict(),
    accessibility: accessibilityResultSchema,
  })
  .strict()

export const extractionResponseSchema = z
  .object({
    success: z.literal(true),
    colors: z.array(colorSchema).min(3).max(10),
    count: z.number().int().min(3).max(10),
  })
  .strict()

export const analysisResponseSchema = z
  .object({
    success: z.literal(true),
    analysis: analysisSchema,
  })
  .strict()

export const suggestionColorSchema = colorSchema.extend({
  name: z.string(),
  description: z.string(),
})

export const harmonySuggestionSchema = z
  .object({
    type: z.string(),
    angle: z.string(),
    description: z.string(),
    useCases: z.array(z.string()),
    mood: z.string(),
    examples: z.string(),
    suggestions: z.array(suggestionColorSchema),
  })
  .strict()

export const suggestionResultSchema = z
  .object({
    baseColor: colorSchema,
    harmonies: z.array(harmonySuggestionSchema),
  })
  .strict()

export const suggestionResponseSchema = z
  .object({
    success: z.literal(true),
    suggestions: z.array(suggestionResultSchema),
  })
  .strict()

export const validationIssueSchema = z
  .object({
    location: z.array(z.union([z.string(), z.number().int()])),
    message: z.string(),
    type: z.string(),
  })
  .strict()

export const errorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.array(validationIssueSchema).nullable().optional(),
      })
      .strict(),
  })
  .strict()

export type RGB = z.infer<typeof rgbSchema>
export type HSL = z.infer<typeof hslSchema>
export type Color = z.infer<typeof colorSchema>
export type HarmonyResults = z.infer<typeof harmonyResultsSchema>
export type TemperatureResults = z.infer<typeof temperatureResultsSchema>
export type ColorMetrics = z.infer<typeof metricsSchema>
export type ContrastPair = z.infer<typeof contrastPairSchema>
export type AccessibilityIssue = z.infer<typeof accessibilityIssueSchema>
export type AccessibilitySummary = z.infer<typeof accessibilitySummarySchema>
export type AccessibilityResult = z.infer<typeof accessibilityResultSchema>
export type Analysis = z.infer<typeof analysisSchema>
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>
export type SuggestionColor = z.infer<typeof suggestionColorSchema>
export type HarmonySuggestion = z.infer<typeof harmonySuggestionSchema>
export type SuggestionResult = z.infer<typeof suggestionResultSchema>
export type SuggestionResponse = z.infer<typeof suggestionResponseSchema>
export type ValidationIssue = z.infer<typeof validationIssueSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
