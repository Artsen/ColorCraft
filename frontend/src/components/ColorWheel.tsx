import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Color, Analysis } from '../App'

interface ColorWheelProps {
  colors: Color[]
  analysis: Analysis
}

export default function ColorWheel({ colors, analysis }: ColorWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || colors.length === 0) return

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()

    const width = 500
    const height = 500
    const centerX = width / 2
    const centerY = height / 2
    const radius = 180

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create color wheel background
    const wheelGroup = svg.append('g').attr('transform', `translate(${centerX},${centerY})`)

    // Draw color wheel segments
    const segments = 360
    for (let i = 0; i < segments; i++) {
      const angle1 = (i * Math.PI * 2) / segments
      const angle2 = ((i + 1) * Math.PI * 2) / segments

      const hue = i
      const color = `hsl(${hue}, 100%, 50%)`

      wheelGroup
        .append('path')
        .attr('d', () => {
          const x1 = Math.cos(angle1) * (radius - 30)
          const y1 = Math.sin(angle1) * (radius - 30)
          const x2 = Math.cos(angle2) * (radius - 30)
          const y2 = Math.sin(angle2) * (radius - 30)
          const x3 = Math.cos(angle2) * radius
          const y3 = Math.sin(angle2) * radius
          const x4 = Math.cos(angle1) * radius
          const y4 = Math.sin(angle1) * radius

          return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`
        })
        .attr('fill', color)
        .attr('stroke', 'none')
    }

    // Draw harmony connections
    const harmonies = analysis.color_theory.harmonies

    // Draw complementary connections
    if (harmonies.complementary && harmonies.complementary.length > 0) {
      harmonies.complementary.forEach((pair: number[]) => {
        const [i, j] = pair
        const color1 = colors[i]
        const color2 = colors[j]

        const angle1 = (color1.hsl.h * Math.PI) / 180
        const angle2 = (color2.hsl.h * Math.PI) / 180

        const x1 = Math.cos(angle1) * (radius - 50)
        const y1 = Math.sin(angle1) * (radius - 50)
        const x2 = Math.cos(angle2) * (radius - 50)
        const y2 = Math.sin(angle2) * (radius - 50)

        wheelGroup
          .append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.6)
      })
    }

    // Draw triadic connections
    if (harmonies.triadic && harmonies.triadic.length > 0) {
      harmonies.triadic.forEach((triad: number[]) => {
        const points = triad.map((idx) => {
          const color = colors[idx]
          const angle = (color.hsl.h * Math.PI) / 180
          return {
            x: Math.cos(angle) * (radius - 50),
            y: Math.sin(angle) * (radius - 50),
          }
        })

        // Draw triangle
        const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} Z`

        wheelGroup
          .append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.6)
      })
    }

    // Plot color points
    colors.forEach((color, index) => {
      const angle = (color.hsl.h * Math.PI) / 180
      const x = Math.cos(angle) * (radius - 50)
      const y = Math.sin(angle) * (radius - 50)

      // Draw color circle
      wheelGroup
        .append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 20)
        .attr('fill', color.hex)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('cursor', 'pointer')
        .on('mouseover', function () {
          d3.select(this).attr('r', 25).attr('stroke-width', 4)
        })
        .on('mouseout', function () {
          d3.select(this).attr('r', 20).attr('stroke-width', 3)
        })

      // Add label
      wheelGroup
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', color.hsl.l > 50 ? '#000' : '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .text(index + 1)
    })

    // Add center circle
    wheelGroup
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', radius - 30)
      .attr('fill', '#1a1a1a')
      .attr('opacity', 0.95)

    // Add harmony score in center
    wheelGroup
      .append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '48px')
      .attr('font-weight', 'bold')
      .attr('fill', '#8b5cf6')
      .text(analysis.color_theory.score)

    wheelGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', '#a0a0a0')
      .text('Harmony Score')
  }, [colors, analysis])

  return (
    <div className="flex justify-center">
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  )
}

