import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// Lazy clients — initialized on first use so dotenv has loaded
let _openai: OpenAI | null = null
let _openaiImage: OpenAI | null = null

export function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}
export function getOpenAIImage() {
  if (!_openaiImage) _openaiImage = new OpenAI({ apiKey: process.env.OPENAI_IMAGE_API_KEY || process.env.OPENAI_API_KEY })
  return _openaiImage
}
// Convenience aliases — only call after dotenv has loaded
export function getOpenAIClient() { return getOpenAI() }
export function getOpenAIImageClient() { return getOpenAIImage() }

// In-process image cache — keyed by SHA256(prompt)
const imageCache = new Map<string, string>()

export function cacheKey(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16)
}

export async function generateImage(prompt: string): Promise<string> {
  const key = cacheKey(prompt)
  if (imageCache.has(key)) return imageCache.get(key)!

  const res = await getOpenAIImage().images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1024x1024',
    quality: 'low',
    n: 1,
  })

  const b64 = res.data?.[0]?.b64_json ?? ''
  if (!b64) throw new Error('No image data returned')
  const dataUrl = `data:image/png;base64,${b64}`
  imageCache.set(key, dataUrl)
  return dataUrl
}

// Resolve <img-gen prompt="..."> tags in artifact HTML (max 4 per artifact)
// gpt-image-1 low quality = ~$0.011/image → 4 images = ~$0.044 per artifact
export async function resolveImgGenTags(html: string): Promise<string> {
  const IMG_GEN_RE = /<img-gen\s+prompt="([^"]+)"[^>]*\/?>/gi
  const matches = [...html.matchAll(IMG_GEN_RE)].slice(0, 4)
  if (!matches.length) return html

  const t0 = Date.now()
  const resolved = await Promise.allSettled(
    matches.map(m => generateImage(m[1]))
  )
  const imgCount = resolved.filter(r => r.status === 'fulfilled').length
  const estCost = (imgCount * 0.011).toFixed(3)
  console.log(`[img-gen] ${imgCount}/${matches.length} resolved in ${Date.now() - t0}ms (est $${estCost})`)

  let result = html
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const res = resolved[i]
    if (res.status === 'fulfilled') {
      result = result.replace(
        match[0],
        `<img src="${res.value}" alt="${match[1]}" style="max-width:100%;height:auto;display:block;">`
      )
    } else {
      // Replace with a neutral placeholder div on failure
      result = result.replace(
        match[0],
        `<div style="background:#e5e7eb;width:100%;height:200px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px;">[image: ${match[1].slice(0, 40)}]</div>`
      )
    }
  }
  return result
}

// Inject click-tracking script into artifact HTML for direct manipulation
export function injectClickTracker(html: string): string {
  // Use '*' as target origin since srcdoc iframes have null origin;
  // parent listener validates by checking message.type === 'DESIGN_CLICK'.
  const script = `<script>
(function(){
  document.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    var el = e.target;
    var path = [];
    var node = el;
    while(node && node !== document.body){
      var selector = node.tagName.toLowerCase();
      if(node.id) selector += '#'+node.id;
      else if(node.className && typeof node.className === 'string'){
        selector += '.'+node.className.trim().split(/\\s+/).slice(0,2).join('.');
      }
      path.unshift(selector);
      node = node.parentElement;
    }
    window.parent.postMessage({
      type:'DESIGN_CLICK',
      selector: path.join(' > '),
      outerHTML: el.outerHTML.slice(0,500),
      offsetX: e.clientX,
      offsetY: e.clientY,
      scrollY: window.scrollY,
    }, '*');
  }, true);
})();
</script>`
  return html.replace('</body>', script + '</body>')
}

export function loadDesignSystem(name: string): string {
  const dsPath = path.join(__dirname, '../data/design-systems', `${name}.md`)
  if (!fs.existsSync(dsPath)) throw new Error(`Design system not found: ${name}`)
  return fs.readFileSync(dsPath, 'utf8')
}

export function loadSkill(name: string): string {
  const skillPath = path.join(__dirname, '../data/skills', `${name}.md`)
  if (!fs.existsSync(skillPath)) throw new Error(`Skill not found: ${name}`)
  return fs.readFileSync(skillPath, 'utf8')
}

export const DESIGN_SYSTEMS = ['linear', 'stripe', 'apple', 'soft-warm', 'editorial']
export const SKILLS = ['web-prototype', 'mobile-app', 'deck']

export const DIRECTIONS = [
  { id: 'editorial', seed: 'editorial monocle — high contrast, serif typography, magazine-quality layout' },
  { id: 'minimal', seed: 'modern minimal — lots of whitespace, clean geometry, confident simplicity' },
  { id: 'utility', seed: 'tech utility — dense, information-rich, functional over decorative' },
]
