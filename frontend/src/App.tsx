import { useRef, useState } from 'react'
import ImageUpload from './components/ImageUpload'
import ColorPalette from './components/ColorPalette'
import ColorWheel from './components/ColorWheel'
import AnalysisResults from './components/AnalysisResults'
import ColorSuggestions from './components/ColorSuggestions'
import InlineNotice, { type NoticeState } from './components/InlineNotice'
import AppMark from './components/ui/AppMark'
import Button from './components/ui/Button'
import Panel from './components/ui/Panel'
import SectionHeader from './components/ui/SectionHeader'
import ThemeControl from './components/ui/ThemeControl'
import { analyzeColors, extractColors } from './api/client'
import { errorMessage } from './api/errors'
import type { Analysis, Color } from './api/contracts'

function App() {
  const [colors, setColors] = useState<Color[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(true)
  const [uploadedImage, setUploadedImage] = useState<{
    file: File
    previewUrl: string
  } | null>(null)
  const [nColors, setNColors] = useState(5)
  const [extracting, setExtracting] = useState(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const analysisRequestRef = useRef(0)
  const analysisControllerRef = useRef<AbortController | null>(null)
  const extractionRequestRef = useRef(0)
  const extractionControllerRef = useRef<AbortController | null>(null)

  const invalidateAnalysis = () => {
    analysisRequestRef.current += 1
    analysisControllerRef.current?.abort()
    analysisControllerRef.current = null
    setAnalysis(null)
  }

  const handleColorsExtracted = (extractedColors: Color[], imageFile?: File, imageUrl?: string) => {
    setColors(extractedColors)
    invalidateAnalysis()
    setShowUpload(false)
    
    if (imageFile && imageUrl) {
      setUploadedImage({ file: imageFile, previewUrl: imageUrl })
    }
  }

  const handleReExtract = async () => {
    if (!uploadedImage) return

    setExtracting(true)
    setNotice(null)
    extractionControllerRef.current?.abort()
    const controller = new AbortController()
    extractionControllerRef.current = controller
    const requestId = extractionRequestRef.current + 1
    extractionRequestRef.current = requestId
    try {
      const data = await extractColors(
        uploadedImage.file,
        nColors,
        controller.signal,
      )
      if (requestId !== extractionRequestRef.current) return
      setColors(data.colors)
      invalidateAnalysis()
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Error re-extracting colors:', error)
      setNotice({
        message: errorMessage(error),
        retry: () => void handleReExtract(),
      })
    } finally {
      if (requestId === extractionRequestRef.current) setExtracting(false)
    }
  }

  const handleSkipUpload = () => {
    setShowUpload(false)
    const defaultColors: Color[] = [
      {
        hex: '#667eea',
        rgb: { r: 102, g: 126, b: 234 },
        hsl: { h: 229, s: 75, l: 66 }
      },
      {
        hex: '#764ba2',
        rgb: { r: 118, g: 75, b: 162 },
        hsl: { h: 270, s: 37, l: 46 }
      },
      {
        hex: '#f093fb',
        rgb: { r: 240, g: 147, b: 251 },
        hsl: { h: 294, s: 92, l: 78 }
      }
    ]
    setColors(defaultColors)
    invalidateAnalysis()
  }

  const handleColorChange = (index: number, newColor: Color) => {
    const newColors = [...colors]
    newColors[index] = newColor
    setColors(newColors)
    invalidateAnalysis()
  }

  const handleAddColor = (color?: Color) => {
    if (colors.length >= 10) {
      setNotice({ message: 'A palette can contain at most 10 colors.' })
      return
    }
    const newColor: Color = color || {
      hex: '#808080',
      rgb: { r: 128, g: 128, b: 128 },
      hsl: { h: 0, s: 0, l: 50 }
    }
    setColors([...colors, newColor])
    invalidateAnalysis()
  }

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index))
    invalidateAnalysis()
  }

  const handleAnalyze = async () => {
    if (colors.length < 2) {
      setNotice({ message: 'Add at least two colors, then retry the analysis.' })
      return
    }

    setLoading(true)
    setNotice(null)
    analysisControllerRef.current?.abort()
    const controller = new AbortController()
    analysisControllerRef.current = controller
    const requestId = analysisRequestRef.current + 1
    analysisRequestRef.current = requestId
    try {
      const data = await analyzeColors(colors, controller.signal)
      if (requestId !== analysisRequestRef.current) {
        return
      }
      setAnalysis(data.analysis)
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Error analyzing colors:', error)
      setNotice({
        message: errorMessage(error),
        retry: () => void handleAnalyze(),
      })
    } finally {
      if (requestId === analysisRequestRef.current) setLoading(false)
    }
  }

  const handleReset = () => {
    invalidateAnalysis()
    extractionRequestRef.current += 1
    extractionControllerRef.current?.abort()
    extractionControllerRef.current = null
    setColors([])
    setLoading(false)
    setExtracting(false)
    setShowUpload(true)
    setUploadedImage(null)
    setNotice(null)
  }

  return (
    <div className="app-root">
      <main className="workspace">
        <header className="app-header">
          <div className="brand-lockup">
            <AppMark />
            <div className="brand-copy">
              <h1>ColorCraft</h1>
              <p>Extract, refine, and inspect color relationships.</p>
            </div>
          </div>
          <ThemeControl />
        </header>

        <div className="content-stack">
          {notice && (
            <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
          )}
          {showUpload ? (
            <ImageUpload 
              onColorsExtracted={handleColorsExtracted}
              onSkipUpload={handleSkipUpload}
            />
          ) : (
            <>
              {uploadedImage && (
                <Panel>
                  <SectionHeader
                    title="Source image"
                    description="Adjust the extraction count without uploading the image again."
                    action={<Button variant="quiet" onClick={handleReset}>Change image</Button>}
                  />
                  <div className="panel-stack">
                    <div className="image-stage">
                    <img
                      src={uploadedImage.previewUrl}
                      alt="Uploaded source"
                    />
                    </div>

                    <div className="section-actions">
                      <div className="inline-field">
                        <label htmlFor="reextract-count">
                          Colors
                        </label>
                        <input
                          id="reextract-count"
                          type="range"
                          min="3"
                          max="10"
                          value={nColors}
                          onChange={(e) => setNColors(parseInt(e.target.value))}
                        />
                        <output htmlFor="reextract-count">{nColors}</output>
                      </div>

                      <Button
                        variant="primary"
                        onClick={handleReExtract}
                        disabled={extracting}
                      >
                        {extracting ? 'Extracting…' : 'Re-extract'}
                      </Button>
                    </div>
                  </div>
                </Panel>
              )}

              <Panel>
                <SectionHeader
                  title="Color palette"
                  description="Edit samples directly or add up to ten colors."
                  action={!uploadedImage ? <Button variant="quiet" onClick={handleReset}>Start over</Button> : undefined}
                />
                <ColorPalette
                  colors={colors}
                  onColorChange={handleColorChange}
                  onAddColor={handleAddColor}
                  onRemoveColor={handleRemoveColor}
                  imageUrl={uploadedImage?.previewUrl}
                />

                <div className="section-actions palette-actions">
                  <Button
                    variant="primary"
                    onClick={handleAnalyze}
                    disabled={loading || colors.length < 2}
                  >
                    {loading ? 'Analyzing…' : 'Analyze colors'}
                  </Button>
                </div>
                
                {colors.length < 2 && (
                  <p className="helper-center">
                    Add at least two colors to analyze.
                  </p>
                )}
              </Panel>

              {colors.length > 0 && (
                <ColorSuggestions colors={colors} onAddColor={handleAddColor} />
              )}
            </>
          )}
        </div>

        {analysis && (
          <div className="content-stack analysis-stack">
            <Panel>
              <SectionHeader
                title="Color wheel"
                description="The palette plotted by hue, saturation, and lightness."
              />
              <ColorWheel colors={colors} analysis={analysis} />
            </Panel>

            <AnalysisResults analysis={analysis} colors={colors} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App

