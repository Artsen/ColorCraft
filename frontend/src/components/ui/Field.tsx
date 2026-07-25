import { useId, type ReactNode } from 'react'

export default function Field({
  label,
  help,
  children,
}: {
  label: string
  help?: string
  children: (ids: { inputId: string; helpId?: string }) => ReactNode
}) {
  const inputId = useId()
  const helpId = help ? `${inputId}-help` : undefined
  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      {children({ inputId, helpId })}
      {help && (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      )}
    </div>
  )
}
