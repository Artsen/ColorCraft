import { useRef } from 'react'

export interface TabOption {
  id: string
  label: string
}

export default function Tabs({
  label,
  options,
  selected,
  onSelect,
  panelId,
}: {
  label: string
  options: TabOption[]
  selected: string
  onSelect: (id: string) => void
  panelId?: string
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const selectAt = (index: number) => {
    const normalized = (index + options.length) % options.length
    const option = options[normalized]
    if (!option) return
    onSelect(option.id)
    refs.current[normalized]?.focus()
  }

  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={(node) => { refs.current[index] = node }}
          id={`${option.id}-tab`}
          type="button"
          role="tab"
          aria-selected={selected === option.id}
          aria-controls={panelId ? `${panelId}-${option.id}` : undefined}
          tabIndex={selected === option.id ? 0 : -1}
          className="tab"
          onClick={() => onSelect(option.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') selectAt(index + 1)
            else if (event.key === 'ArrowLeft') selectAt(index - 1)
            else if (event.key === 'Home') selectAt(0)
            else if (event.key === 'End') selectAt(options.length - 1)
            else return
            event.preventDefault()
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
