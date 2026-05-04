import { Router, Request, Response } from 'express'
import { getOpenAI, resolveImgGenTags, injectClickTracker, loadDesignSystem } from '../lib/openai'
import { saveArtifact, updateChosen } from '../lib/supabase'

export const refineRouter = Router()

// Full re-render with a general refinement instruction
refineRouter.post('/', async (req: Request, res: Response) => {
  const { html, instruction, design_system_id = 'linear', parent_id, brief } = req.body

  if (!html || !instruction) {
    return res.status(400).json({ error: 'html and instruction are required' })
  }

  let dsContent: string
  try { dsContent = loadDesignSystem(design_system_id) } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }

  const prompt = `You are an expert UI designer. You have an existing HTML artifact. Apply the user's refinement instruction while preserving the overall design system and layout intent.

## Active Design System
${dsContent}

## Current HTML
${html.slice(0, 12000)}

## Refinement Instruction
${instruction}

Return ONLY the updated complete HTML document. No commentary.`

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    })
    let refined = completion.choices[0].message.content ?? ''
    refined = refined.replace(/^```html?\n?/, '').replace(/\n?```$/, '').trim()
    refined = await resolveImgGenTags(refined)
    refined = injectClickTracker(refined)

    // Save as a child of parent_id
    const newId = await saveArtifact({
      brief: brief ?? {},
      design_system: design_system_id,
      variants: [{ id: 'refined', direction: 'refined', html: refined }],
      chosen_variant_id: 'refined',
      final_html: refined,
      parent_id,
    }).catch(() => null)

    res.json({ artifact_id: newId, html: refined })
  } catch (e) {
    console.error('Refine error:', e)
    res.status(500).json({ error: (e as Error).message })
  }
})

// Targeted element patch (direct manipulation)
refineRouter.post('/element', async (req: Request, res: Response) => {
  const { html, selector, instruction, design_system_id = 'linear' } = req.body

  if (!html || !selector || !instruction) {
    return res.status(400).json({ error: 'html, selector, instruction are required' })
  }

  let dsContent: string
  try { dsContent = loadDesignSystem(design_system_id) } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }

  const prompt = `You are an expert UI designer editing a specific element in an HTML artifact.

## Target Element (CSS-like selector path)
${selector}

## Instruction
${instruction}

## Active Design System
${dsContent}

## Current HTML
${html.slice(0, 12000)}

Apply the instruction to the targeted element only. Preserve everything else exactly.
Return ONLY the complete updated HTML document.`

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })
    let patched = completion.choices[0].message.content ?? ''
    patched = patched.replace(/^```html?\n?/, '').replace(/\n?```$/, '').trim()
    patched = await resolveImgGenTags(patched)
    patched = injectClickTracker(patched)

    res.json({ html: patched })
  } catch (e) {
    console.error('Element refine error:', e)
    res.status(500).json({ error: (e as Error).message })
  }
})

// Mark a variant as chosen
refineRouter.post('/choose', async (req: Request, res: Response) => {
  const { artifact_id, variant_id, html } = req.body
  if (artifact_id) await updateChosen(artifact_id, variant_id, html).catch(() => null)
  res.json({ ok: true })
})
