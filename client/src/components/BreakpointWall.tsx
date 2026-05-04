import { useState } from 'react'
import type { ClickEvent } from '../types'

interface Breakpoint {
  id: string
  label: string
  width: number
  scale: number
  device?: 'iphone' | 'pixel'
}

const BREAKPOINTS: Breakpoint[] = [
  { id: 'desktop', label: 'Desktop', width: 1440, scale: 0.55 },
  { id: 'tablet', label: 'Tablet', width: 768, scale: 0.75 },
  { id: 'iphone', label: 'iPhone 15', width: 390, scale: 0.9, device: 'iphone' },
  { id: 'pixel', label: 'Pixel 7', width: 412, scale: 0.9, device: 'pixel' },
]

interface Props {
  html: string
  onElementClick?: (event: ClickEvent) => void
  focus?: string
  onFocusChange?: (id: string) => void
}

function DeviceFrame({ device, width, height, children }: { device?: 'iphone' | 'pixel'; width: number; height: number; children: React.ReactNode }) {
  if (!device) return <>{children}</>

  if (device === 'iphone') {
    return (
      <div className="relative" style={{ width: width + 20, height: height + 40 }}>
        <div
          className="absolute inset-0 rounded-[44px] border-[3px] border-gray-600 bg-gray-900 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
        />
        {/* Dynamic island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full border border-gray-700 z-10" />
        <div className="absolute" style={{ top: 20, left: 10, right: 10, bottom: 20 }}>
          {children}
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-600 rounded-full" />
      </div>
    )
  }

  // Pixel
  return (
    <div className="relative" style={{ width: width + 16, height: height + 32 }}>
      <div className="absolute inset-0 rounded-[32px] border-[3px] border-gray-600 bg-gray-800 pointer-events-none" />
      {/* Camera */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-700 border border-gray-600 z-10" />
      <div className="absolute" style={{ top: 16, left: 8, right: 8, bottom: 16 }}>
        {children}
      </div>
      {/* Power button visual */}
      <div className="absolute right-[-3px] top-1/3 w-1 h-12 bg-gray-600 rounded-r-sm" />
    </div>
  )
}

export function BreakpointWall({ html, onElementClick, focus = 'desktop', onFocusChange }: Props) {
  const [localFocus, setLocalFocus] = useState(focus)
  const activeFocus = onFocusChange ? focus : localFocus
  const setFocus = (id: string) => {
    setLocalFocus(id)
    onFocusChange?.(id)
  }

  // Listen for postMessage clicks from iframes
  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type === 'DESIGN_CLICK') {
      onElementClick?.(e.data as ClickEvent)
    }
  }

  // Attach listener at component level (called once per iframe)
  if (typeof window !== 'undefined') {
    window.onmessage = handleMessage
  }

  const focused = BREAKPOINTS.find(b => b.id === activeFocus)!

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Focus view */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-4">
        <DeviceFrame
          device={focused.device}
          width={Math.round(focused.width * focused.scale)}
          height={Math.round(720 * focused.scale)}
        >
          <iframe
            key={`${activeFocus}-${html.slice(0, 20)}`}
            srcDoc={html}
            sandbox="allow-scripts allow-same-origin"
            className="block rounded-lg"
            style={{
              width: focused.width,
              height: 860,
              border: 'none',
              transform: `scale(${focused.scale})`,
              transformOrigin: 'top left',
            }}
          />
        </DeviceFrame>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto flex-shrink-0">
        {BREAKPOINTS.map(bp => (
          <button
            key={bp.id}
            className={`flex flex-col items-center gap-1.5 flex-shrink-0 group transition-opacity ${activeFocus === bp.id ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
            onClick={() => setFocus(bp.id)}
          >
            <div
              className={`rounded-lg overflow-hidden border-2 transition-colors ${activeFocus === bp.id ? 'border-violet-500' : 'border-gray-700'}`}
              style={{ width: bp.width * 0.12, height: 80 }}
            >
              <iframe
                srcDoc={html}
                sandbox="allow-scripts"
                scrolling="no"
                style={{
                  width: bp.width,
                  height: 640,
                  border: 'none',
                  transform: `scale(${bp.width * 0.12 / bp.width})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}
              />
            </div>
            <span className="text-xs text-gray-400">{bp.label}</span>
            <span className="text-xs text-gray-600">{bp.width}px</span>
          </button>
        ))}
      </div>
    </div>
  )
}
