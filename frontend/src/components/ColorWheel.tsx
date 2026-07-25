import { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'
import type {
  Analysis,
  Color,
  HarmonyRelationship,
} from '../api/contracts'

interface ColorWheelProps {
  colors: Color[]
  analysis: Analysis
}

const relationshipStyles: Record<
  HarmonyRelationship['type'],
  { stroke: string; dash: string; label: string }
> = {
  complementary: {
    stroke: '#f59e0b',
    dash: '8,4',
    label: 'complementary',
  },
  analogous: { stroke: '#38bdf8', dash: '2,4', label: 'analogous' },
  triadic: { stroke: '#10b981', dash: '10,4,2,4', label: 'triadic' },
  tetradic: { stroke: '#a78bfa', dash: '12,3', label: 'tetradic' },
  split_complementary: {
    stroke: '#f472b6',
    dash: '7,3,2,3',
    label: 'split-complementary',
  },
  monochromatic: {
    stroke: '#94a3b8',
    dash: '1,3',
    label: 'monochromatic',
  },
}

export default function ColorWheel({ colors, analysis }: ColorWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const relationships = useMemo(
    () => Object.values(analysis.colorTheory.harmonies).flat(),
    [analysis],
  )

  useEffect(() => {
    if (!svgRef.current || colors.length === 0) return

    const width = 500
    const center = width / 2
    const radius = 180
    const markerRadius = radius - 50
    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${width}`)
    svg.selectAll('*').remove()

    const stage = svg
      .append('g')
      .attr('transform', `translate(${center},${center})`)

    // 1. Neutral stage.
    stage
      .append('g')
      .attr('data-layer', 'background')
      .append('circle')
      .attr('r', radius)
      .attr('fill', 'var(--color-dark-tertiary, #242424)')
      .attr('stroke', 'var(--color-border-default, #525252)')

    // 2. Hue sectors.
    const sectors = stage.append('g').attr('data-layer', 'sectors')
    for (let hue = 0; hue < 360; hue += 1) {
      const start = (hue * Math.PI * 2) / 360
      const end = ((hue + 1) * Math.PI * 2) / 360
      sectors
        .append('path')
        .attr(
          'd',
          `M ${Math.cos(start) * (radius - 30)} ${
            Math.sin(start) * (radius - 30)
          } L ${Math.cos(end) * (radius - 30)} ${
            Math.sin(end) * (radius - 30)
          } L ${Math.cos(end) * radius} ${Math.sin(end) * radius} L ${
            Math.cos(start) * radius
          } ${Math.sin(start) * radius} Z`,
        )
        .attr('fill', `hsl(${hue}, 100%, 50%)`)
    }

    // 3. Structural guides.
    const guides = stage
      .append('g')
      .attr('data-layer', 'structural-guides')
      .attr('stroke', 'currentColor')
      .attr('opacity', 0.18)
    for (const hue of [0, 90, 180, 270]) {
      const radians = (hue * Math.PI) / 180
      guides
        .append('line')
        .attr('x2', Math.cos(radians) * markerRadius)
        .attr('y2', Math.sin(radians) * markerRadius)
        .attr('stroke-dasharray', '2,6')
    }

    // 4. Explainable relationship geometry.
    const relationshipLayer = stage
      .append('g')
      .attr('data-layer', 'relationships')
    relationships.forEach((relationship) => {
      const points = relationship.colorIndexes
        .map((index) => colors[index])
        .filter((color): color is Color => Boolean(color))
        .map((color) => {
          const radians = (color.hsl.h * Math.PI) / 180
          return [
            Math.cos(radians) * markerRadius,
            Math.sin(radians) * markerRadius,
          ] as [number, number]
        })
      if (points.length < 2) return

      const style = relationshipStyles[relationship.type]
      const closePath = points.length > 2 && relationship.type !== 'monochromatic'
      const path = d3.line()(points)
      if (!path) return
      relationshipLayer
        .append('path')
        .attr('data-relationship-type', relationship.type)
        .attr('d', closePath ? `${path}Z` : path)
        .attr('fill', 'none')
        .attr('stroke', style.stroke)
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', style.dash)
        .attr('opacity', 0.8)
    })

    // 5. Markers.
    const markerLayer = stage.append('g').attr('data-layer', 'markers')
    const positions = colors.map((color) => {
      const radians = (color.hsl.h * Math.PI) / 180
      return {
        x: Math.cos(radians) * markerRadius,
        y: Math.sin(radians) * markerRadius,
      }
    })
    colors.forEach((color, index) => {
      const position = positions[index]
      markerLayer
        .append('circle')
        .attr('data-color-index', index)
        .attr('cx', position.x)
        .attr('cy', position.y)
        .attr('r', 20)
        .attr('fill', color.hex)
        .attr('stroke', 'var(--color-text-primary, #fff)')
        .attr('stroke-width', 3)
    })

    // 6. Marker labels.
    const labelLayer = stage.append('g').attr('data-layer', 'marker-labels')
    colors.forEach((color, index) => {
      const position = positions[index]
      labelLayer
        .append('text')
        .attr('x', position.x)
        .attr('y', position.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', color.hsl.l > 55 ? '#000' : '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(index + 1)
    })

    // 7. Compact, non-opaque center annotation.
    const annotation = stage
      .append('g')
      .attr('data-layer', 'center-annotation')
      .attr('pointer-events', 'none')
    annotation
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -4)
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', 'var(--color-accent, #8b5cf6)')
      .text(analysis.colorTheory.relationshipFit)
    annotation
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 18)
      .attr('font-size', '11px')
      .attr('fill', 'currentColor')
      .text('relationship fit')
  }, [colors, analysis, relationships])

  const relationshipSummary =
    relationships.length === 0
      ? 'No hue relationship met the detection tolerances.'
      : relationships
          .map((relationship) => {
            const style = relationshipStyles[relationship.type]
            const colorsLabel = relationship.colorIndexes
              .map((index) => `color ${index + 1}`)
              .join(', ')
            return `${style.label}: ${colorsLabel}; deviation ${relationship.deviation.toFixed(
              1,
            )} degrees; confidence ${Math.round(relationship.confidence * 100)} percent`
          })
          .join('. ')

  return (
    <div>
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          role="img"
          aria-label="Color wheel showing palette markers and detected geometric relationships"
          className="max-w-full h-auto text-text-secondary"
        />
      </div>
      <p className="sr-only" data-testid="wheel-summary">
        {relationshipSummary}
      </p>
      <p className="mt-3 text-xs text-text-tertiary text-center">
        Lines use different dash patterns as well as colors. {relationships.length}{' '}
        detected relationship{relationships.length === 1 ? '' : 's'} shown.
      </p>
    </div>
  )
}
