import { Copy, FolderOpen, Library, Pencil, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SavedPalette } from '../persistence'
import Button from './ui/Button'
import EmptyState from './ui/EmptyState'
import IconButton from './ui/IconButton'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'

interface PaletteLibraryProps {
  palettes: SavedPalette[]
  activePaletteId: string | null
  loading: boolean
  onCreate: () => void
  onOpen: (palette: SavedPalette) => void
  onRename: (palette: SavedPalette, name: string) => void
  onDuplicate: (palette: SavedPalette) => void
  onDelete: (palette: SavedPalette) => void
}

function formattedDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function PaletteLibrary({
  palettes,
  activePaletteId,
  loading,
  onCreate,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: PaletteLibraryProps) {
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return normalized
      ? palettes.filter((palette) =>
          palette.name.toLocaleLowerCase().includes(normalized),
        )
      : palettes
  }, [palettes, query])

  if (loading) {
    return (
      <Panel>
        <p role="status">Loading palettes…</p>
      </Panel>
    )
  }

  return (
    <Panel className="library-workspace">
      <SectionHeader
        title="Palette Library"
        description="Saved palettes stay in this browser’s local IndexedDB storage."
        icon={<Library size={18} aria-hidden="true" />}
        action={
          <Button variant="primary" onClick={onCreate}>
            New palette
          </Button>
        }
      />
      {palettes.length === 0 ? (
        <EmptyState
          icon={<Library size={30} aria-hidden="true" />}
          title="No saved palettes"
          description="Create a palette, then use Save palette to add it to this local library."
          actions={
            <Button variant="primary" onClick={onCreate}>
              Create a palette
            </Button>
          }
        />
      ) : (
        <>
          <label className="library-search" htmlFor="library-search">
            <Search size={16} aria-hidden="true" />
            <span className="visually-hidden">Search palettes by name</span>
            <input
              id="library-search"
              type="search"
              value={query}
              placeholder="Search saved palettes"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <p className="library-sort-note">Sorted by most recently updated.</p>
          {filtered.length === 0 ? (
            <EmptyState
              title="No matching palettes"
              description={`No saved palette matches “${query.trim()}”.`}
            />
          ) : (
            <div className="library-grid" aria-label="Saved palettes">
              {filtered.map((palette) => (
                <article
                  className="library-card"
                  key={palette.id}
                  data-active={palette.id === activePaletteId || undefined}
                >
                  <button
                    type="button"
                    className="library-card-open"
                    onClick={() => onOpen(palette)}
                    aria-label={`Open ${palette.name}`}
                  >
                    <span className="library-swatches" aria-hidden="true">
                      {palette.colors.map((color) => (
                        <i
                          key={color.id}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </span>
                    <span>
                      <strong>{palette.name}</strong>
                      <small>
                        {palette.colors.length} colors ·{' '}
                        {palette.sourceType === 'image'
                          ? 'Image palette'
                          : 'Manual palette'}
                      </small>
                      <small>Updated {formattedDate(palette.updatedAt)}</small>
                    </span>
                    <FolderOpen size={18} aria-hidden="true" />
                  </button>
                  {editingId === palette.id ? (
                    <form
                      className="library-rename"
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (!nameDraft.trim()) return
                        onRename(palette, nameDraft.trim())
                        setEditingId(null)
                      }}
                    >
                      <label htmlFor={`rename-${palette.id}`}>
                        Palette name
                      </label>
                      <input
                        id={`rename-${palette.id}`}
                        value={nameDraft}
                        maxLength={120}
                        autoFocus
                        onChange={(event) => setNameDraft(event.target.value)}
                      />
                      <div className="compact-actions">
                        <Button variant="primary" type="submit">
                          Save name
                        </Button>
                        <Button
                          variant="quiet"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="library-card-actions">
                      <IconButton
                        compact
                        label={`Rename ${palette.name}`}
                        icon={<Pencil size={16} aria-hidden="true" />}
                        onClick={() => {
                          setEditingId(palette.id)
                          setNameDraft(palette.name)
                        }}
                      />
                      <IconButton
                        compact
                        label={`Duplicate ${palette.name}`}
                        icon={<Copy size={16} aria-hidden="true" />}
                        onClick={() => onDuplicate(palette)}
                      />
                      <IconButton
                        compact
                        label={`Delete ${palette.name}`}
                        icon={<Trash2 size={16} aria-hidden="true" />}
                        onClick={() => onDelete(palette)}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  )
}
