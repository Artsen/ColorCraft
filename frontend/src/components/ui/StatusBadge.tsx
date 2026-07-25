import type { ReactNode } from 'react'

export type StatusVariant =
  'neutral' | 'information' | 'success' | 'warning' | 'error'

export default function StatusBadge({
  children,
  variant = 'neutral',
  title,
  describedBy,
}: {
  children: ReactNode
  variant?: StatusVariant
  title?: string
  describedBy?: string
}) {
  return (
    <span
      className={`status-badge status-${variant}`}
      title={title}
      aria-describedby={describedBy}
    >
      {children}
    </span>
  )
}
