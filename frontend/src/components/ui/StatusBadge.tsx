import type { ReactNode } from 'react'

export type StatusVariant =
  'neutral' | 'information' | 'success' | 'warning' | 'error'

export default function StatusBadge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode
  variant?: StatusVariant
}) {
  return <span className={`status-badge status-${variant}`}>{children}</span>
}
