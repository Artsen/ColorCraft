import type { ReactNode } from 'react'

export default function SectionHeader({
  title,
  description,
  icon,
  headingId,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  headingId?: string
  action?: ReactNode
}) {
  return (
    <div className="section-header">
      {icon}
      <div className="section-header-copy">
        <h2 id={headingId}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="section-header-action">{action}</div>}
    </div>
  )
}
