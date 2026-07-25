import { Accessibility, ScanLine } from 'lucide-react'
import type { Analysis, Color } from '../api/contracts'
import { formatContrastRatio } from '../contrast'
import Metric from './ui/Metric'
import Notice from './ui/Notice'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import StatusBadge from './ui/StatusBadge'

interface AnalysisResultsProps {
  analysis: Analysis
  colors: Color[]
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const { colorTheory, accessibility } = analysis

  return (
    <div className="content-stack">
      <Panel>
        <SectionHeader
          title="Harmony analysis"
          description="Geometric relationships and distribution across the current palette."
          icon={<ScanLine size={18} aria-hidden="true" />}
        />

        <div className="tag-list">
          {colorTheory.tags.map((tag) => (
            <span key={tag} className="analysis-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="relationship-fit">
          <div className="fit-header">
            <div>
              <span className="field-label">Relationship fit</span>
              <h3>{colorTheory.relationshipSummary}</h3>
            </div>
            <span className="fit-value">{colorTheory.relationshipFit}/100</span>
          </div>
          <div
            className="fit-track"
            role="progressbar"
            aria-label="Relationship fit"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={colorTheory.relationshipFit}
          >
            <div
              className="fit-bar"
              style={{ width: `${colorTheory.relationshipFit}%` }}
            />
          </div>
          <ul className="factor-list">
            {colorTheory.relationshipFactors.map((factor) => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
          <p className="field-help">
            This measures geometric color relationships, not subjective design
            quality.
          </p>
        </div>

        <div className="split-grid analysis-detail-grid">
          <section className="analysis-section">
            <h3>Temperature evidence</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span>Balance</span>
                <strong>{colorTheory.temperatureBalance.balance}</strong>
              </div>
              <div className="detail-row">
                <span>Transitional colors</span>
                <strong>
                  {colorTheory.temperatureBalance.transitionalCount} (
                  {(
                    colorTheory.temperatureBalance.transitionalRatio * 100
                  ).toFixed(0)}
                  %)
                </strong>
              </div>
              <div className="detail-row">
                <span>Warm colors</span>
                <strong>
                  {colorTheory.temperatureBalance.warmCount} (
                  {(colorTheory.temperatureBalance.warmRatio * 100).toFixed(0)}
                  %)
                </strong>
              </div>
              <div className="detail-row">
                <span>Cool colors</span>
                <strong>
                  {colorTheory.temperatureBalance.coolCount} (
                  {(colorTheory.temperatureBalance.coolRatio * 100).toFixed(0)}
                  %)
                </strong>
              </div>
            </div>
          </section>
          <section className="analysis-section">
            <h3>Color metrics</h3>
            <div className="detail-list">
              <div className="detail-row">
                <span>Hue diversity</span>
                <strong>{colorTheory.metrics.hueDiversity}°</strong>
              </div>
              <div className="detail-row">
                <span>Average saturation</span>
                <strong>{colorTheory.metrics.saturationAvg}%</strong>
              </div>
              <div className="detail-row">
                <span>Lightness range</span>
                <strong>{colorTheory.metrics.lightnessRange}%</strong>
              </div>
            </div>
          </section>
        </div>
      </Panel>

      <Panel>
        <SectionHeader
          title="Accessibility analysis"
          description="WCAG contrast results for every pair in the palette."
          icon={<Accessibility size={18} aria-hidden="true" />}
        />

        <div className="metric-grid">
          <Metric
            label="Total Pairs"
            value={accessibility.summary.totalPairs}
          />
          <Metric
            label="AA Normal"
            value={accessibility.summary.aaNormalPasses}
          />
          <Metric
            label="AA Large"
            value={accessibility.summary.aaLargePasses}
          />
          <Metric
            label="AAA Normal"
            value={accessibility.summary.aaaNormalPasses}
          />
          <Metric
            label="AAA Large"
            value={accessibility.summary.aaaLargePasses}
          />
        </div>

        {accessibility.issues.length > 0 && (
          <section className="analysis-section">
            <h3>Issues found</h3>
            <div className="issue-list">
              {accessibility.issues.map((issue) => (
                <Notice
                  key={`${issue.color1}-${issue.color2}`}
                  variant="warning"
                >
                  <p>{issue.message}</p>
                  <small>
                    {issue.color1} + {issue.color2} • Ratio:{' '}
                    {issue.ratio == null
                      ? 'N/A'
                      : formatContrastRatio(issue.ratio)}
                  </small>
                </Notice>
              ))}
            </div>
          </section>
        )}

        <section className="analysis-section">
          <h3>Color pair contrast</h3>
          <div className="contrast-list">
            {accessibility.pairs.map((pair) => (
              <div
                key={`${pair.color1}-${pair.color2}`}
                className="contrast-row"
              >
                <div className="contrast-row-header">
                  <div className="contrast-swatches">
                    <span
                      className="contrast-swatch"
                      style={{ backgroundColor: pair.color1 }}
                    />
                    <span aria-hidden="true">+</span>
                    <span
                      className="contrast-swatch"
                      style={{ backgroundColor: pair.color2 }}
                    />
                  </div>
                  <strong>
                    {pair.ratio == null
                      ? 'N/A'
                      : formatContrastRatio(pair.ratio)}
                    :1
                  </strong>
                </div>
                <div className="badge-row">
                  <StatusBadge variant={pair.aaNormal ? 'success' : 'error'}>
                    AA Normal
                  </StatusBadge>
                  <StatusBadge variant={pair.aaLarge ? 'success' : 'error'}>
                    AA Large
                  </StatusBadge>
                  <StatusBadge variant={pair.aaaNormal ? 'success' : 'error'}>
                    AAA Normal
                  </StatusBadge>
                  <StatusBadge variant={pair.aaaLarge ? 'success' : 'error'}>
                    AAA Large
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Panel>
    </div>
  )
}
