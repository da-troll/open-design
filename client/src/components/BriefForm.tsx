import { useState } from 'react'
import { Sparkles, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { VoiceRecorder } from './VoiceRecorder'
import { extractDesignSystem } from '../lib/api'
import type { Brief, DesignSystemId, SkillId } from '../types'
import { DESIGN_SYSTEMS, SKILLS, DS_LABELS } from '../types'

interface Props {
  onSubmit: (brief: Brief, dsId: DesignSystemId | 'custom', skillId: SkillId, customDs?: string) => void
  loading: boolean
}

const DEFAULT: Brief = { surface: 'web-prototype', audience: '', tone: 'professional', scale: 'single page', constraints: '', extra: '' }

export function BriefForm({ onSubmit, loading }: Props) {
  const [brief, setBrief] = useState<Brief>(DEFAULT)
  const [dsId, setDsId] = useState<DesignSystemId | 'custom'>('linear')
  const [skillId, setSkillId] = useState<SkillId>('web-prototype')
  const [urlInput, setUrlInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [customDs, setCustomDs] = useState<string | undefined>()
  const [customDsTitle, setCustomDsTitle] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief(p => ({ ...p, [k]: v }))

  const handleVoice = (filled: Brief, _transcript: string) => {
    setBrief(p => ({ ...p, ...filled }))
    if (filled.surface) setSkillId(filled.surface as SkillId)
  }

  const handleExtractUrl = async () => {
    if (!urlInput.trim()) return
    setExtracting(true)
    try {
      const res = await extractDesignSystem(urlInput)
      setCustomDs(res.design_system)
      setCustomDsTitle(res.title ?? urlInput)
      setDsId('custom')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brief.audience.trim()) return
    onSubmit(brief, dsId, skillId, customDs)
  }

  const canSubmit = brief.audience.trim().length > 0 && !loading

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-gray-300">Design Brief</h2>
        <VoiceRecorder onResult={handleVoice} />
      </div>

      {/* Surface / Skill */}
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Surface</label>
        <div className="flex gap-2">
          {SKILLS.map(s => (
            <button
              key={s}
              type="button"
              className={`flex-1 py-2 text-xs rounded-lg font-medium border transition-colors ${skillId === s ? 'bg-violet-700 border-violet-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
              onClick={() => { setSkillId(s); set('surface', s) }}
            >
              {s === 'web-prototype' ? 'Web' : s === 'mobile-app' ? 'Mobile' : 'Deck'}
            </button>
          ))}
        </div>
      </div>

      {/* Audience / purpose */}
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">What are you designing? *</label>
        <textarea
          className="input text-sm resize-none"
          rows={2}
          placeholder="e.g. A dashboard for HR teams to track employee onboarding"
          value={brief.audience}
          onChange={e => set('audience', e.target.value)}
          required
        />
      </div>

      {/* Design system */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-gray-400">Design system</label>
          <span className="text-xs text-gray-600">{dsId === 'custom' ? customDsTitle || 'Custom (from URL)' : DS_LABELS[dsId]}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DESIGN_SYSTEMS.map(d => (
            <button
              key={d}
              type="button"
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${dsId === d ? 'bg-violet-700 border-violet-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
              onClick={() => { setDsId(d); setCustomDs(undefined) }}
            >
              {DS_LABELS[d]}
            </button>
          ))}
          {customDs && (
            <button
              type="button"
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${dsId === 'custom' ? 'bg-violet-700 border-violet-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
              onClick={() => setDsId('custom')}
            >
              {customDsTitle || 'Custom'}
            </button>
          )}
        </div>

        {/* URL → DS extraction */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className="input text-xs py-1.5"
            placeholder="Or paste a URL to extract its design system…"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-shrink-0"
            onClick={handleExtractUrl}
            disabled={extracting || !urlInput.trim()}
          >
            <Globe className="w-3.5 h-3.5" />
            {extracting ? '…' : 'Extract'}
          </button>
        </div>
      </div>

      {/* Advanced */}
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Advanced
      </button>
      {showAdvanced && (
        <div className="space-y-3 border-t border-gray-800 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tone</label>
              <input className="input text-sm" value={brief.tone} onChange={e => set('tone', e.target.value)} placeholder="professional" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Scale</label>
              <input className="input text-sm" value={brief.scale} onChange={e => set('scale', e.target.value)} placeholder="single page" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Constraints</label>
            <input className="input text-sm" value={brief.constraints ?? ''} onChange={e => set('constraints', e.target.value)} placeholder="e.g. no dark mode, mobile-first" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Extra context</label>
            <textarea className="input text-sm resize-none" rows={2} value={brief.extra ?? ''} onChange={e => set('extra', e.target.value)} placeholder="Additional notes for the AI" />
          </div>
        </div>
      )}

      <button type="submit" disabled={!canSubmit} className="btn-primary w-full flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4" />
        {loading ? 'Generating 3 variants…' : 'Generate'}
      </button>
    </form>
  )
}
