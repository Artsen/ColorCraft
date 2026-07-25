import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import type { ReactNode } from 'react'

export type NoticeVariant = 'information' | 'success' | 'warning' | 'error'

const icons = {
  information: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
}

interface NoticeProps {
  variant?: NoticeVariant
  children: ReactNode
  actions?: ReactNode
}

export default function Notice({
  variant = 'information',
  children,
  actions,
}: NoticeProps) {
  const Icon = icons[variant]
  const urgent = variant === 'error' || variant === 'warning'
  return (
    <div
      className={`notice notice-${variant}`}
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
    >
      <Icon size={18} aria-hidden="true" />
      <div>
        <div>{children}</div>
        {actions && <div className="notice-actions">{actions}</div>}
      </div>
    </div>
  )
}
