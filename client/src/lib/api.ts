import type { Brief, GenerateResponse } from '../types'

const BASE = '/api'

export async function generate(
  brief: Brief,
  design_system_id: string,
  skill_id: string
): Promise<GenerateResponse> {
  const res = await fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief, design_system_id, skill_id, resolve_images: true }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Generation failed')
  return res.json()
}

export async function refine(
  html: string,
  instruction: string,
  design_system_id: string,
  parent_id?: string | null,
  brief?: Brief
): Promise<{ artifact_id: string | null; html: string }> {
  const res = await fetch(`${BASE}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, instruction, design_system_id, parent_id, brief }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Refinement failed')
  return res.json()
}

export async function refineElement(
  html: string,
  selector: string,
  instruction: string,
  design_system_id: string
): Promise<{ html: string }> {
  const res = await fetch(`${BASE}/refine/element`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, selector, instruction, design_system_id }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Element patch failed')
  return res.json()
}

export async function transcribeAudio(blob: Blob): Promise<{ transcript: string; brief: Brief }> {
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')
  const res = await fetch(`${BASE}/transcribe`, { method: 'POST', body: form })
  if (!res.ok) throw new Error((await res.json()).error || 'Transcription failed')
  return res.json()
}

export async function extractDesignSystem(url: string): Promise<{ design_system: string; title?: string; cached: boolean }> {
  const res = await fetch(`${BASE}/extract-ds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Extraction failed')
  return res.json()
}
