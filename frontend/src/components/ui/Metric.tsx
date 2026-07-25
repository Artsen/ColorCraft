import type { ReactNode } from 'react'

export default function Metric({
  label,
  value,
  className = '',
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={`metric ${className}`.trim()}>
      <strong className="metric-value">{value}</strong>
      <span className="metric-label">{label}</span>
    </div>
  )
}
