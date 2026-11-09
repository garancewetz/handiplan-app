import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Icon } from '~/components/icon'
import type { ICONS } from '~/constants/icons.constants'

type Props = {
  title: string
  detail?: string
  /** un lieu (son genre, en vert) ou un repère (étoile, horloge, en gris) ; sans icône pour une adresse trouvée */
  icon?: keyof typeof ICONS
  isPlace?: boolean
  onChoose: () => void
}

/** Une proposition du panneau de recherche : une grande ligne, facile à toucher d'un pouce. */
export function SuggestionRow({ title, detail, icon, isPlace = false, onChoose }: Props) {
  return (
    <li>
      <button onClick={onChoose} className="flex min-h-18 w-full items-center gap-3.5 rounded-[22px] bg-white px-4 py-3 text-left">
        {icon && <Icon name={icon} className={clsx('size-7 shrink-0', isPlace ? 'text-moss' : 'text-muted')} />}
        <span className="min-w-0">
          <b className="line-clamp-2 block text-xl leading-6 font-semibold">{title}</b>
          {detail && <span className="line-clamp-2 block text-lg leading-6 text-muted">{detail}</span>}
        </span>
      </button>
    </li>
  )
}

/** Un groupe de propositions avec son titre (« Souvent », « Récemment ») : un lecteur d'écran l'annonce comme tel. */
export function SuggestionGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="px-2 pt-1 text-lg font-semibold text-muted">{title}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}
