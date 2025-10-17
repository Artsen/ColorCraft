import { Color, Analysis } from '../App'

interface AnalysisResultsProps {
  analysis: Analysis
  colors: Color[]
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const { color_theory, accessibility } = analysis

  return (
    <div className="space-y-8">
      {/* Harmony Tags */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Harmony Analysis</h2>

        <div className="flex flex-wrap gap-2 mb-6">
          {color_theory.tags.map((tag, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full font-medium text-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Harmony Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Temperature Balance */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-700 mb-2">Temperature Balance</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold">Balance:</span>{' '}
                <span className="capitalize">{color_theory.temperature_balance.balance}</span>
              </p>
              <p>
                <span className="font-semibold">Warm Colors:</span>{' '}
                {color_theory.temperature_balance.warm_count} (
                {(color_theory.temperature_balance.warm_ratio * 100).toFixed(0)}%)
              </p>
              <p>
                <span className="font-semibold">Cool Colors:</span>{' '}
                {color_theory.temperature_balance.cool_count} (
                {(color_theory.temperature_balance.cool_ratio * 100).toFixed(0)}%)
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-700 mb-2">Color Metrics</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold">Hue Diversity:</span>{' '}
                {color_theory.metrics.hue_diversity}°
              </p>
              <p>
                <span className="font-semibold">Avg Saturation:</span>{' '}
                {color_theory.metrics.saturation_avg}%
              </p>
              <p>
                <span className="font-semibold">Lightness Range:</span>{' '}
                {color_theory.metrics.lightness_range}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Analysis */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Accessibility Analysis (WCAG)
        </h2>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {accessibility.summary.total_pairs}
            </div>
            <div className="text-sm text-gray-600">Total Pairs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {accessibility.summary.aa_compliant}
            </div>
            <div className="text-sm text-gray-600">AA Compliant</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {accessibility.summary.aaa_compliant}
            </div>
            <div className="text-sm text-gray-600">AAA Compliant</div>
          </div>
        </div>

        {/* Issues */}
        {accessibility.issues.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3">Accessibility Issues</h3>
            <div className="space-y-2">
              {accessibility.issues.map((issue, index) => (
                <div
                  key={index}
                  className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded"
                >
                  <p className="text-sm text-yellow-800">{issue.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contrast Pairs Table */}
        <div className="overflow-x-auto">
          <h3 className="font-bold text-gray-700 mb-3">Contrast Ratios</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Color 1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Color 2
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ratio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  AA Normal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  AA Large
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  AAA Normal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accessibility.pairs.map((pair, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: pair.color1 }}
                      />
                      <span className="text-xs font-mono">{pair.color1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: pair.color2 }}
                      />
                      <span className="text-xs font-mono">{pair.color2}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                    {pair.ratio}:1
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {pair.aa_normal ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-red-600 font-bold">✗</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {pair.aa_large ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-red-600 font-bold">✗</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {pair.aaa_normal ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-red-600 font-bold">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

