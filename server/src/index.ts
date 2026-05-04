import express from 'express'
import cors from 'cors'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { generateRouter } from './routes/generate'
import { refineRouter } from './routes/refine'
import { transcribeRouter } from './routes/transcribe'
import { extractDsRouter } from './routes/extract-ds'
import { historyRouter } from './routes/history'

dotenv.config({ path: path.join(__dirname, '../../../.env') })

const app = express()
const PORT = Number(process.env.PORT) || 3477

app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/generate', generateRouter)
app.use('/api/refine', refineRouter)
app.use('/api/transcribe', transcribeRouter)
app.use('/api/extract-ds', extractDsRouter)
app.use('/api/history', historyRouter)

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// Serve React frontend in production
const clientDist = path.join(__dirname, '../../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`open-design server on 0.0.0.0:${PORT}`)
})
