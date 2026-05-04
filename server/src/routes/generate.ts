import { Router, Request, Response } from 'express'
import { getOpenAI, loadDesignSystem, loadSkill, resolveImgGenTags, injectClickTracker, DIRECTIONS } from '../lib/openai'
import { saveArtifact } from '../lib/supabase'

export const generateRouter = Router()

function buildSystemPrompt(designSystem: string, skill: string, direction: string): string {
  return `You are an expert UI designer and frontend engineer. Generate high-quality, production-ready HTML artifacts.

## Active Design System
${designSystem}

## Active Skill
${skill}

## Direction Seed (apply this aesthetic angle)
${direction}

## Output Requirements
- Return ONLY the complete HTML document (<!DOCTYPE html> to </html>)
- All styles inline in <style> or as inline attributes
- No external JS dependencies (CSS CDN fonts OK)
- Use <img-gen prompt="[descriptive contextual prompt]"> for meaningful images (max 4)
- Generate realistic, contextually appropriate copy — NEVER "Lorem Ipsum"
- Must be visually polished and production-quality

Return the HTML document now. Nothing else.`
}

generateRouter.post('/', async (req: Request, res: Response) => {
  const { brief, design_system_id = 'linear', skill_id = 'web-prototype', resolve_images = true } = req.body

  if (!brief?.audience || !brief?.surface) {
    return res.status(400).json({ error: 'brief.audience and brief.surface are required' })
  }

  const userPrompt = `Design a ${brief.surface} for: ${brief.audience}.
Tone: ${brief.tone || 'professional'}
Scale: ${brief.scale || 'single screen/page'}
Constraints: ${brief.constraints || 'none'}
Additional context: ${brief.extra || 'none'}`

  let dsContent: string, skillContent: string
  try {
    dsContent = loadDesignSystem(design_system_id)
    skillContent = loadSkill(skill_id)
  } catch (e) {
    return res.status(400).json({ error: (e as Error).message })
  }

  try {
    // Generate 3 variants in parallel
    const variantPromises = DIRECTIONS.map(async (dir) => {
      const sysPrompt = buildSystemPrompt(dsContent, skillContent, dir.seed)
      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      })
      let html = completion.choices[0].message.content ?? ''

      // Strip markdown fences if model wraps in ```html
      html = html.replace(/^```html?\n?/, '').replace(/\n?```$/, '').trim()

      if (resolve_images) {
        html = await resolveImgGenTags(html)
      }

      html = injectClickTracker(html)

      return { id: dir.id, direction: dir.id, seed: dir.seed, html }
    })

    const variants = await Promise.all(variantPromises)

    const artifactId = await saveArtifact({
      brief,
      design_system: design_system_id,
      variants,
    }).catch(() => null) // non-blocking — don't fail the request if Supabase is down

    res.json({ artifact_id: artifactId, variants })
  } catch (e) {
    console.error('Generation error:', e)
    res.status(500).json({ error: (e as Error).message })
  }
})
