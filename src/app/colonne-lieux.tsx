import type { ComponentProps, ReactNode } from 'react'
import { Icone } from '~/components/icone'
import { BoutonPlace } from '~/features/contribution/components/bouton-place'
import { Installer } from '~/features/installation/components/installer'
import { Legende } from '~/features/lieux/components/legende'
import { Liste } from '~/features/lieux/components/liste-lieux'
import { MessagesChargement } from '~/features/lieux/components/messages-chargement'
import type { Lieu } from '~/types/lieu.types'

type Props = {
  /** au-dessus de tout : le trajet en cours, s'il y en a un */
  trajet: ReactNode
  erreur: string | null
  onFermerErreur: () => void
  /** la carte montre plusieurs kilomètres : on invite à zoomer plutôt que de tout lister */
  dezoomee: boolean
  messages: ComponentProps<typeof MessagesChargement>
  lieux: Lieu[]
  /** combien de lieux de la liste sont montrés ; le reste à la demande */
  nbAffiches: number
  onVoirPlus: () => void
  onChoisir: (lieu: Lieu) => void
  onAjouterPlace: () => void
  onInfos: () => void
}

/** Sous la carte : le trajet, la légende, la liste des lieux, et les actions plus rares. */
export function ColonneLieux({ trajet, erreur, onFermerErreur, dezoomee, messages, lieux, nbAffiches, onVoirPlus, onChoisir, onAjouterPlace, onInfos }: Props) {
  return (
    <main className="min-h-0 overflow-y-auto overscroll-contain px-4 pt-3.5 pb-4 lg:col-start-1 lg:row-start-1">
      <Installer />
      {trajet}
      {erreur && (
        <div role="alert" className="mb-2.5 flex items-center gap-3 rounded-[22px] bg-ambre-clair px-4 py-3 text-lg text-ambre-fonce">
          <span className="flex-1">{erreur}</span>
          <button onClick={onFermerErreur} className="rounded-full bg-ambre-fonce px-4 py-2 font-semibold text-white">
            Fermer
          </button>
        </div>
      )}
      {dezoomee ? (
        <p role="status" className="px-2 pt-2 text-xl font-semibold">Zoomez pour voir les lieux</p>
      ) : (
        <>
          <Legende />
          <MessagesChargement {...messages} />
          <Liste lieux={lieux.slice(0, nbAffiches)} onChoisir={onChoisir} />
          {lieux.length > nbAffiches && (
            <button onClick={onVoirPlus} className="mt-2.5 h-15 w-full rounded-[22px] border-2 border-mousse text-xl font-semibold text-mousse">
              Voir plus de lieux
            </button>
          )}
        </>
      )}
      <BoutonPlace onClick={onAjouterPlace} />
      <button onClick={onInfos} className="mt-5 flex w-full items-center justify-center gap-2 py-2 text-lg font-semibold text-mousse">
        <Icone nom="info" className="size-6" />
        D’où viennent les infos ?
      </button>
    </main>
  )
}
