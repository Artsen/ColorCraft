import type { ReactNode } from 'react'

export default function EmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="empty-state">
      {icon}
      <h2>{title}</h2>
      <p>{description}</p>
      {actions && <div className="section-actions">{actions}</div>}
    </div>
  )
}
