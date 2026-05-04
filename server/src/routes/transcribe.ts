import { Router, Request, Response } from 'express'
import multer from 'multer'
import { getOpenAI } from '../lib/openai'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export const transcribeRouter = Router()
const upload = multer({ dest: os.tmpdir() })

// POST /api/transcribe — voice → transcript → structured brief
transcribeRouter.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' })

  const tmpPath = req.file.path
  // Rename to have correct extension for Whisper
  const ext = req.file.mimetype.includes('webm') ? 'webm' : 'mp4'
  const renamedPath = tmpPath + '.' + ext
  fs.renameSync(tmpPath, renamedPath)

  try {
    // Step 1: Transcribe
    const transcription = await getOpenAI().audio.transcriptions.create({
      file: fs.createReadStream(renamedPath) as any,
      model: 'whisper-1',
      language: 'en',
    })
    const transcript = transcription.text

    // Step 2: Extract structured brief from transcript
    const extraction = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Extract a structured design brief from this voice transcript. The user is describing something they want designed.

Transcript: "${transcript}"

Return ONLY valid JSON with these fields:
{
  "surface": "web-prototype" | "mobile-app" | "deck",
  "audience": "who is this for (string)",
  "tone": "tone/mood (string)",
  "scale": "scope/scale (string)",
  "constraints": "any constraints mentioned (string or null)",
  "extra": "any other relevant context (string or null)"
}`
      }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    const brief = JSON.parse(extraction.choices[0].message.content ?? '{}')
    res.json({ transcript, brief })
  } catch (e) {
    console.error('Transcribe error:', e)
    res.status(500).json({ error: (e as Error).message })
  } finally {
    fs.unlink(renamedPath, () => {})
  }
})
