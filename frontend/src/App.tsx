import {
  CheckCircle2,
  CircleDotDashed,
  Pipette,
  RefreshCw,
  Save,
  Upload,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { analyzeColors, extractColors, getMetadata } from './api/client'
import type { Analysis, Color } from './api/contracts'
import { errorMessage } from './api/errors'
import AppShell from './components/AppShell'
import type { NetworkStatus } from './components/AppShell'
import ColorPalette from './components/ColorPalette'
import ExportWorkspace from './components/ExportWorkspace'
import ImageColorPicker from './components/ImageColorPicker'
import ImageUpload, { validateImageFile } from './components/ImageUpload'
import JsonImportButton from './components/JsonImportButton'
import InlineNotice, { type NoticeState } from './components/InlineNotice'
import PaletteLibrary from './components/PaletteLibrary'
import ReviewWorkspace from './components/ReviewWorkspace'
import Button from './components/ui/Button'
import Dialog from './components/ui/Dialog'
import StatusBadge from './components/ui/StatusBadge'
import {
  pruneRoleAssignments,
  type PaletteRole,
  type RoleAssignments,
} from './contrast'
import {
  deleteSavedPalette,
  duplicateSavedPalette,
  listSavedPalettes,
  paletteSnapshotFingerprint,
  renameSavedPalette,
  savePalette,
  type PaletteDraft,
  type SavedPalette,
} from './persistence'
import {
  clonePaletteColor,
  colorFromHex,
  paletteColorFromApi,
  replacePaletteColorValue,
  type PaletteColor,
  type ReviewView,
  type WorkspaceView,
  reviewFromLocation,
  urlForReview,
  urlForView,
  viewFromLocation,
} from './workspace'
import type { ImportedPalette } from './portablePalette'

interface SourceImage {
  file: File
  previewUrl: string
  width: number | null
  height: number | null
}

const manualStarter = colorFromHex('#808080')!

function colorCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'color' : 'colors'}`
}

function App() {
  const [view, setView] = useState<WorkspaceView>(() => viewFromLocation())
  const [source, setSource] = useState<SourceImage | null>(null)
  const [manualPalette, setManualPalette] = useState(false)
  const [paletteSourceType, setPaletteSourceType] = useState<
    'image' | 'manual' | null
  >(null)
  const [sourceFilename, setSourceFilename] = useState<string | undefined>()
  const [colors, setColors] = useState<PaletteColor[]>([])
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
  const [requestedColors, setRequestedColors] = useState(6)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysisStale, setAnalysisStale] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    state: 'loading',
  })
  const [confirmNewPalette, setConfirmNewPalette] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<string | 'add' | null>(null)
  const [reviewTab, setReviewTab] = useState<ReviewView>(() =>
    reviewFromLocation(),
  )
  const [roles, setRoles] = useState<RoleAssignments>({})
  const [paletteName, setPaletteName] = useState('Untitled palette')
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null)
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null)
  const [pendingOpenPalette, setPendingOpenPalette] =
    useState<SavedPalette | null>(null)
  const [pendingImport, setPendingImport] = useState<ImportedPalette | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<SavedPalette | null>(null)
  const changeImageInputRef = useRef<HTMLInputElement>(null)
  const sourceUrlRef = useRef<string | null>(null)
  const analysisRequestRef = useRef(0)
  const analysisControllerRef = useRef<AbortController | null>(null)
  const extractionRequestRef = useRef(0)
  const extractionControllerRef = useRef<AbortController | null>(null)

  const reviewAvailable = colors.length >= 2
  const exportAvailable = colors.length >= 1
  const paletteActive = Boolean(source || manualPalette)
  const paletteDraft: PaletteDraft | null =
    paletteActive && colors.length && paletteSourceType
      ? {
          name: paletteName,
          sourceType: paletteSourceType,
          ...(sourceFilename ? { sourceFilename } : {}),
          colors,
          roles,
        }
      : null
  const currentFingerprint = paletteDraft
    ? paletteSnapshotFingerprint(paletteDraft)
    : null
  const saveState = !paletteDraft
    ? null
    : !activePaletteId
      ? 'unsaved'
      : currentFingerprint === savedFingerprint
        ? 'saved'
        : 'modified'
  const hasPendingChanges = saveState === 'unsaved' || saveState === 'modified'

  const canOpenView = (target: WorkspaceView) =>
    target === 'create' ||
    target === 'library' ||
    (target === 'review' && reviewAvailable) ||
    (target === 'export' && exportAvailable)

  const navigate = (
    target: WorkspaceView,
    options: { replace?: boolean } = {},
  ) => {
    if (!canOpenView(target)) return
    const method = options.replace ? 'replaceState' : 'pushState'
    const url =
      target === 'review' ? urlForReview(reviewTab) : urlForView(target)
    window.history[method]({ view: target, review: reviewTab }, '', url)
    setView(target)
  }

  const navigateReview = (
    target: ReviewView,
    options: { replace?: boolean } = {},
  ) => {
    const method = options.replace ? 'replaceState' : 'pushState'
    window.history[method](
      { view: 'review', review: target },
      '',
      urlForReview(target),
    )
    setReviewTab(target)
    setView('review')
  }

  useEffect(() => {
    const target = viewFromLocation()
    const targetReview = reviewFromLocation()
    setReviewTab(targetReview)
    window.history.replaceState(
      { view: target, review: targetReview },
      '',
      target === 'review' ? urlForReview(targetReview) : urlForView(target),
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void getMetadata(controller.signal)
      .then((metadata) =>
        setNetworkStatus({ state: 'available', mode: metadata.networkMode }),
      )
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setNetworkStatus({ state: 'unavailable' })
          console.error('Could not read runtime metadata:', error)
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const onPopState = () => {
      const target = viewFromLocation()
      const targetReview = reviewFromLocation()
      if (canOpenView(target)) {
        setView(target)
        setReviewTab(targetReview)
      } else navigate('create', { replace: true })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  })

  useEffect(() => {
    if (!canOpenView(view)) navigate('create', { replace: true })
  }, [colors.length, view])

  useEffect(() => {
    setRoles((current) => pruneRoleAssignments(current, colors))
  }, [colors])

  const refreshLibrary = async () => {
    try {
      setSavedPalettes(await listSavedPalettes())
    } catch (error) {
      console.error('Could not load saved palettes:', error)
      setNotice({
        variant: 'error',
        message: 'Saved palettes could not be read from this browser.',
      })
    } finally {
      setLibraryLoading(false)
    }
  }

  useEffect(() => {
    void refreshLibrary()
  }, [])

  useEffect(
    () => () => {
      analysisControllerRef.current?.abort()
      extractionControllerRef.current?.abort()
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
    },
    [],
  )

  const invalidateAnalysis = () => {
    analysisRequestRef.current += 1
    analysisControllerRef.current?.abort()
    analysisControllerRef.current = null
    if (analysis) setAnalysisStale(true)
    setAnalysis(null)
  }

  const revokeSource = () => {
    if (!sourceUrlRef.current) return
    URL.revokeObjectURL(sourceUrlRef.current)
    sourceUrlRef.current = null
  }

  const extractPalette = async (file: File, count = requestedColors) => {
    extractionControllerRef.current?.abort()
    const controller = new AbortController()
    extractionControllerRef.current = controller
    const requestId = extractionRequestRef.current + 1
    extractionRequestRef.current = requestId
    setExtracting(true)
    setNotice(null)
    try {
      const data = await extractColors(file, count, controller.signal)
      if (requestId !== extractionRequestRef.current) return
      const extracted = data.colors.map((color) => paletteColorFromApi(color))
      setColors(extracted)
      setSelectedColorId(extracted[0]?.id ?? null)
      invalidateAnalysis()
      setNotice({
        variant: data.count < count ? 'information' : 'success',
        message:
          data.count < count
            ? `${data.count} distinct ${data.count === 1 ? 'color was' : 'colors were'} found from the requested ${count}.`
            : `${data.count} distinct colors were extracted.`,
      })
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Error extracting colors:', error)
      setNotice({
        variant: 'error',
        message: errorMessage(error),
        retry: () => void extractPalette(file, count),
      })
    } finally {
      if (requestId === extractionRequestRef.current) setExtracting(false)
    }
  }

  const beginImagePalette = async (file: File) => {
    revokeSource()
    const previewUrl = URL.createObjectURL(file)
    sourceUrlRef.current = previewUrl
    setSource({ file, previewUrl, width: null, height: null })
    setPaletteName(file.name.replace(/\.[^.]+$/, '') || 'Untitled palette')
    setManualPalette(false)
    setPaletteSourceType('image')
    setSourceFilename(file.name)
    setActivePaletteId(null)
    setSavedFingerprint(null)
    setColors([])
    setSelectedColorId(null)
    setAnalysis(null)
    setAnalysisStale(false)
    navigate('create')
    await extractPalette(file)
  }

  const startManualPalette = () => {
    revokeSource()
    setSource(null)
    setManualPalette(true)
    setPaletteSourceType('manual')
    setSourceFilename(undefined)
    setActivePaletteId(null)
    setSavedFingerprint(null)
    const starter = paletteColorFromApi(manualStarter)
    setColors([starter])
    setSelectedColorId(starter.id)
    setAnalysis(null)
    setAnalysisStale(false)
    setNotice(null)
    navigate('create')
  }

  const resetPalette = (target: WorkspaceView = 'create') => {
    analysisRequestRef.current += 1
    extractionRequestRef.current += 1
    analysisControllerRef.current?.abort()
    extractionControllerRef.current?.abort()
    analysisControllerRef.current = null
    extractionControllerRef.current = null
    revokeSource()
    setSource(null)
    setManualPalette(false)
    setPaletteSourceType(null)
    setSourceFilename(undefined)
    setColors([])
    setSelectedColorId(null)
    setAnalysis(null)
    setAnalysisStale(false)
    setRoles({})
    setPaletteName('Untitled palette')
    setActivePaletteId(null)
    setSavedFingerprint(null)
    setAnalyzing(false)
    setExtracting(false)
    setNotice(null)
    setPickerTarget(null)
    setConfirmNewPalette(false)
    navigate(target)
  }

  const requestNewPalette = () => {
    if (hasPendingChanges) setConfirmNewPalette(true)
    else resetPalette()
  }

  const updateColor = (id: string, color: Color) => {
    setColors((current) =>
      current.map((item) =>
        item.id === id ? replacePaletteColorValue(item, color) : item,
      ),
    )
    invalidateAnalysis()
  }

  const addColor = (color: Color = manualStarter) => {
    if (colors.length >= 10) {
      setNotice({
        variant: 'warning',
        message: 'A palette can contain at most 10 colors.',
      })
      return
    }
    const added = paletteColorFromApi(color)
    setColors((current) => [...current, added])
    setSelectedColorId(added.id)
    invalidateAnalysis()
  }

  const duplicateColor = (id: string) => {
    const index = colors.findIndex((color) => color.id === id)
    const sourceColor = colors[index]
    if (!sourceColor || colors.length >= 10) {
      if (colors.length >= 10) {
        setNotice({
          variant: 'warning',
          message: 'A palette can contain at most 10 colors.',
        })
      }
      return
    }
    const duplicate = clonePaletteColor(sourceColor, {
      newId: true,
      copyName: true,
    })
    setColors((current) => [
      ...current.slice(0, index + 1),
      duplicate,
      ...current.slice(index + 1),
    ])
    setSelectedColorId(duplicate.id)
    invalidateAnalysis()
  }

  const removeColor = (id: string) => {
    const index = colors.findIndex((color) => color.id === id)
    const next = colors.filter((color) => color.id !== id)
    setColors(next)
    if (selectedColorId === id) {
      setSelectedColorId(next[Math.min(index, next.length - 1)]?.id ?? null)
    }
    invalidateAnalysis()
  }

  const moveColor = (id: string, direction: -1 | 1) => {
    setColors((current) => {
      const index = current.findIndex((color) => color.id === id)
      const destination = index + direction
      if (index < 0 || destination < 0 || destination >= current.length)
        return current
      const next = [...current]
      ;[next[index], next[destination]] = [next[destination], next[index]]
      return next
    })
    invalidateAnalysis()
  }

  const updateColorName = (id: string, name?: string) => {
    setColors((current) =>
      current.map((color) =>
        color.id === id
          ? { ...color, ...(name ? { name } : { name: undefined }) }
          : color,
      ),
    )
  }

  const activateImport = (palette: ImportedPalette) => {
    analysisRequestRef.current += 1
    extractionRequestRef.current += 1
    analysisControllerRef.current?.abort()
    extractionControllerRef.current?.abort()
    revokeSource()
    setSource(null)
    setManualPalette(true)
    setPaletteSourceType('manual')
    setSourceFilename(undefined)
    setPaletteName(palette.name)
    setColors(palette.colors)
    setRoles(palette.roles)
    setSelectedColorId(palette.colors[0]?.id ?? null)
    setAnalysis(null)
    setAnalysisStale(false)
    setActivePaletteId(null)
    setSavedFingerprint(null)
    setPendingImport(null)
    setNotice({
      variant: 'success',
      message: `${palette.name} was imported locally and remains unsaved.`,
    })
    navigate('create')
  }

  const requestImport = (palette: ImportedPalette) => {
    if (hasPendingChanges) setPendingImport(palette)
    else activateImport(palette)
  }

  const handleAnalyze = async () => {
    if (!reviewAvailable) {
      setNotice({
        variant: 'warning',
        message: 'Add at least two valid colors before analyzing the palette.',
      })
      return
    }

    analysisControllerRef.current?.abort()
    const controller = new AbortController()
    analysisControllerRef.current = controller
    const requestId = analysisRequestRef.current + 1
    analysisRequestRef.current = requestId
    setAnalyzing(true)
    setNotice(null)
    try {
      const data = await analyzeColors(colors, controller.signal)
      if (requestId !== analysisRequestRef.current) return
      setAnalysis(data.analysis)
      setAnalysisStale(false)
      navigate('review')
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Error analyzing colors:', error)
      setNotice({
        variant: 'error',
        message: errorMessage(error),
        retry: () => void handleAnalyze(),
      })
    } finally {
      if (requestId === analysisRequestRef.current) setAnalyzing(false)
    }
  }

  const handleChangedImage = (file?: File) => {
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      setNotice({ variant: 'error', message: validationError })
      return
    }
    void beginImagePalette(file)
  }

  const openPalette = (palette: SavedPalette) => {
    analysisRequestRef.current += 1
    extractionRequestRef.current += 1
    analysisControllerRef.current?.abort()
    extractionControllerRef.current?.abort()
    revokeSource()
    setSource(null)
    setManualPalette(true)
    setPaletteSourceType(palette.sourceType)
    setSourceFilename(palette.sourceFilename)
    setPaletteName(palette.name)
    setColors(palette.colors)
    setRoles(palette.roles)
    setSelectedColorId(palette.colors[0]?.id ?? null)
    setAnalysis(null)
    setAnalysisStale(false)
    setActivePaletteId(palette.id)
    setSavedFingerprint(paletteSnapshotFingerprint(palette))
    setNotice(null)
    setPendingOpenPalette(null)
    navigate('create')
  }

  const requestOpenPalette = (palette: SavedPalette) => {
    if (hasPendingChanges && palette.id !== activePaletteId) {
      setPendingOpenPalette(palette)
    } else {
      openPalette(palette)
    }
  }

  const saveCurrentPalette = async () => {
    if (!paletteDraft) return
    try {
      const existing = activePaletteId
        ? savedPalettes.find((palette) => palette.id === activePaletteId)
        : undefined
      const saved = await savePalette(paletteDraft, existing)
      setActivePaletteId(saved.id)
      setPaletteName(saved.name)
      setSavedFingerprint(paletteSnapshotFingerprint(saved))
      await refreshLibrary()
      setNotice({
        variant: 'success',
        message: existing
          ? 'Palette changes saved locally.'
          : 'Palette saved locally.',
      })
    } catch (error) {
      console.error('Could not save palette:', error)
      setNotice({
        variant: 'error',
        message: 'The palette could not be saved in this browser.',
        retry: () => void saveCurrentPalette(),
      })
    }
  }

  const handleRenamePalette = async (palette: SavedPalette, name: string) => {
    try {
      const renamed = await renameSavedPalette(palette.id, name)
      if (palette.id === activePaletteId) {
        setPaletteName(renamed.name)
        setSavedFingerprint(paletteSnapshotFingerprint(renamed))
      }
      await refreshLibrary()
    } catch (error) {
      console.error('Could not rename palette:', error)
      setNotice({
        variant: 'error',
        message: 'The saved palette could not be renamed.',
      })
    }
  }

  const handleDuplicatePalette = async (palette: SavedPalette) => {
    try {
      await duplicateSavedPalette(palette)
      await refreshLibrary()
      setNotice({
        variant: 'success',
        message: `${palette.name} was duplicated.`,
      })
    } catch (error) {
      console.error('Could not duplicate palette:', error)
      setNotice({
        variant: 'error',
        message: 'The saved palette could not be duplicated.',
      })
    }
  }

  const confirmDeletePalette = async () => {
    if (!deleteTarget) return
    const palette = deleteTarget
    try {
      await deleteSavedPalette(palette.id)
      setDeleteTarget(null)
      if (palette.id === activePaletteId) resetPalette('library')
      await refreshLibrary()
      setNotice({ variant: 'success', message: `${palette.name} was deleted.` })
    } catch (error) {
      console.error('Could not delete palette:', error)
      setNotice({
        variant: 'error',
        message: 'The saved palette could not be deleted.',
      })
    }
  }

  const headerTitle =
    view === 'library'
      ? 'Palette Library'
      : paletteActive
        ? 'Current palette'
        : 'ColorCraft'
  const headerSource =
    view === 'library'
      ? 'Local palette storage'
      : paletteActive
        ? paletteName
        : 'Local color utility'
  const headerSummary =
    view === 'library'
      ? `${savedPalettes.length} saved ${savedPalettes.length === 1 ? 'palette' : 'palettes'} · stored in this browser`
      : paletteActive
        ? `${colorCountLabel(colors.length)} · ${paletteSourceType === 'image' ? 'created from an image' : 'created manually'}`
        : 'Extract, refine, and review color palettes from images.'

  const createView = !paletteActive ? (
    <ImageUpload
      onImageSelected={beginImagePalette}
      onStartManual={startManualPalette}
      onImport={requestImport}
      onImportError={(message) => setNotice({ variant: 'error', message })}
    />
  ) : (
    <div
      className={`source-palette-workspace ${source ? '' : 'manual-workspace'}`.trim()}
    >
      {source && (
        <section className="source-panel" aria-labelledby="source-heading">
          <div className="feature-heading">
            <div>
              <p className="workspace-kicker">Source</p>
              <h2 id="source-heading">Source image</h2>
            </div>
            <div className="compact-actions">
              <Button
                variant="secondary"
                icon={<Pipette size={16} aria-hidden="true" />}
                onClick={() => setPickerTarget(selectedColorId ?? 'add')}
              >
                Pick from image
              </Button>
              <Button
                variant="quiet"
                icon={<Upload size={16} aria-hidden="true" />}
                onClick={() => changeImageInputRef.current?.click()}
              >
                Change image
              </Button>
            </div>
          </div>
          <div className="source-image-stage">
            <img
              src={source.previewUrl}
              alt={`Source ${source.file.name}`}
              onLoad={(event) => {
                const image = event.currentTarget
                setSource((current) =>
                  current && current.previewUrl === source.previewUrl
                    ? {
                        ...current,
                        width: image.naturalWidth,
                        height: image.naturalHeight,
                      }
                    : current,
                )
              }}
            />
          </div>
          <dl className="source-metadata">
            <div>
              <dt>File</dt>
              <dd>{source.file.name}</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>
                {source.width && source.height
                  ? `${source.width} × ${source.height}`
                  : 'Reading…'}
              </dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{(source.file.size / 1024 / 1024).toFixed(2)} MB</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="palette-panel" aria-labelledby="palette-heading">
        <div className="feature-heading">
          <div>
            <p className="workspace-kicker">
              {source
                ? 'Extracted palette'
                : paletteSourceType === 'image'
                  ? 'Saved image palette'
                  : 'Manual palette'}
            </p>
            <h2 id="palette-heading">Palette</h2>
          </div>
          {source && (
            <Button
              variant="secondary"
              icon={<RefreshCw size={16} aria-hidden="true" />}
              onClick={() => void extractPalette(source.file)}
              disabled={extracting}
            >
              {extracting ? 'Extracting…' : 'Re-extract'}
            </Button>
          )}
        </div>

        {!source && paletteSourceType === 'image' && (
          <p className="source-retention-note">
            Source: {sourceFilename ?? 'image'} · The source image itself was
            not retained.
          </p>
        )}

        {source && (
          <div className="extraction-controls">
            <label htmlFor="requested-colors">Requested colors</label>
            <input
              id="requested-colors"
              type="range"
              min="3"
              max="10"
              value={requestedColors}
              onChange={(event) =>
                setRequestedColors(Number(event.target.value))
              }
            />
            <output htmlFor="requested-colors">{requestedColors}</output>
            <span>
              Actual returned: {colors.length} · Distinct colors may be fewer
              than requested.
            </span>
          </div>
        )}

        <ColorPalette
          colors={colors}
          selectedColorId={selectedColorId}
          sourceAvailable={Boolean(source)}
          onSelect={setSelectedColorId}
          onColorChange={updateColor}
          onNameChange={updateColorName}
          onAddColor={() => addColor()}
          onDuplicateColor={duplicateColor}
          onRemoveColor={removeColor}
          onMoveColor={moveColor}
          onPickFromImage={setPickerTarget}
        />

        <div className="palette-primary-action">
          <Button
            variant="primary"
            onClick={() => void handleAnalyze()}
            disabled={analyzing || !reviewAvailable}
          >
            {analyzing ? 'Analyzing…' : 'Analyze palette'}
          </Button>
          {!reviewAvailable && (
            <span>Add one more valid color to enable analysis.</span>
          )}
        </div>
      </section>
    </div>
  )

  const reviewView = (
    <ReviewWorkspace
      colors={colors}
      analysis={analysis}
      analysisStale={analysisStale}
      analyzing={analyzing}
      selectedTab={reviewTab}
      roles={roles}
      onSelectTab={navigateReview}
      onAnalyze={() => void handleAnalyze()}
      onAssignRole={(role: PaletteRole, hex) => {
        setRoles((current) => {
          const next = { ...current }
          if (hex) next[role] = hex
          else delete next[role]
          return next
        })
      }}
      onAddColor={addColor}
    />
  )

  const exportView = (
    <ExportWorkspace
      colors={colors}
      paletteName={paletteName}
      roles={roles}
      onPaletteNameChange={setPaletteName}
    />
  )

  const libraryView = (
    <PaletteLibrary
      palettes={savedPalettes}
      activePaletteId={activePaletteId}
      loading={libraryLoading}
      onCreate={requestNewPalette}
      onOpen={requestOpenPalette}
      onRename={(palette, name) => void handleRenamePalette(palette, name)}
      onDuplicate={(palette) => void handleDuplicatePalette(palette)}
      onDelete={setDeleteTarget}
    />
  )

  const headerActions = paletteDraft ? (
    <div className="save-controls">
      {view === 'create' && (
        <JsonImportButton
          compact
          onImport={requestImport}
          onError={(message) => setNotice({ variant: 'error', message })}
        />
      )}
      <StatusBadge
        variant={
          saveState === 'saved'
            ? 'success'
            : saveState === 'modified'
              ? 'warning'
              : 'information'
        }
      >
        {saveState === 'saved' ? (
          <CheckCircle2 size={14} aria-hidden="true" />
        ) : (
          <CircleDotDashed size={14} aria-hidden="true" />
        )}
        {saveState === 'saved'
          ? 'Saved'
          : saveState === 'modified'
            ? 'Modified'
            : 'Unsaved'}
      </StatusBadge>
      <Button
        variant={saveState === 'saved' ? 'quiet' : 'primary'}
        icon={<Save size={16} aria-hidden="true" />}
        onClick={() => void saveCurrentPalette()}
        disabled={saveState === 'saved'}
      >
        {activePaletteId ? 'Save changes' : 'Save palette'}
      </Button>
    </div>
  ) : undefined

  return (
    <>
      <AppShell
        view={view}
        navigation={{
          review: {
            available: reviewAvailable,
            reason: 'Add at least two valid colors to review the palette.',
          },
          export: {
            available: exportAvailable,
            reason: 'Add at least one valid color to export the palette.',
          },
        }}
        title={headerTitle}
        sourceName={headerSource}
        summary={headerSummary}
        networkStatus={networkStatus}
        onNavigate={navigate}
        onNewPalette={requestNewPalette}
        recentPalettes={savedPalettes.map(({ id, name }) => ({ id, name }))}
        onOpenRecent={(id) => {
          const palette = savedPalettes.find((item) => item.id === id)
          if (palette) requestOpenPalette(palette)
        }}
        headerActions={headerActions}
      >
        {notice && (
          <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
        )}
        {view === 'create' && createView}
        {view === 'review' && reviewView}
        {view === 'export' && exportView}
        {view === 'library' && libraryView}
      </AppShell>

      <label className="visually-hidden" htmlFor="change-source-image">
        Change source image
      </label>
      <input
        ref={changeImageInputRef}
        id="change-source-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        onChange={(event) => {
          handleChangedImage(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <Dialog
        open={confirmNewPalette}
        title="Start a new palette?"
        onClose={() => setConfirmNewPalette(false)}
      >
        <p>
          Your current {saveState === 'modified' ? 'modified' : 'unsaved'}{' '}
          palette changes will be cleared from this browser session.
        </p>
        <div className="dialog-actions">
          <Button variant="quiet" onClick={() => setConfirmNewPalette(false)}>
            Keep working
          </Button>
          <Button variant="destructive" onClick={() => resetPalette()}>
            Discard and start new
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(pendingOpenPalette)}
        title="Open another palette?"
        onClose={() => setPendingOpenPalette(null)}
      >
        <p>
          Your current {saveState === 'modified' ? 'modified' : 'unsaved'}{' '}
          palette changes will be discarded.
        </p>
        <div className="dialog-actions">
          <Button variant="quiet" onClick={() => setPendingOpenPalette(null)}>
            Keep working
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              pendingOpenPalette && openPalette(pendingOpenPalette)
            }
          >
            Discard changes and open
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        title="Delete saved palette?"
        onClose={() => setDeleteTarget(null)}
      >
        <p>
          {deleteTarget?.name} will be removed from this browser. This cannot be
          undone.
        </p>
        <div className="dialog-actions">
          <Button variant="quiet" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void confirmDeletePalette()}
          >
            Delete palette
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(pendingImport)}
        title="Import another palette?"
        onClose={() => setPendingImport(null)}
      >
        <p>
          Your current {saveState === 'modified' ? 'modified' : 'unsaved'}{' '}
          palette changes will be discarded.
        </p>
        <div className="dialog-actions">
          <Button variant="quiet" onClick={() => setPendingImport(null)}>
            Keep working
          </Button>
          <Button
            variant="destructive"
            onClick={() => pendingImport && activateImport(pendingImport)}
          >
            Discard changes and import
          </Button>
        </div>
      </Dialog>

      {source && pickerTarget !== null && (
        <ImageColorPicker
          imageUrl={source.previewUrl}
          onClose={() => setPickerTarget(null)}
          onColorPicked={(color) => {
            if (pickerTarget === 'add') addColor(color)
            else updateColor(pickerTarget, color)
          }}
        />
      )}
    </>
  )
}

export default App
