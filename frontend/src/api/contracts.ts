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

export const extractedColorSchema = colorSchema.extend({
  population: z.number().min(0).max(1),
  pixelCount: z.number().int().positive(),
})

export const harmonyRelationshipSchema = z
  .object({
    type: z.enum([
      'complementary',
      'analogous',
      'triadic',
      'tetradic',
      'split_complementary',
      'monochromatic',
    ]),
    colorIndexes: z.array(z.number().int().nonnegative()).min(2).max(10),
    expectedAngles: z.array(z.number().min(0).max(360)).min(1).max(10),
    measuredAngles: z.array(z.number().min(0).max(360)).min(1).max(10),
    deviation: z.number().min(0).max(180),
    confidence: z.number().min(0).max(1),
  })
  .strict()

export const harmonyResultsSchema = z
  .object({
    complementary: z.array(harmonyRelationshipSchema),
    analogous: z.array(harmonyRelationshipSchema),
    triadic: z.array(harmonyRelationshipSchema),
    tetradic: z.array(harmonyRelationshipSchema),
    splitComplementary: z.array(harmonyRelationshipSchema),
    monochromatic: z.array(harmonyRelationshipSchema),
  })
  .strict()

export const temperatureResultsSchema = z
  .object({
    balance: z.enum(['warm', 'transitional', 'cool', 'mixed', 'neutral']),
    warmCount: z.number().int().nonnegative(),
    transitionalCount: z.number().int().nonnegative(),
    coolCount: z.number().int().nonnegative(),
    warmRatio: z.number().min(0).max(1),
    transitionalRatio: z.number().min(0).max(1),
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
        relationshipFit: z.number().int().min(0).max(100),
        relationshipSummary: z.string(),
        relationshipFactors: z.array(z.string()),
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
    colors: z.array(extractedColorSchema).min(1).max(10),
    count: z.number().int().min(1).max(10),
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
    commonAssociations: z.string(),
    examples: z.string(),
    suggestions: z.array(suggestionColorSchema),
  })
  .strict()

export const applicationMetadataSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.literal('colorcraft'),
    name: z.literal('ColorCraft'),
    descriptor: z.literal('Local color utility'),
    version: z.string(),
    icon: z.string(),
    webUrl: z.string(),
    apiUrl: z.string(),
    healthUrl: z.string(),
    readinessUrl: z.string(),
    networkMode: z.enum(['loopback', 'lan']),
    capabilities: z.array(z.string()),
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
export type ExtractedColor = z.infer<typeof extractedColorSchema>
export type HarmonyRelationship = z.infer<typeof harmonyRelationshipSchema>
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
export type ApplicationMetadata = z.infer<typeof applicationMetadataSchema>
export type ValidationIssue = z.infer<typeof validationIssueSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
