import type { Filter } from '~/features/places/constants/filters.constants'
import { FILTERS } from '~/features/places/constants/filters.constants'

/** Le seul filtre de l'appli, à trois choix (Tout, Où aller, Se garer). */
export function Filters({ active, onChange }: { active: Filter; onChange: (f: Filter) => void }) {
  return (
    // Un groupe nommé : un lecteur d'écran dit « Montrer, groupe » puis « Tout, bouton bascule, activé ».
    <div role="group" aria-label="Montrer" className="flex shrink-0 gap-2">
      {FILTERS.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f)}
          aria-pressed={f.id === active.id}
          className="h-13 flex-1 rounded-full border-2 border-moss text-[19px] font-semibold text-moss aria-pressed:bg-moss aria-pressed:text-white"
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
