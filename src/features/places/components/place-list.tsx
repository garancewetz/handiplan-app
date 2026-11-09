import clsx from 'clsx'
import { Icon } from '~/components/icon'
import type { State, Place } from '~/types/place.types'
import { formatDistance } from '~/utils/format.utils'

// Les mots de la légende : « est-ce galère d'y aller ? » (docs/decisions/interface, D18).
const LABEL: Record<State, string> = { ok: 'Facile, toilettes adaptées', check: 'Attention', unknown: 'Pas d’info', no: 'Difficile', parking: 'Place handicapée' }

const ICON_STYLE: Record<State, string> = {
  ok: 'bg-moss-light text-moss',
  check: 'bg-amber-light text-amber-dark',
  unknown: 'border-2 border-dashed border-grey bg-white text-grey',
  no: 'bg-difficult-light text-difficult',
  parking: 'bg-parking text-white',
}
// L'état se lit en mots, avec un symbole : jamais la couleur seule.
const STATUS: Record<State, { symbol: string; dot: string; text: string }> = {
  ok: { symbol: '✓', dot: 'bg-moss', text: 'text-moss' },
  check: { symbol: '!', dot: 'bg-amber', text: 'text-amber-dark' },
  unknown: { symbol: '?', dot: 'bg-grey', text: 'text-grey' },
  no: { symbol: '✕', dot: 'bg-difficult', text: 'text-difficult' },
  parking: { symbol: 'P', dot: 'bg-parking', text: 'text-parking' },
}

// Après les plus faciles : difficiles et sans info ensemble, du plus proche au plus loin, sous un seul titre.
const AT_BOTTOM: State[] = ['no', 'unknown']

export function PlaceList({ places, onChoose }: { places: Place[]; onChoose: (p: Place) => void }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {places.map((p, i) => (
        <li key={p.id}>
          {AT_BOTTOM.includes(p.state) && !AT_BOTTOM.includes(places[i - 1]?.state) && (
            <h3 className="px-2 pt-3 pb-2.5 text-lg font-semibold">Difficiles ou sans info, par distance</h3>
          )}
          <button
            onClick={() => onChoose(p)}
            className="flex w-full flex-col gap-2.5 rounded-[22px] bg-white p-3.5 text-left"
          >
            {/* L'icône, puis le nom avec la distance dessous : le nom a toute la largeur et se coupe rarement. */}
            <span className="flex items-center gap-3.5">
              <span aria-hidden className={clsx('flex size-13 shrink-0 items-center justify-center rounded-[18px]', ICON_STYLE[p.state])}>
                <Icon name={p.type} className="size-8" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <b className="line-clamp-2 text-[22px] leading-[27px] font-semibold">{p.name}</b>
                <span className="text-xl leading-7 text-muted"><span className="sr-only">à </span>{formatDistance(p.meters)}</span>
              </span>
            </span>
            {/* L'état dessous, sur toute la largeur de la carte : « Facile, toilettes adaptées » tient sur une ligne. */}
            {/* Une place s'appelle déjà « Place handicapée » : la redire n'apprendrait rien. */}
            {p.state !== 'parking' && (
              <span className={clsx('flex items-center gap-2 text-lg font-semibold', STATUS[p.state].text)}>
                <span aria-hidden className={clsx('flex size-6.5 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white', STATUS[p.state].dot)}>
                  {STATUS[p.state].symbol}
                </span>
                {LABEL[p.state]}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
