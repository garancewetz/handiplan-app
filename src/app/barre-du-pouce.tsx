import type { ComponentProps } from 'react'
import { Icone } from '~/components/icone'
import { Recherche } from '~/features/itineraire/components/recherche'
import { Filtres } from '~/features/lieux/components/filtres'

type Props = {
  filtres: ComponentProps<typeof Filtres>
  recherche: ComponentProps<typeof Recherche>
  /** absent tant que la position est inconnue */
  onMaPosition?: () => void
}

/**
 * La barre du bas, sous le pouce : le filtre, la recherche et « Ma position », tout ce qui se touche
 * souvent (docs/decisions/interface, D16).
 */
export function BarreDuPouce({ filtres, recherche, onMaPosition }: Props) {
  return (
    <nav aria-label="Recherche et filtres" className="relative z-[950] flex flex-col gap-2.5 rounded-t-[28px] bg-mousse-clair px-4 pt-3 pb-[max(env(safe-area-inset-bottom),14px)] lg:col-start-1 lg:row-start-2">
      <Filtres {...filtres} />
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Recherche {...recherche} />
        </div>
        {onMaPosition && (
          // L'icône « ma position » de Google Maps et Waze : seule, dans un rond, comme là-bas ; le
          // lecteur d'écran dit « Ma position » (docs/decisions/interface, D22).
          <button
            onClick={onMaPosition}
            aria-label="Ma position"
            title="Ma position"
            className="flex size-15 shrink-0 items-center justify-center rounded-full bg-white text-mousse"
          >
            <Icone nom="position" className="size-8" />
          </button>
        )}
      </div>
    </nav>
  )
}
