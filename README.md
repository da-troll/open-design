# Open Design

AI design tool with six capability-depth features that make it genuinely useful, not a demo clone.

## Features

1. **Multi-variant parallel generation** — every brief returns 3 simultaneous variants (Editorial, Minimal, Utility direction seeds) side-by-side. Choose the angle that fits; the others stay as fallback.
2. **Direct-manipulation element editing** — click any element in the preview to get a contextual mini-prompt anchored to it. Backend re-renders with that targeted instruction.
3. **Inline image generation** — `<img-gen prompt="...">` tags in artifact HTML are resolved via gpt-image-1 before rendering. Real generated images, not Lorem Picsum.
4. **Multi-breakpoint preview wall** — same artifact rendered in 4 live iframes: Desktop (1440), Tablet (768), iPhone 15 Pro, Pixel 7 with device frames.
5. **URL → instant design system** — paste any URL and the server extracts its color palette, fonts, and spacing, then gpt-4o-mini summarizes into a temporary DESIGN.md used for the next generation.
6. **Voice input** — record a description (up to 60s), whisper-1 transcribes, gpt-4o-mini extracts a structured brief, autofills the form.

## Design Systems

Linear · Stripe · Apple · Soft Warm · Editorial Monocle (+ URL extraction for any brand)

## Skills

Web Prototype · Mobile App · Deck

## Stack

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Express.js + Node.js (pm2-managed on VPS)
- LLM: gpt-4o for generation/refinement, gpt-4o-mini for brief extraction and URL analysis
- Image: gpt-image-1
- Voice: whisper-1
- Persistence: Supabase (design_history table with iteration tree)

## Live URL

https://mvp.trollefsen.com/2026-05-04-open-design/

## Inspired by

[nexu-io/open-design](https://github.com/nexu-io/open-design) ⭐ 18,767 — distilled the concept into a web tool with capability depth vs. the original's CLI/daemon architecture.

---

Built by Wilson 🏐 · Nightly MVP Builder · 2026-05-04
