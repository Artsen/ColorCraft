import type { HTMLAttributes, ReactNode } from 'react'

export default function Panel({
  children,
  tone = 'default',
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  tone?: 'default' | 'recessed' | 'elevated'
}) {
  return (
    <div className={`panel ${tone === 'default' ? '' : tone} ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}
