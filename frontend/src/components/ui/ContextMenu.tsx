import { MoreHorizontal } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'
import IconButton from './IconButton'

export interface ContextMenuItem {
  label: string
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
  onSelect: () => void
}

export default function ContextMenu({
  label,
  items,
}: {
  label: string
  items: ContextMenuItem[]
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }
  return (
    <div
      className="context-menu"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          close()
        }
      }}
    >
      <IconButton
        ref={triggerRef}
        label={label}
        icon={<MoreHorizontal size={17} />}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((current) => !current)}
      />
      {open && (
        <div className="menu-surface" role="menu" id={id}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`menu-item ${item.destructive ? 'destructive' : ''}`}
              onClick={() => {
                setOpen(false)
                item.onSelect()
                triggerRef.current?.focus()
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
