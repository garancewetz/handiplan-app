import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Icone } from '~/components/icone'
import type { ICONES } from '~/constants/icones.constants'

type Props = {
  titre: string
  detail?: string
  /** un lieu (son genre, en vert) ou un repère (étoile, horloge, en gris) ; sans icône pour une adresse trouvée */
  icone?: keyof typeof ICONES
  estLieu?: boolean
  onChoisir: () => void
}

/** Une proposition du panneau de recherche : une grande ligne, facile à toucher d'un pouce. */
export function LigneProposition({ titre, detail, icone, estLieu = false, onChoisir }: Props) {
  return (
    <li>
      <button onClick={onChoisir} className="flex min-h-18 w-full items-center gap-3.5 rounded-[22px] bg-white px-4 py-3 text-left">
        {icone && <Icone nom={icone} className={clsx('size-7 shrink-0', estLieu ? 'text-mousse' : 'text-doux')} />}
        <span className="min-w-0">
          <b className="line-clamp-2 block text-xl leading-6 font-semibold">{titre}</b>
          {detail && <span className="line-clamp-2 block text-lg leading-6 text-doux">{detail}</span>}
        </span>
      </button>
    </li>
  )
}

/** Un groupe de propositions avec son titre (« Souvent », « Récemment ») : un lecteur d'écran l'annonce comme tel. */
export function GroupePropositions({ id, titre, children }: { id: string; titre: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="px-2 pt-1 text-lg font-semibold text-doux">{titre}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}
