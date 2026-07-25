import type { ReactNode } from 'react'

export type StatusVariant =
  'neutral' | 'information' | 'success' | 'warning' | 'error'

export default function StatusBadge({
  children,
  variant = 'neutral',
  title,
}: {
  children: ReactNode
  variant?: StatusVariant
  title?: string
}) {
  return (
    <span className={`status-badge status-${variant}`} title={title}>
      {children}
    </span>
  )
}
