import { useState, useCallback } from 'react'
import { Layers, History, ChevronLeft, Wand2, RefreshCw } from 'lucide-react'
import { BriefForm } from './components/BriefForm'
import { VariantPanel } from './components/VariantPanel'
import { BreakpointWall } from './components/BreakpointWall'
import { DirectManipulation } from './components/DirectManipulation'
import { generate, refine, refineElement } from './lib/api'
import type { Brief, Variant, DesignSystemId, SkillId, ClickEvent } from './types'

type View = 'brief' | 'variants' | 'canvas'

export default function App() {
  const [view, setView] = useState<View>('brief')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // State
  const [variants, setVariants] = useState<Variant[]>([])
  const [chosenVariant, setChosenVariant] = useState<Variant | null>(null)
  const [currentHtml, setCurrentHtml] = useState('')
  const [artifactId, setArtifactId] = useState<string | null>(null)
  const [activeDsId, setActiveDsId] = useState<DesignSystemId | 'custom'>('linear')
  const [customDs, setCustomDs] = useState<string | undefined>()
  const [currentBrief, setCurrentBrief] = useState<Brief | null>(null)

  // Direct manipulation
  const [clickEvent, setClickEvent] = useState<ClickEvent | null>(null)
  const [patchLoading, setPatchLoading] = useState(false)

  // Refinement
  const [refineInstruction, setRefineInstruction] = useState('')
  const [refining, setRefining] = useState(false)

  const [focusBreakpoint, setFocusBreakpoint] = useState('desktop')

  const handleGenerate = async (brief: Brief, dsId: DesignSystemId | 'custom', skillId: SkillId, ds?: string) => {
    setLoading(true)
    setError('')
    setActiveDsId(dsId)
    setCustomDs(ds)
    setCurrentBrief(brief)
    try {
      const result = await generate(brief, dsId === 'custom' ? 'custom' : dsId, skillId)
      setVariants(result.variants)
      setArtifactId(result.artifact_id)
      setChosenVariant(null)
      setCurrentHtml('')
      setView('variants')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChooseVariant = (v: Variant) => {
    setChosenVariant(v)
    setCurrentHtml(v.html)
    setView('canvas')
  }

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refineInstruction.trim() || !currentHtml) return
    setRefining(true)
    try {
      const res = await refine(currentHtml, refineInstruction, activeDsId === 'custom' ? 'linear' : activeDsId, artifactId, currentBrief ?? undefined)
      setCurrentHtml(res.html)
      if (res.artifact_id) setArtifactId(res.artifact_id)
      setRefineInstruction('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refinement failed')
    } finally {
      setRefining(false)
    }
  }

  const handleElementClick = useCallback((event: ClickEvent) => {
    setClickEvent(event)
  }, [])

  const handleElementPatch = async (instruction: string) => {
    if (!currentHtml || !clickEvent) return
    setPatchLoading(true)
    try {
      const res = await refineElement(currentHtml, clickEvent.selector, instruction, activeDsId === 'custom' ? 'linear' : activeDsId)
      setCurrentHtml(res.html)
      setClickEvent(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Patch failed')
    } finally {
      setPatchLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-12 border-b border-gray-800 flex items-center px-4 gap-3">
        {view !== 'brief' && (
          <button
            className="text-gray-500 hover:text-gray-200 transition-colors"
            onClick={() => setView(view === 'canvas' ? 'variants' : 'brief')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-violet-700 rounded flex items-center justify-center">
            <Wand2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-white">Open Design</span>
        </div>

        <div className="flex-1" />

        {view === 'canvas' && (
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost flex items-center gap-1.5 text-xs"
              onClick={() => setView('variants')}
            >
              <Layers className="w-3.5 h-3.5" />
              Variants
            </button>
            <button
              className="btn-ghost flex items-center gap-1.5 text-xs"
              onClick={() => setView('brief')}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New brief
            </button>
          </div>
        )}

        {view === 'variants' && variants.length > 0 && (
          <p className="text-xs text-gray-500">Click a variant to enter the canvas</p>
        )}
      </header>

      {/* Error bar */}
      {error && (
        <div className="flex-shrink-0 bg-red-950 border-b border-red-800 px-4 py-2 text-sm text-red-300 flex items-center justify-between">
          {error}
          <button className="text-red-400 hover:text-red-200" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">

        {/* BRIEF view */}
        {view === 'brief' && (
          <div className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">What are you designing?</h1>
                <p className="text-gray-400 text-sm">Describe your brief, pick a design system, and get 3 parallel variants to choose from.</p>
              </div>
              <BriefForm onSubmit={handleGenerate} loading={loading} />
              {loading && (
                <div className="mt-4 text-center text-sm text-gray-400 animate-pulse">
                  Generating 3 variants in parallel — this takes ~20s…
                </div>
              )}
            </div>
          </div>
        )}

        {/* VARIANTS view */}
        {view === 'variants' && (
          <div className="flex-1 overflow-hidden p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">Choose a variant to refine</span>
              <span className="text-xs text-gray-500">— or go back to generate a new brief</span>
            </div>
            <div style={{ height: 'calc(100% - 40px)' }}>
              <VariantPanel variants={variants} chosen={chosenVariant?.id ?? null} onChoose={handleChooseVariant} />
            </div>
          </div>
        )}

        {/* CANVAS view */}
        {view === 'canvas' && currentHtml && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Breakpoint wall */}
            <div className="flex-1 relative overflow-hidden">
              <BreakpointWall
                html={currentHtml}
                onElementClick={handleElementClick}
                focus={focusBreakpoint}
                onFocusChange={setFocusBreakpoint}
              />
              <DirectManipulation
                clickEvent={clickEvent}
                onSubmit={handleElementPatch}
                onDismiss={() => setClickEvent(null)}
                loading={patchLoading}
              />
            </div>

            {/* Refinement bar */}
            <div className="flex-shrink-0 border-t border-gray-800 bg-gray-950 p-3">
              <form onSubmit={handleRefine} className="flex gap-2">
                <input
                  className="input text-sm flex-1"
                  placeholder="Refine the whole design… e.g. 'Make it darker, add a pricing section'"
                  value={refineInstruction}
                  onChange={e => setRefineInstruction(e.target.value)}
                  disabled={refining}
                />
                <button
                  type="submit"
                  className="btn-primary flex-shrink-0 flex items-center gap-1.5 text-sm"
                  disabled={refining || !refineInstruction.trim()}
                >
                  {refining ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {refining ? 'Refining…' : 'Refine'}
                </button>
              </form>
              <p className="text-xs text-gray-600 mt-1.5">
                Or click any element in the preview above to edit it directly
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
