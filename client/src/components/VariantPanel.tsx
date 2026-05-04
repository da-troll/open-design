import { DIRECTION_LABELS } from '../types'
import type { Variant } from '../types'

interface Props {
  variants: Variant[]
  chosen: string | null
  onChoose: (v: Variant) => void
}

export function VariantPanel({ variants, chosen, onChoose }: Props) {
  if (!variants.length) return null

  const cols = variants.length === 1 ? 'grid-cols-1' :
               variants.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className={`grid ${cols} gap-3 h-full`}>
      {variants.map(v => {
        const isChosen = chosen === v.id
        return (
          <div
            key={v.id}
            className={`flex flex-col rounded-xl border-2 transition-colors overflow-hidden cursor-pointer ${isChosen ? 'border-violet-500' : 'border-gray-700 hover:border-gray-500'}`}
            onClick={() => onChoose(v)}
          >
            {/* Label */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-900 flex-shrink-0">
              <span className={`text-xs font-medium ${isChosen ? 'text-violet-400' : 'text-gray-400'}`}>
                {DIRECTION_LABELS[v.direction] ?? v.direction}
              </span>
              {isChosen && (
                <span className="text-xs bg-violet-700 text-white px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>

            {/* Preview iframe */}
            <div className="flex-1 bg-white overflow-hidden" style={{ minHeight: 400 }}>
              <iframe
                srcDoc={v.html}
                sandbox="allow-scripts allow-same-origin"
                style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
