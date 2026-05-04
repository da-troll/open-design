import { useState, useRef } from 'react'
import { Mic, Square, Loader } from 'lucide-react'
import { transcribeAudio } from '../lib/api'
import type { Brief } from '../types'

interface Props {
  onResult: (brief: Brief, transcript: string) => void
}

export function VoiceRecorder({ onResult }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const [error, setError] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setState('processing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const result = await transcribeAudio(blob)
          onResult(result.brief, result.transcript)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Transcription failed')
        } finally {
          setState('idle')
        }
      }
      recorder.start()
      mediaRef.current = recorder
      setState('recording')
      // Auto-stop after 60s
      timerRef.current = setTimeout(stop, 60000)
    } catch (e) {
      setError('Microphone access denied')
      setState('idle')
    }
  }

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    mediaRef.current?.stop()
  }

  return (
    <div className="flex items-center gap-2">
      {state === 'idle' && (
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-gray-200 text-sm transition-colors"
          onClick={start}
        >
          <Mic className="w-4 h-4" />
          Describe by voice
        </button>
      )}
      {state === 'recording' && (
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900 border border-red-700 text-red-300 text-sm animate-pulse"
          onClick={stop}
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          Stop recording
        </button>
      )}
      {state === 'processing' && (
        <span className="flex items-center gap-2 text-sm text-gray-400 px-3 py-2">
          <Loader className="w-3.5 h-3.5 animate-spin" />
          Transcribing…
        </span>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
