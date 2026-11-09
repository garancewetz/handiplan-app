import type { ComponentProps } from 'react'
import { Icon } from '~/components/icon'
import { Search } from '~/features/itinerary/components/search'
import { Filters } from '~/features/places/components/filters'

type Props = {
  filters: ComponentProps<typeof Filters>
  search: ComponentProps<typeof Search>
  /** absent tant que la position est inconnue */
  onMyPosition?: () => void
}

/**
 * La barre du bas, sous le pouce : le filtre, la recherche et « Ma position », tout ce qui se touche
 * souvent (docs/decisions/interface, D16).
 */
export function ThumbBar({ filters, search, onMyPosition }: Props) {
  return (
    <nav aria-label="Recherche et filtres" className="relative z-[950] flex flex-col gap-2.5 rounded-t-[28px] bg-moss-light px-4 pt-3 pb-[max(env(safe-area-inset-bottom),14px)] lg:col-start-1 lg:row-start-2">
      <Filters {...filters} />
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Search {...search} />
        </div>
        {onMyPosition && (
          // L'icône « ma position » de Google Maps et Waze : seule, dans un rond, comme là-bas ; le
          // lecteur d'écran dit « Ma position » (docs/decisions/interface, D22).
          <button
            onClick={onMyPosition}
            aria-label="Ma position"
            title="Ma position"
            className="flex size-15 shrink-0 items-center justify-center rounded-full bg-white text-moss"
          >
            <Icon name="position" className="size-8" />
          </button>
        )}
      </div>
    </nav>
  )
}
