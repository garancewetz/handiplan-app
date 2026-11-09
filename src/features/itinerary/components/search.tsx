import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '~/components/icon'
import { MicButton } from '~/features/itinerary/components/mic-button'
import { SearchPanel } from '~/features/itinerary/components/search-panel'
import { useDictation } from '~/features/itinerary/hooks/use-dictation'
import type { Destination } from '~/features/itinerary/utils/recent-addresses.utils'
import type { Arrival, Place, Point } from '~/types/place.types'

type Props = {
  /** texte affiché quand un itinéraire est en cours (adresse, ou « Garé à… ») */
  inFlight: string | null
  /** lieux déjà chargés, proposés en premier quand leur nom correspond */
  places: Place[]
  /** adresses et lieux déjà choisis, proposés quand le champ est vide */
  recentOnes: Destination[]
  /** pour classer les adresses proches en premier */
  near: Point | null
  onChoose: (arrival: Arrival) => void
  onChoosePlace: (place: Place) => void
  /** texte validé sans choisir de suggestion (touche Entrée, dictée) */
  onSearch: (text: string) => void
  onCancel: () => void
}

/**
 * La barre de recherche, en bas de l'écran sous le pouce : un toucher ouvre le panneau de recherche,
 * le micro écoute directement. Pendant un itinéraire, elle montre l'arrivée et permet d'annuler.
 */
export function Search({ inFlight, onCancel, ...props }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dictation = useDictation()

  if (inFlight) {
    return (
      <div className="flex h-15 items-center gap-3 rounded-full bg-white pr-1.5 pl-5">
        <span className="flex-1 truncate text-xl">{inFlight}</span>
        <button
          onClick={onCancel}
          aria-label="Annuler l'itinéraire"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-moss text-white"
        >
          <Icon name="cross" className="size-6" />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-15 items-center gap-2 rounded-full bg-white pr-1.5 pl-5">
        <button onClick={() => setIsOpen(true)} className="h-full min-w-0 flex-1 rounded-full text-left text-xl text-muted">
          {dictation.listening ? 'Je vous écoute…' : 'Où allez-vous ?'}
        </button>
        {dictation.available && <MicButton listening={dictation.listening} onListen={() => dictation.listen(props.onSearch)} />}
      </div>
      {/* Dans le corps de la page : la barre du bas crée sa propre couche, et le panneau doit passer
          par-dessus tout, carte comprise. */}
      {isOpen && createPortal(<SearchPanel {...props} onClose={() => setIsOpen(false)} />, document.body)}
    </>
  )
}
