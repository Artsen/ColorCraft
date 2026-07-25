import { Clipboard, Download } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { RoleAssignments } from '../contrast'
import {
  exportFormats,
  generateExport,
  sanitizeFilename,
  type ExportFormat,
} from '../exporters'
import type { PaletteColor } from '../workspace'
import Button from './ui/Button'
import Notice from './ui/Notice'
import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import Tabs from './ui/Tabs'

interface ExportWorkspaceProps {
  colors: PaletteColor[]
  paletteName: string
  roles: RoleAssignments
  onPaletteNameChange: (name: string) => void
}

type ActionStatus = { variant: 'success' | 'error'; message: string } | null

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const fallback = document.createElement('textarea')
  fallback.value = value
  fallback.setAttribute('readonly', '')
  fallback.style.position = 'fixed'
  fallback.style.opacity = '0'
  document.body.appendChild(fallback)
  fallback.select()
  try {
    if (!document.execCommand('copy'))
      throw new Error('Copy command was declined.')
  } finally {
    fallback.remove()
  }
}

export default function ExportWorkspace({
  colors,
  paletteName,
  roles,
  onPaletteNameChange,
}: ExportWorkspaceProps) {
  const [format, setFormat] = useState<ExportFormat>('css')
  const [status, setStatus] = useState<ActionStatus>(null)
  const previewRef = useRef<HTMLTextAreaElement>(null)
  const output = useMemo(
    () => generateExport(format, { name: paletteName, colors, roles }),
    [colors, format, paletteName, roles],
  )
  const metadata = exportFormats[format]
  const filename = `${sanitizeFilename(paletteName)}.${metadata.extension}`

  const handleCopy = async () => {
    try {
      await copyText(output)
      setStatus({
        variant: 'success',
        message: `${metadata.label} copied to the clipboard.`,
      })
    } catch {
      setStatus({
        variant: 'error',
        message:
          'Clipboard permission was denied. Select the preview and copy it manually.',
      })
    }
  }

  const handleDownload = () => {
    let url: string | null = null
    try {
      url = URL.createObjectURL(
        new Blob([output], { type: `${metadata.mime};charset=utf-8` }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      setStatus({ variant: 'success', message: `${filename} downloaded.` })
    } catch {
      setStatus({
        variant: 'error',
        message: 'The download could not be created. Copy the preview instead.',
      })
    } finally {
      if (url) URL.revokeObjectURL(url)
    }
  }

  return (
    <Panel className="export-workspace">
      <SectionHeader
        title="Export palette"
        description="Generate portable files from the current in-memory palette."
        icon={<Download size={18} aria-hidden="true" />}
      />
      <label className="export-name-field" htmlFor="palette-export-name">
        <span>Palette name</span>
        <input
          id="palette-export-name"
          value={paletteName}
          onChange={(event) => onPaletteNameChange(event.target.value)}
          maxLength={120}
        />
      </label>
      <Tabs
        label="Export formats"
        selected={format}
        onSelect={(id) => {
          setFormat(id as ExportFormat)
          setStatus(null)
        }}
        panelId="export-panel"
        options={(Object.keys(exportFormats) as ExportFormat[]).map((id) => ({
          id,
          label: exportFormats[id].label,
        }))}
      />
      <div
        id={`export-panel-${format}`}
        role="tabpanel"
        aria-labelledby={`${format}-tab`}
        tabIndex={0}
        className="export-format-panel"
      >
        <div className="export-toolbar">
          <div>
            <strong>{metadata.label}</strong>
            <span>{filename}</span>
          </div>
          <div className="compact-actions">
            <Button
              variant="secondary"
              icon={<Clipboard size={16} aria-hidden="true" />}
              onClick={() => void handleCopy()}
            >
              Copy
            </Button>
            <Button
              variant="primary"
              icon={<Download size={16} aria-hidden="true" />}
              onClick={handleDownload}
            >
              Download
            </Button>
          </div>
        </div>
        {format === 'json' && (
          <p className="field-help">
            Portable ColorCraft JSON schema version 3 uses document-local color
            keys for role assignments and excludes internal workspace IDs.
          </p>
        )}
        {status && (
          <Notice
            variant={status.variant}
            actions={
              status.variant === 'error' ? (
                <Button
                  variant="quiet"
                  onClick={() => {
                    previewRef.current?.focus()
                    previewRef.current?.select()
                  }}
                >
                  Select preview
                </Button>
              ) : undefined
            }
          >
            {status.message}
          </Notice>
        )}
        <label className="generated-preview">
          <span className="visually-hidden">
            Generated {metadata.label} preview
          </span>
          <textarea
            ref={previewRef}
            value={output}
            readOnly
            spellCheck={false}
            aria-label={`Generated ${metadata.label} preview`}
          />
        </label>
      </div>
    </Panel>
  )
}
