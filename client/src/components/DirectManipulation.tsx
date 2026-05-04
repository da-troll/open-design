import { useState } from 'react'
import { Send, X, Pencil } from 'lucide-react'
import type { ClickEvent } from '../types'

interface Props {
  clickEvent: ClickEvent | null
  onSubmit: (instruction: string) => Promise<void>
  onDismiss: () => void
  loading: boolean
}

export function DirectManipulation({ clickEvent, onSubmit, onDismiss, loading }: Props) {
  const [instruction, setInstruction] = useState('')

  if (!clickEvent) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instruction.trim()) return
    await onSubmit(instruction)
    setInstruction('')
  }

  return (
    <div className="absolute z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3 w-72"
      style={{
        bottom: '1rem',
        right: '1rem',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs text-violet-400">
          <Pencil className="w-3 h-3" />
          <span className="font-medium">Edit element</span>
        </div>
        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="text-xs text-gray-500 mb-2 truncate font-mono bg-gray-800 px-2 py-1 rounded">
        {clickEvent.selector}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input text-sm flex-1 py-1.5"
          placeholder="Make this darker, change to outline…"
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          autoFocus
          disabled={loading}
        />
        <button type="submit" className="btn-primary py-1.5 px-3 flex-shrink-0" disabled={loading || !instruction.trim()}>
          {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  )
}
