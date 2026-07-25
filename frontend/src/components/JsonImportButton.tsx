import { FileUp } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import {
  readPortablePaletteFile,
  type ImportedPalette,
} from '../portablePalette'
import Button from './ui/Button'

export default function JsonImportButton({
  onImport,
  onError,
  compact = false,
}: {
  onImport: (palette: ImportedPalette) => void
  onError: (message: string) => void
  compact?: boolean
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)

  return (
    <>
      <label className="visually-hidden" htmlFor={id}>
        Import ColorCraft JSON
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".json,application/json"
        className="visually-hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          setReading(true)
          void readPortablePaletteFile(file)
            .then(onImport)
            .catch((error: unknown) =>
              onError(
                error instanceof Error
                  ? error.message
                  : 'The ColorCraft JSON file could not be read.',
              ),
            )
            .finally(() => setReading(false))
        }}
      />
      <Button
        variant={compact ? 'quiet' : 'secondary'}
        icon={<FileUp size={16} aria-hidden="true" />}
        onClick={() => inputRef.current?.click()}
        disabled={reading}
      >
        {reading ? 'Reading JSON…' : 'Import ColorCraft JSON'}
      </Button>
    </>
  )
}
