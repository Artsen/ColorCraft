import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface MiniColorWheelProps {
  baseHue: number
  angles: number[]
  colors: string[]
  size?: number
}

export default function MiniColorWheel({ baseHue, angles, colors, size = 120 }: MiniColorWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = size
    const height = size
    const radius = size / 2 - 10
    const centerX = width / 2
    const centerY = height / 2

    const g = svg
      .append('g')
      .attr('transform', `translate(${centerX},${centerY})`)

    // Draw color wheel segments
    const segmentCount = 12
    const segmentAngle = 360 / segmentCount
    
    for (let i = 0; i < segmentCount; i++) {
      const startAngle = (i * segmentAngle - 90) * (Math.PI / 180)
      const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180)
      const hue = i * segmentAngle
      
      const arc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius)
        .startAngle(startAngle)
        .endAngle(endAngle)

      g.append('path')
        .attr('d', arc as any)
        .attr('fill', `hsl(${hue}, 70%, 60%)`)
        .attr('opacity', 0.3)
    }

    // Draw connecting lines between related colors
    if (angles.length > 1) {
      for (let i = 0; i < angles.length; i++) {
        for (let j = i + 1; j < angles.length; j++) {
          const angle1 = (angles[i] - 90) * (Math.PI / 180)
          const angle2 = (angles[j] - 90) * (Math.PI / 180)
          
          const x1 = Math.cos(angle1) * radius * 0.75
          const y1 = Math.sin(angle1) * radius * 0.75
          const x2 = Math.cos(angle2) * radius * 0.75
          const y2 = Math.sin(angle2) * radius * 0.75

          g.append('line')
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2)
            .attr('stroke', '#6b7280')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.5)
        }
      }
    }

    // Draw dots for each color
    angles.forEach((angle, index) => {
      const radian = (angle - 90) * (Math.PI / 180)
      const x = Math.cos(radian) * radius * 0.75
      const y = Math.sin(radian) * radius * 0.75

      // Outer circle (white border)
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 8)
        .attr('fill', 'white')

      // Inner circle (color)
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 6)
        .attr('fill', colors[index] || `hsl(${angle}, 70%, 60%)`)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
    })

  }, [baseHue, angles, colors, size])

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="mx-auto"
    />
  )
}

