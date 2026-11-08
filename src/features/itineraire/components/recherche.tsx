import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Icone } from '~/components/icone'
import { BoutonMicro } from '~/features/itineraire/components/bouton-micro'
import { PanneauRecherche } from '~/features/itineraire/components/panneau-recherche'
import { useDictee } from '~/features/itineraire/hooks/use-dictee'
import type { Destination } from '~/features/itineraire/utils/adresses-recentes.utils'
import type { Arrivee, Lieu, Point } from '~/types/lieu.types'

type Props = {
  /** texte affiché quand un itinéraire est en cours (adresse, ou « Garé à… ») */
  enCours: string | null
  /** lieux déjà chargés, proposés en premier quand leur nom correspond */
  lieux: Lieu[]
  /** adresses et lieux déjà choisis, proposés quand le champ est vide */
  recentes: Destination[]
  /** pour classer les adresses proches en premier */
  proche: Point | null
  onChoisir: (arrivee: Arrivee) => void
  onChoisirLieu: (lieu: Lieu) => void
  /** texte validé sans choisir de suggestion (touche Entrée, dictée) */
  onChercher: (texte: string) => void
  onAnnuler: () => void
}

/**
 * La barre de recherche, en bas de l'écran sous le pouce : un toucher ouvre le panneau de recherche,
 * le micro écoute directement. Pendant un itinéraire, elle montre l'arrivée et permet d'annuler.
 */
export function Recherche({ enCours, onAnnuler, ...props }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const dictee = useDictee()

  if (enCours) {
    return (
      <div className="flex h-15 items-center gap-3 rounded-full bg-white pr-1.5 pl-5">
        <span className="flex-1 truncate text-xl">{enCours}</span>
        <button
          onClick={onAnnuler}
          aria-label="Annuler l'itinéraire"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-mousse text-white"
        >
          <Icone nom="croix" className="size-6" />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-15 items-center gap-2 rounded-full bg-white pr-1.5 pl-5">
        <button onClick={() => setOuvert(true)} className="h-full min-w-0 flex-1 rounded-full text-left text-xl text-doux">
          {dictee.ecoute ? 'Je vous écoute…' : 'Où allez-vous ?'}
        </button>
        {dictee.disponible && <BoutonMicro ecoute={dictee.ecoute} onEcouter={() => dictee.ecouter(props.onChercher)} />}
      </div>
      {/* Dans le corps de la page : la barre du bas crée sa propre couche, et le panneau doit passer
          par-dessus tout, carte comprise. */}
      {ouvert && createPortal(<PanneauRecherche {...props} onFermer={() => setOuvert(false)} />, document.body)}
    </>
  )
}
