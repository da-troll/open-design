import { Router, Request, Response } from 'express'
import { getOpenAI } from '../lib/openai'

export const extractDsRouter = Router()

// In-memory cache for extracted design systems (URL → DESIGN.md)
const dsCache = new Map<string, string>()

extractDsRouter.post('/', async (req: Request, res: Response) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'url is required' })

  // Normalize URL
  let normalizedUrl: string
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    normalizedUrl = u.href
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  if (dsCache.has(normalizedUrl)) {
    return res.json({ design_system: dsCache.get(normalizedUrl), cached: true })
  }

  try {
    // Fetch the page HTML server-side (no CORS restriction)
    const fetchRes = await fetch(normalizedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DesignExtractor/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await fetchRes.text()

    // Extract inline styles, color references, font references via simple regex
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? []
    const inlineCss = styleMatches.map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n').slice(0, 8000)

    // Extract meta colors from common attributes
    const themeColor = html.match(/name="theme-color"\s+content="([^"]+)"/i)?.[1] ?? ''
    const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1] ?? ''
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? normalizedUrl

    // Count unique hex colors in extracted CSS as a quality signal
    const hexColors = [...new Set((inlineCss.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []))].slice(0, 20)
    if (hexColors.length < 3) {
      console.warn(`[extract-ds] sparse CSS for ${normalizedUrl}: only ${hexColors.length} hex colors found — LLM will infer heavily. Consider CSS-paste fallback.`)
    } else {
      console.log(`[extract-ds] ${hexColors.length} hex colors extracted from ${normalizedUrl}`)
    }

    // Feed to gpt-4o-mini to produce a DESIGN.md
    const prompt = `Analyze this website's design language and produce a structured DESIGN.md file.

Website: ${normalizedUrl}
Page title: ${title}

CSS extracted from the page:
${inlineCss || '(no inline CSS found — infer from the site URL and title)'}
Hex colors found: ${hexColors.length > 0 ? hexColors.join(', ') : '(none — infer from brand context)'}

Theme color meta tag: ${themeColor || '(none)'}

Based on what you can extract, produce a DESIGN.md with these sections:
# [Brand Name] Design System (extracted from ${new URL(normalizedUrl).hostname})
## Brand (2 sentences on brand voice/feeling)
## Colors (primary, secondary, accent, background, text — with hex values if extractable, otherwise inferred)
## Typography (font families, weights, sizes)
## Spacing (spacing scale)
## Component Patterns (buttons, cards, inputs — describe their style)
## Voice (1 sentence on copy tone)

Be specific and practical. This will be used as a design system for AI generation.`

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })
    const designMd = completion.choices[0].message.content ?? ''

    dsCache.set(normalizedUrl, designMd)
    res.json({ design_system: designMd, cached: false, title, low_color_signal: hexColors.length < 3 })
  } catch (e) {
    console.error('Extract DS error:', e)
    res.status(500).json({ error: (e as Error).message })
  }
})
