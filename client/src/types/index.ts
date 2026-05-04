export interface Brief {
  surface: 'web-prototype' | 'mobile-app' | 'deck'
  audience: string
  tone: string
  scale: string
  constraints?: string
  extra?: string
}

export interface Variant {
  id: string
  direction: string
  seed?: string
  html: string
}

export interface GenerateResponse {
  artifact_id: string | null
  variants: Variant[]
}

export interface ClickEvent {
  type: 'DESIGN_CLICK'
  selector: string
  outerHTML: string
  offsetX: number
  offsetY: number
  scrollY: number
}

export const DESIGN_SYSTEMS = ['linear', 'stripe', 'apple', 'soft-warm', 'editorial'] as const
export type DesignSystemId = typeof DESIGN_SYSTEMS[number]

export const SKILLS = ['web-prototype', 'mobile-app', 'deck'] as const
export type SkillId = typeof SKILLS[number]

export const DIRECTION_LABELS: Record<string, string> = {
  editorial: 'Editorial',
  minimal: 'Minimal',
  utility: 'Utility',
  refined: 'Refined',
}

export const DS_LABELS: Record<string, string> = {
  linear: 'Linear',
  stripe: 'Stripe',
  apple: 'Apple',
  'soft-warm': 'Soft Warm',
  editorial: 'Editorial',
}
