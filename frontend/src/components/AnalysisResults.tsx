import type { Analysis, Color } from '../api/contracts'

interface AnalysisResultsProps {
  analysis: Analysis
  colors: Color[]
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const { colorTheory, accessibility } = analysis

  return (
    <div className="space-y-6">
      {/* Harmony Analysis */}
      <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
        <h2 className="text-lg font-medium text-text-primary mb-4">Harmony Analysis</h2>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {colorTheory.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-md text-sm border border-purple-600/30"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Geometric relationship fit */}
        <div className="mb-6 p-4 bg-dark-tertiary rounded-lg border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm text-text-secondary">Relationship fit</span>
              <p className="text-base font-medium text-text-primary">
                {colorTheory.relationshipSummary}
              </p>
            </div>
            <span className="text-2xl font-semibold text-purple-400">
              {colorTheory.relationshipFit}/100
            </span>
          </div>
          <div className="w-full bg-dark-primary rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${colorTheory.relationshipFit}%` }}
            />
          </div>
          <ul className="mt-3 space-y-1 text-xs text-text-secondary">
            {colorTheory.relationshipFactors.map((factor) => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-tertiary">
            This measures geometric color relationships, not subjective design quality.
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Temperature Balance */}
          <div className="bg-dark-tertiary rounded-lg p-4 border border-border-subtle">
            <h3 className="text-sm font-medium text-text-primary mb-3">Temperature Balance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Balance:</span>
                <span className="text-text-primary capitalize">{colorTheory.temperatureBalance.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Warm Colors:</span>
                <span className="text-text-primary">
                  {colorTheory.temperatureBalance.warmCount} ({(colorTheory.temperatureBalance.warmRatio * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Cool Colors:</span>
                <span className="text-text-primary">
                  {colorTheory.temperatureBalance.coolCount} ({(colorTheory.temperatureBalance.coolRatio * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-dark-tertiary rounded-lg p-4 border border-border-subtle">
            <h3 className="text-sm font-medium text-text-primary mb-3">Color Metrics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Hue Diversity:</span>
                <span className="text-text-primary">{colorTheory.metrics.hueDiversity}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Avg Saturation:</span>
                <span className="text-text-primary">{colorTheory.metrics.saturationAvg}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Lightness Range:</span>
                <span className="text-text-primary">{colorTheory.metrics.lightnessRange}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Analysis */}
      <div className="bg-dark-secondary rounded-lg border border-border-subtle p-6">
        <h2 className="text-lg font-medium text-text-primary mb-4">
          Accessibility Analysis (WCAG)
        </h2>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-dark-tertiary rounded-lg p-4 border border-border-subtle text-center">
            <div className="text-2xl font-semibold text-text-primary mb-1">
              {accessibility.summary.totalPairs}
            </div>
            <div className="text-xs text-text-secondary">Total Pairs</div>
          </div>
          <div className="bg-dark-tertiary rounded-lg p-4 border border-green-600/30 text-center">
            <div className="text-2xl font-semibold text-green-400 mb-1">
              {accessibility.summary.aaNormalPasses}
            </div>
            <div className="text-xs text-text-secondary">AA Normal</div>
          </div>
          <div className="bg-dark-tertiary rounded-lg p-4 border border-green-600/30 text-center">
            <div className="text-2xl font-semibold text-green-400 mb-1">
              {accessibility.summary.aaLargePasses}
            </div>
            <div className="text-xs text-text-secondary">AA Large</div>
          </div>
          <div className="bg-dark-tertiary rounded-lg p-4 border border-green-600/30 text-center">
            <div className="text-2xl font-semibold text-green-400 mb-1">
              {accessibility.summary.aaaNormalPasses}
            </div>
            <div className="text-xs text-text-secondary">AAA Normal</div>
          </div>
          <div className="bg-dark-tertiary rounded-lg p-4 border border-green-600/30 text-center">
            <div className="text-2xl font-semibold text-green-400 mb-1">
              {accessibility.summary.aaaLargePasses}
            </div>
            <div className="text-xs text-text-secondary">AAA Large</div>
          </div>
        </div>

        {/* Issues */}
        {accessibility.issues.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-3">Issues Found</h3>
            <div className="space-y-2">
              {accessibility.issues.map((issue, index) => (
                <div
                  key={index}
                  className="bg-red-600/10 border border-red-600/30 rounded-lg p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 text-lg">⚠</span>
                    <div className="flex-1">
                      <p className="text-sm text-text-primary mb-1">{issue.message}</p>
                      <p className="text-xs text-text-secondary">
                        {issue.color1} + {issue.color2} • Ratio: {issue.ratio?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color Pairs */}
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Color Pair Contrast</h3>
          <div className="space-y-2">
            {accessibility.pairs.map((pair, index) => (
              <div
                key={index}
                className="bg-dark-tertiary rounded-lg p-3 border border-border-subtle"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: pair.color1 }}
                    />
                    <span className="text-text-tertiary text-xs">+</span>
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: pair.color2 }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {pair.ratio?.toFixed(2) ?? 'N/A'}:1
                  </span>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      pair.aaNormal
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-600/30'
                    }`}
                  >
                    AA Normal
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      pair.aaLarge
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-600/30'
                    }`}
                  >
                    AA Large
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      pair.aaaNormal
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-600/30'
                    }`}
                  >
                    AAA Normal
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      pair.aaaLarge
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-600/30'
                    }`}
                  >
                    AAA Large
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

