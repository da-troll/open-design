import { Router, Request, Response } from 'express'
import { getHistory, getArtifact } from '../lib/supabase'
import { DESIGN_SYSTEMS, SKILLS } from '../lib/openai'

export const historyRouter = Router()

historyRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await getHistory(20)
    res.json(items)
  } catch {
    res.json([])
  }
})

historyRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await getArtifact(req.params.id)
    res.json(item)
  } catch {
    res.status(404).json({ error: 'Not found' })
  }
})

historyRouter.get('/meta/config', (_req: Request, res: Response) => {
  res.json({ design_systems: DESIGN_SYSTEMS, skills: SKILLS })
})
