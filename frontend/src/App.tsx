import { Pipette, RefreshCw, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { analyzeColors, extractColors } from './api/client'
import type { Analysis, Color } from './api/contracts'
import { errorMessage } from './api/errors'
import AppShell from './components/AppShell'
import ColorPalette from './components/ColorPalette'
import ExportWorkspace from './components/ExportWorkspace'
import ImageColorPicker from './components/ImageColorPicker'
import ImageUpload, { validateImageFile } from './components/ImageUpload'
import InlineNotice, { type NoticeState } from './components/InlineNotice'
import ReviewWorkspace from './components/ReviewWorkspace'
import Button from './components/ui/Button'
import Dialog from './components/ui/Dialog'
import {
  pruneRoleAssignments,
  type PaletteRole,
  type RoleAssignments,
} from './contrast'
import {
  colorFromHex,
  type PaletteColor,
  type ReviewView,
  type WorkspaceView,
  reviewFromLocation,
  urlForReview,
  urlForView,
  viewFromLocation,
} from './workspace'

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
  const [colors, setColors] = useState<PaletteColor[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [requestedColors, setRequestedColors] = useState(6)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysisStale, setAnalysisStale] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [confirmNewPalette, setConfirmNewPalette] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<number | 'add' | null>(null)
  const [reviewTab, setReviewTab] = useState<ReviewView>(() => reviewFromLocation())
  const [roles, setRoles] = useState<RoleAssignments>({})
  const [paletteName, setPaletteName] = useState('Untitled palette')
  const changeImageInputRef = useRef<HTMLInputElement>(null)
  const sourceUrlRef = useRef<string | null>(null)
  const analysisRequestRef = useRef(0)
  const analysisControllerRef = useRef<AbortController | null>(null)
  const extractionRequestRef = useRef(0)
  const extractionControllerRef = useRef<AbortController | null>(null)

  const reviewAvailable = colors.length >= 2
  const exportAvailable = colors.length >= 1
  const hasUnsavedWork = Boolean(source || manualPalette || colors.length)
  const paletteActive = Boolean(source || manualPalette)

  const canOpenView = (target: WorkspaceView) =>
    target === 'create' ||
    (target === 'review' && reviewAvailable) ||
    (target === 'export' && exportAvailable)

  const navigate = (
    target: WorkspaceView,
    options: { replace?: boolean } = {},
  ) => {
    if (!canOpenView(target)) return
    const method = options.replace ? 'replaceState' : 'pushState'
    const url = target === 'review' ? urlForReview(reviewTab) : urlForView(target)
    window.history[method]({ view: target, review: reviewTab }, '', url)
    setView(target)
  }

  const navigateReview = (target: ReviewView, options: { replace?: boolean } = {}) => {
    const method = options.replace ? 'replaceState' : 'pushState'
    window.history[method]({ view: 'review', review: target }, '', urlForReview(target))
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
    const onPopState = () => {
      const target = viewFromLocation()
      const targetReview = reviewFromLocation()
      if (canOpenView(target)) {
        setView(target)
        setReviewTab(targetReview)
      }
      else navigate('create', { replace: true })
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
      setColors(data.colors)
      setSelectedIndex(data.colors.length ? 0 : null)
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
    setColors([])
    setSelectedIndex(null)
    setAnalysis(null)
    setAnalysisStale(false)
    navigate('create')
    await extractPalette(file)
  }

  const startManualPalette = () => {
    revokeSource()
    setSource(null)
    setManualPalette(true)
    setColors([manualStarter])
    setSelectedIndex(0)
    setAnalysis(null)
    setAnalysisStale(false)
    setNotice(null)
    navigate('create')
  }

  const resetPalette = () => {
    analysisRequestRef.current += 1
    extractionRequestRef.current += 1
    analysisControllerRef.current?.abort()
    extractionControllerRef.current?.abort()
    analysisControllerRef.current = null
    extractionControllerRef.current = null
    revokeSource()
    setSource(null)
    setManualPalette(false)
    setColors([])
    setSelectedIndex(null)
    setAnalysis(null)
    setAnalysisStale(false)
    setRoles({})
    setPaletteName('Untitled palette')
    setAnalyzing(false)
    setExtracting(false)
    setNotice(null)
    setPickerTarget(null)
    setConfirmNewPalette(false)
    navigate('create')
  }

  const requestNewPalette = () => {
    if (hasUnsavedWork) setConfirmNewPalette(true)
    else resetPalette()
  }

  const updateColor = (index: number, color: Color) => {
    setColors((current) => current.map((item, itemIndex) => (
      itemIndex === index ? color : item
    )))
    invalidateAnalysis()
  }

  const addColor = (color: Color = manualStarter) => {
    if (colors.length >= 10) {
      setNotice({ variant: 'warning', message: 'A palette can contain at most 10 colors.' })
      return
    }
    setColors((current) => [...current, color])
    setSelectedIndex(colors.length)
    invalidateAnalysis()
  }

  const duplicateColor = (index: number) => {
    const sourceColor = colors[index]
    if (!sourceColor || colors.length >= 10) {
      if (colors.length >= 10) {
        setNotice({ variant: 'warning', message: 'A palette can contain at most 10 colors.' })
      }
      return
    }
    const duplicate: Color = {
      hex: sourceColor.hex,
      rgb: { ...sourceColor.rgb },
      hsl: { ...sourceColor.hsl },
    }
    setColors((current) => [
      ...current.slice(0, index + 1),
      duplicate,
      ...current.slice(index + 1),
    ])
    setSelectedIndex(index + 1)
    invalidateAnalysis()
  }

  const removeColor = (index: number) => {
    setColors((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setSelectedIndex((current) => {
      if (current === null) return null
      if (colors.length <= 1) return null
      if (current > index) return current - 1
      return Math.min(current, colors.length - 2)
    })
    invalidateAnalysis()
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

  const headerTitle = paletteActive ? 'Current palette' : 'ColorCraft'
  const headerSource = source
    ? source.file.name
    : manualPalette
      ? 'Untitled palette'
      : 'Local color utility'
  const headerSummary = source
    ? `${colorCountLabel(colors.length)} · extracted from image`
    : manualPalette
      ? `${colorCountLabel(colors.length)} · created manually`
      : 'Extract, refine, and validate color palettes from images.'

  const createView = !paletteActive ? (
    <ImageUpload onImageSelected={beginImagePalette} onStartManual={startManualPalette} />
  ) : (
    <div className={`source-palette-workspace ${source ? '' : 'manual-workspace'}`.trim()}>
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
                onClick={() => setPickerTarget(selectedIndex ?? 'add')}
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
                setSource((current) => current && current.previewUrl === source.previewUrl
                  ? { ...current, width: image.naturalWidth, height: image.naturalHeight }
                  : current)
              }}
            />
          </div>
          <dl className="source-metadata">
            <div><dt>File</dt><dd>{source.file.name}</dd></div>
            <div>
              <dt>Dimensions</dt>
              <dd>{source.width && source.height ? `${source.width} × ${source.height}` : 'Reading…'}</dd>
            </div>
            <div><dt>Size</dt><dd>{(source.file.size / 1024 / 1024).toFixed(2)} MB</dd></div>
          </dl>
        </section>
      )}

      <section className="palette-panel" aria-labelledby="palette-heading">
        <div className="feature-heading">
          <div>
            <p className="workspace-kicker">{source ? 'Extracted palette' : 'Manual palette'}</p>
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

        {source && (
          <div className="extraction-controls">
            <label htmlFor="requested-colors">Requested colors</label>
            <input
              id="requested-colors"
              type="range"
              min="3"
              max="10"
              value={requestedColors}
              onChange={(event) => setRequestedColors(Number(event.target.value))}
            />
            <output htmlFor="requested-colors">{requestedColors}</output>
            <span>
              Actual returned: {colors.length} · Distinct colors may be fewer than requested.
            </span>
          </div>
        )}

        <ColorPalette
          colors={colors}
          selectedIndex={selectedIndex}
          sourceAvailable={Boolean(source)}
          onSelect={setSelectedIndex}
          onColorChange={updateColor}
          onAddColor={() => addColor()}
          onDuplicateColor={duplicateColor}
          onRemoveColor={removeColor}
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
          {!reviewAvailable && <span>Add one more valid color to enable analysis.</span>}
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
        onNavigate={navigate}
        onNewPalette={requestNewPalette}
      >
        {notice && (
          <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
        )}
        {view === 'create' && createView}
        {view === 'review' && reviewView}
        {view === 'export' && exportView}
      </AppShell>

      <label className="visually-hidden" htmlFor="change-source-image">Change source image</label>
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
        <p>Your current unsaved palette will be cleared from this browser session.</p>
        <div className="dialog-actions">
          <Button variant="quiet" onClick={() => setConfirmNewPalette(false)}>Keep working</Button>
          <Button variant="destructive" onClick={resetPalette}>Discard and start new</Button>
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
