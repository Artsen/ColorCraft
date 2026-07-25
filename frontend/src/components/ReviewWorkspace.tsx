import {
  CheckCircle2,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import type { Analysis, Color, HarmonyRelationship } from '../api/contracts'
import {
  contrastRatio,
  formatContrastRatio,
  paletteRoles,
  resultsForContrastCheck,
  roleChecks,
  roleLabels,
  type PaletteRole,
  type RoleAssignments,
} from '../contrast'
import {
  paletteColorLabel,
  type PaletteColor,
  type ReviewView,
} from '../workspace'
import ColorSuggestions from './ColorSuggestions'
import ColorWheel from './ColorWheel'
import Button from './ui/Button'
import Notice from './ui/Notice'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import StatusBadge from './ui/StatusBadge'
import Tabs from './ui/Tabs'

interface ReviewWorkspaceProps {
  colors: PaletteColor[]
  analysis: Analysis | null
  analysisStale: boolean
  analyzing: boolean
  selectedTab: ReviewView
  roles: RoleAssignments
  onSelectTab: (tab: ReviewView) => void
  onAnalyze: () => void
  onAssignRole: (role: PaletteRole, hex: string | undefined) => void
  onAddColor: (color?: Color) => void
}

const tabOptions = [
  { id: 'overview', label: 'Overview' },
  { id: 'harmony', label: 'Harmony' },
  { id: 'contrast', label: 'Contrast' },
  { id: 'suggestions', label: 'Suggestions' },
]

export function orderedRelationships(
  analysis: Analysis,
): HarmonyRelationship[] {
  return Object.values(analysis.colorTheory.harmonies)
    .flat()
    .sort(
      (left, right) =>
        right.confidence - left.confidence || left.deviation - right.deviation,
    )
}

function relationshipName(type: HarmonyRelationship['type']): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function relationshipExplanation(relationship: HarmonyRelationship): string {
  const name = relationship.type.replace(/_/g, ' ')
  if (relationship.confidence >= 0.8) {
    return `Strong ${name} relationship. The measured geometry closely matches the expected separation.`
  }
  if (relationship.confidence >= 0.55) {
    return `Moderate ${name} relationship. The colors form a useful approximation with visible deviation.`
  }
  if (relationship.type === 'analogous') {
    return 'Weak analogous relationship. Two colors are near the edge of the configured analogous range.'
  }
  return `Weak ${name} relationship. Treat this as a possible direction rather than a confirmed match.`
}

function EmptyAnalysis({
  stale,
  analyzing,
  onAnalyze,
}: {
  stale: boolean
  analyzing: boolean
  onAnalyze: () => void
}) {
  return (
    <Panel>
      <SectionHeader
        title={stale ? 'Refresh the analysis' : 'Analyze this palette'}
        description={
          stale
            ? 'The palette changed, so previous measurements are no longer shown.'
            : 'Measure hue geometry and color-pair contrast for the current palette.'
        }
      />
      <Notice
        variant={stale ? 'warning' : 'information'}
        actions={
          <Button
            variant="primary"
            icon={<RefreshCw size={16} aria-hidden="true" />}
            onClick={onAnalyze}
            disabled={analyzing}
          >
            {analyzing
              ? 'Analyzing…'
              : stale
                ? 'Refresh analysis'
                : 'Analyze palette'}
          </Button>
        }
      >
        {stale
          ? 'Analysis is stale because the palette changed.'
          : 'Analysis is required for this review tab.'}
      </Notice>
    </Panel>
  )
}

function Overview({
  colors,
  analysis,
}: {
  colors: PaletteColor[]
  analysis: Analysis
}) {
  const relationships = orderedRelationships(analysis)
  const dominant =
    [...colors].sort(
      (left, right) => (right.population ?? 0) - (left.population ?? 0),
    )[0] ?? colors[0]
  const temperature = analysis.colorTheory.temperatureBalance
  const temperatureCopy =
    temperature.balance === 'neutral'
      ? 'No meaningful chromatic temperature evidence'
      : temperature.balance === 'mixed'
        ? 'Mixed temperature'
        : `${temperature.balance[0].toUpperCase()}${temperature.balance.slice(1)} dominant`
  const lightness = analysis.colorTheory.metrics.lightnessRange
  const nextAction = analysis.accessibility.issues.length
    ? `${analysis.accessibility.issues.length} color ${analysis.accessibility.issues.length === 1 ? 'pair needs' : 'pairs need'} a contrast-role review`
    : 'Assign semantic roles to review relevant interface combinations'

  return (
    <div className="review-overview">
      <Panel>
        <SectionHeader
          title="Palette relationships"
          description="Hue positions and detected geometric connections."
        />
        <ColorWheel colors={colors} analysis={analysis} />
      </Panel>
      <Panel>
        <SectionHeader
          title="Palette summary"
          description="A measured overview of the current palette."
        />
        <dl className="summary-list">
          <div>
            <dt>Dominant color</dt>
            <dd>
              <span
                className="summary-swatch"
                role="img"
                style={{ backgroundColor: dominant.hex }}
                aria-label={`Dominant color ${dominant.hex}`}
              />
              <code>{dominant.hex}</code>
            </dd>
          </div>
          <div>
            <dt>Temperature</dt>
            <dd>
              {temperatureCopy} · {Math.round(temperature.warmRatio * 100)}%
              warm · {Math.round(temperature.transitionalRatio * 100)}%
              transitional · {Math.round(temperature.coolRatio * 100)}% cool
            </dd>
          </div>
          <div>
            <dt>Saturation</dt>
            <dd>
              {analysis.colorTheory.metrics.saturationAvg}% average saturation
            </dd>
          </div>
          <div>
            <dt>Lightness</dt>
            <dd>
              {lightness >= 45
                ? 'Wide'
                : lightness >= 20
                  ? 'Moderate'
                  : 'Narrow'}{' '}
              lightness range · {lightness}%
            </dd>
          </div>
          <div>
            <dt>Strongest relationships</dt>
            <dd>
              {relationships.length
                ? relationships
                    .slice(0, 3)
                    .map(
                      (item) =>
                        `${relationshipName(item.type)} (${Math.round(item.confidence * 100)}%)`,
                    )
                    .join(', ')
                : 'No relationship met the configured tolerances'}
            </dd>
          </div>
          <div>
            <dt>Useful next action</dt>
            <dd>{nextAction}</dd>
          </div>
        </dl>
        <div className="relationship-fit compact-fit">
          <div className="fit-header">
            <div>
              <span className="field-label">Relationship fit</span>
              <p>{analysis.colorTheory.relationshipSummary}</p>
            </div>
            <strong>{analysis.colorTheory.relationshipFit}/100</strong>
          </div>
          <p className="field-help">
            This measures geometric color relationships, not subjective design
            quality.
          </p>
        </div>
      </Panel>
    </div>
  )
}

function Harmony({
  colors,
  analysis,
}: {
  colors: PaletteColor[]
  analysis: Analysis
}) {
  const relationships = orderedRelationships(analysis)
  return (
    <Panel>
      <SectionHeader
        title="Measured harmony"
        description="Detected relationships ordered by confidence, without judging aesthetic quality."
        icon={<ScanLine size={18} aria-hidden="true" />}
      />
      {relationships.length === 0 ? (
        <Notice>
          No relationship met the configured detection tolerances.
        </Notice>
      ) : (
        <div className="relationship-card-list">
          {relationships.map((relationship, index) => (
            <article
              className="relationship-card"
              key={`${relationship.type}-${relationship.colorIndexes.join('-')}-${index}`}
            >
              <div className="relationship-card-heading">
                <div>
                  <h3>{relationshipExplanation(relationship).split('.')[0]}</h3>
                  <p>
                    {relationshipExplanation(relationship)
                      .split('.')
                      .slice(1)
                      .join('.')
                      .trim()}
                  </p>
                </div>
                <StatusBadge
                  variant={
                    relationship.confidence >= 0.8
                      ? 'success'
                      : relationship.confidence >= 0.55
                        ? 'information'
                        : 'warning'
                  }
                >
                  {Math.round(relationship.confidence * 100)}% confidence
                </StatusBadge>
              </div>
              <div
                className="relationship-swatches"
                aria-label={`${relationshipName(relationship.type)} colors`}
              >
                {relationship.colorIndexes.map(
                  (colorIndex) =>
                    colors[colorIndex] && (
                      <span key={colorIndex}>
                        <i
                          style={{ backgroundColor: colors[colorIndex].hex }}
                          aria-hidden="true"
                        />
                        <code>{colors[colorIndex].hex}</code>
                      </span>
                    ),
                )}
              </div>
              <dl className="relationship-measurements">
                <div>
                  <dt>Expected angle</dt>
                  <dd>
                    {relationship.expectedAngles
                      .map((angle) => `${angle.toFixed(0)}°`)
                      .join(', ')}
                  </dd>
                </div>
                <div>
                  <dt>Measured angle</dt>
                  <dd>
                    {relationship.measuredAngles
                      .map((angle) => `${angle.toFixed(0)}°`)
                      .join(', ')}
                  </dd>
                </div>
                <div>
                  <dt>Deviation</dt>
                  <dd>{relationship.deviation.toFixed(1)}°</dd>
                </div>
              </dl>
              <details className="advanced-disclosure">
                <summary>Advanced technical details</summary>
                <p>
                  Type: <code>{relationship.type}</code>. Palette indexes:{' '}
                  {relationship.colorIndexes.map((item) => item + 1).join(', ')}
                  . Raw confidence: {relationship.confidence.toFixed(3)}.
                </p>
              </details>
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}

function ResultBadge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <StatusBadge variant={pass ? 'success' : 'error'}>
      {pass ? (
        <CheckCircle2 size={14} aria-hidden="true" />
      ) : (
        <XCircle size={14} aria-hidden="true" />
      )}
      {label}: {pass ? 'Pass' : 'Fail'}
    </StatusBadge>
  )
}

function ContrastPreview({
  kind,
  foreground,
  background,
}: {
  kind: (typeof roleChecks)[number]['preview']
  foreground: string
  background: string
}) {
  if (kind === 'action') {
    return (
      <div className="contrast-preview">
        <button
          type="button"
          style={{ color: foreground, backgroundColor: background }}
        >
          Continue
        </button>
      </div>
    )
  }
  if (kind === 'border') {
    return (
      <div className="contrast-preview" style={{ backgroundColor: background }}>
        <div className="preview-border" style={{ borderColor: foreground }}>
          Surface boundary
        </div>
      </div>
    )
  }
  if (kind === 'focus') {
    return (
      <div className="contrast-preview" style={{ backgroundColor: background }}>
        <button type="button" style={{ outlineColor: foreground }}>
          Focused control
        </button>
      </div>
    )
  }
  return (
    <div
      className="contrast-preview preview-copy"
      style={{ color: foreground, backgroundColor: background }}
    >
      <strong>{kind === 'page' ? 'Page heading' : 'Surface detail'}</strong>
      <span>Readable interface copy in context.</span>
    </div>
  )
}

function Contrast({
  colors,
  analysis,
  roles,
  onAssignRole,
}: {
  colors: PaletteColor[]
  analysis: Analysis
  roles: RoleAssignments
  onAssignRole: (role: PaletteRole, hex: string | undefined) => void
}) {
  const colorByHex = (hex?: string) =>
    colors.find((color) => color.hex.toLowerCase() === hex?.toLowerCase())
  return (
    <div className="content-stack">
      <Panel>
        <SectionHeader
          title="Assign interface roles"
          description="Map palette colors to real UI jobs, then test the combinations that matter."
          icon={<ShieldCheck size={18} aria-hidden="true" />}
        />
        <div className="role-grid">
          {paletteRoles.map((role) => (
            <label key={role} className="role-field">
              <span>{roleLabels[role]}</span>
              <select
                aria-label={roleLabels[role]}
                value={roles[role] ?? ''}
                onChange={(event) =>
                  onAssignRole(role, event.target.value || undefined)
                }
              >
                <option value="">Unassigned</option>
                {colors.map((color, index) => (
                  <option value={color.hex} key={color.id}>
                    {paletteColorLabel(color, index)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Panel>
      <Panel>
        <SectionHeader
          title="Role contrast"
          description="Measured ratios and applicable thresholds for assigned interface roles."
        />
        <div className="role-result-list">
          {roleChecks.map((check) => {
            const foreground = colorByHex(roles[check.foreground])
            const background = colorByHex(roles[check.background])
            if (!foreground || !background) {
              return (
                <article className="role-result incomplete" key={check.id}>
                  <h3>{check.label}</h3>
                  <p>
                    Assign {roleLabels[check.foreground].toLowerCase()} and{' '}
                    {roleLabels[check.background].toLowerCase()} to test this
                    combination.
                  </p>
                </article>
              )
            }
            const ratio = contrastRatio(foreground, background)
            const results = resultsForContrastCheck(check.kind, ratio)
            return (
              <article className="role-result" key={check.id}>
                <div className="role-result-heading">
                  <div>
                    <h3>{check.label}</h3>
                    <p>
                      <code>
                        {foreground.name
                          ? `${foreground.name} · ${foreground.hex}`
                          : foreground.hex}
                      </code>{' '}
                      on{' '}
                      <code>
                        {background.name
                          ? `${background.name} · ${background.hex}`
                          : background.hex}
                      </code>{' '}
                      ·{' '}
                      <strong>
                        {formatContrastRatio(
                          ratio,
                          results.map((result) => result.threshold),
                        )}{' '}
                        to 1
                      </strong>
                    </p>
                  </div>
                </div>
                <ContrastPreview
                  kind={check.preview}
                  foreground={foreground.hex}
                  background={background.hex}
                />
                <div className="badge-row">
                  {results.map((result) => (
                    <ResultBadge
                      key={result.label}
                      label={`${result.label} (${result.threshold}:1)`}
                      pass={result.pass}
                    />
                  ))}
                </div>
                <p className="field-help">
                  {check.kind === 'text'
                    ? 'Text thresholds apply only to this assigned foreground and background pair.'
                    : check.kind === 'nonText'
                      ? 'This checks non-text color contrast only. Component size, shape, state, and other accessibility requirements are not evaluated.'
                      : 'This checks one adjacent-color pair. Size, area, thickness, visibility, and focused-versus-unfocused appearance are not evaluated.'}
                </p>
              </article>
            )
          })}
        </div>
        <details className="advanced-disclosure all-pairs">
          <summary>Advanced: all-pairs text contrast matrix</summary>
          <p className="field-help">
            AA and AAA badges below apply text-contrast thresholds to every
            palette color pair for exploration. They do not classify non-text
            components or focus indicators.
          </p>
          <div className="contrast-list">
            {analysis.accessibility.pairs.map((pair) => (
              <div
                className="contrast-row"
                key={`${pair.color1}-${pair.color2}`}
              >
                <div className="contrast-row-header">
                  <span>
                    <code>{pair.color1}</code> + <code>{pair.color2}</code>
                  </span>
                  <strong>{formatContrastRatio(pair.ratio)}:1</strong>
                </div>
                <div className="badge-row">
                  <ResultBadge label="AA normal text" pass={pair.aaNormal} />
                  <ResultBadge label="AA large text" pass={pair.aaLarge} />
                  <ResultBadge label="AAA normal text" pass={pair.aaaNormal} />
                  <ResultBadge label="AAA large text" pass={pair.aaaLarge} />
                </div>
              </div>
            ))}
          </div>
        </details>
      </Panel>
    </div>
  )
}

export default function ReviewWorkspace({
  colors,
  analysis,
  analysisStale,
  analyzing,
  selectedTab,
  roles,
  onSelectTab,
  onAnalyze,
  onAssignRole,
  onAddColor,
}: ReviewWorkspaceProps) {
  const panelId = `review-panel-${selectedTab}`
  return (
    <div className="content-stack review-workspace">
      <Tabs
        label="Review sections"
        options={tabOptions}
        selected={selectedTab}
        onSelect={(id) => onSelectTab(id as ReviewView)}
        panelId="review-panel"
      />
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${selectedTab}-tab`}
        tabIndex={0}
      >
        {selectedTab === 'suggestions' ? (
          <ColorSuggestions colors={colors} onAddColor={onAddColor} />
        ) : !analysis ? (
          <EmptyAnalysis
            stale={analysisStale}
            analyzing={analyzing}
            onAnalyze={onAnalyze}
          />
        ) : selectedTab === 'overview' ? (
          <Overview colors={colors} analysis={analysis} />
        ) : selectedTab === 'harmony' ? (
          <Harmony colors={colors} analysis={analysis} />
        ) : (
          <Contrast
            colors={colors}
            analysis={analysis}
            roles={roles}
            onAssignRole={onAssignRole}
          />
        )}
      </div>
    </div>
  )
}
