import {
  Download,
  FilePlus2,
  FlaskConical,
  Library,
  Palette,
  Plus,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { WorkspaceView } from '../workspace'
import AppMark from './ui/AppMark'
import Button from './ui/Button'
import StatusBadge from './ui/StatusBadge'
import ThemeControl from './ui/ThemeControl'

interface NavigationState {
  review: { available: boolean; reason: string }
  export: { available: boolean; reason: string }
}

interface AppShellProps {
  view: WorkspaceView
  navigation: NavigationState
  title: string
  sourceName: string
  summary: string
  onNavigate: (view: WorkspaceView) => void
  onNewPalette: () => void
  recentPalettes?: Array<{ id: string; name: string }>
  onOpenRecent?: (id: string) => void
  headerActions?: ReactNode
  children: ReactNode
}

const navigationItems = [
  { view: 'create' as const, label: 'Create', icon: Palette },
  { view: 'review' as const, label: 'Review', icon: FlaskConical },
  { view: 'export' as const, label: 'Export', icon: Download },
  { view: 'library' as const, label: 'Library', icon: Library },
]

export default function AppShell({
  view,
  navigation,
  title,
  sourceName,
  summary,
  onNavigate,
  onNewPalette,
  recentPalettes = [],
  onOpenRecent,
  headerActions,
  children,
}: AppShellProps) {
  const availability = (target: WorkspaceView) => {
    if (target === 'create') return { available: true, reason: '' }
    if (target === 'library') return { available: true, reason: '' }
    return navigation[target]
  }

  const navigationContent = (location: 'sidebar' | 'mobile') => (
    <nav
      className={
        location === 'sidebar' ? 'shell-navigation' : 'mobile-navigation'
      }
      aria-label={location === 'sidebar' ? 'Primary' : 'Mobile primary'}
    >
      {navigationItems.map(({ view: target, label, icon: Icon }) => {
        const state = availability(target)
        const reasonId = `${location}-${target}-reason`
        return (
          <div className="navigation-item-wrap" key={target}>
            <button
              type="button"
              className="navigation-item"
              aria-current={view === target ? 'page' : undefined}
              aria-describedby={!state.available ? reasonId : undefined}
              disabled={!state.available}
              title={!state.available ? state.reason : undefined}
              onClick={() => onNavigate(target)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
            {!state.available && (
              <span
                className={
                  location === 'sidebar'
                    ? 'navigation-reason'
                    : 'visually-hidden'
                }
                id={reasonId}
              >
                {state.reason}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="app-shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <AppMark size="small" />
          <div>
            <strong>ColorCraft</strong>
            <span>Local color utility</span>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} aria-hidden="true" />}
          onClick={onNewPalette}
          className="new-palette-button"
        >
          New palette
        </Button>
        {navigationContent('sidebar')}
        {recentPalettes.length > 0 && (
          <section
            className="recent-palettes"
            aria-labelledby="recent-palettes-heading"
          >
            <h2 id="recent-palettes-heading">Recent palettes</h2>
            <div>
              {recentPalettes.slice(0, 3).map((palette) => (
                <button
                  type="button"
                  key={palette.id}
                  onClick={() => onOpenRecent?.(palette.id)}
                >
                  <span className="recent-palette-dot" aria-hidden="true" />
                  <span>{palette.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        <div className="sidebar-theme">
          <ThemeControl />
        </div>
      </aside>

      <div className="shell-main">
        <header className="mobile-topbar">
          <div className="shell-brand">
            <AppMark size="small" />
            <div>
              <strong>ColorCraft</strong>
              <span>Local color utility</span>
            </div>
          </div>
          <Button
            variant="quiet"
            icon={<FilePlus2 size={17} aria-hidden="true" />}
            onClick={onNewPalette}
          >
            New
          </Button>
          <ThemeControl />
        </header>

        <main className="shell-workspace">
          <header className="workspace-header">
            <div>
              <p className="workspace-kicker">{sourceName}</p>
              <h1>{title}</h1>
              <p>{summary}</p>
            </div>
            <div className="workspace-header-actions">
              {headerActions}
              <StatusBadge>Local only</StatusBadge>
            </div>
          </header>
          <div className="workspace-content">{children}</div>
        </main>

        {navigationContent('mobile')}
      </div>
    </div>
  )
}
