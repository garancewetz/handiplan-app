import type { Filtre } from '~/features/lieux/constants/filtres.constants'
import { FILTRES } from '~/features/lieux/constants/filtres.constants'

/** Le seul filtre de l'appli, à trois choix (Tout, Où aller, Se garer). */
export function Filtres({ actif, onChange }: { actif: Filtre; onChange: (f: Filtre) => void }) {
  return (
    // Un groupe nommé : un lecteur d'écran dit « Montrer, groupe » puis « Tout, bouton bascule, activé ».
    <div role="group" aria-label="Montrer" className="flex shrink-0 gap-2">
      {FILTRES.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f)}
          aria-pressed={f.id === actif.id}
          className="h-13 flex-1 rounded-full border-2 border-mousse text-[19px] font-semibold text-mousse aria-pressed:bg-mousse aria-pressed:text-white"
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
