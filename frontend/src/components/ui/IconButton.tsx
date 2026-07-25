import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: ReactNode
  compact?: boolean
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { label, icon, compact = false, className = '', type = 'button', ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`icon-button ${compact ? 'compact' : ''} ${className}`.trim()}
      {...props}
    >
      {icon}
    </button>
  ),
)

IconButton.displayName = 'IconButton'

export default IconButton
