export interface TabOption {
  id: string
  label: string
}

export default function Tabs({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: TabOption[]
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={selected === option.id}
          className="tab"
          onClick={() => onSelect(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
