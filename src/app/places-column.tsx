import type { ComponentProps, ReactNode } from 'react'
import { Icon } from '~/components/icon'
import { AddSpotButton } from '~/features/contribution/components/add-parking-button'
import { InstallPrompt } from '~/features/installation/components/install'
import { Legend } from '~/features/places/components/legend'
import { PlaceList } from '~/features/places/components/place-list'
import { LoadingMessages } from '~/features/places/components/loading-messages'
import type { Place } from '~/types/place.types'

type Props = {
  /** au-dessus de tout : le trajet en cours, s'il y en a un */
  route: ReactNode
  error: string | null
  onCloseError: () => void
  /** la carte montre plusieurs kilomètres : on invite à zoomer plutôt que de tout lister */
  zoomedOut: boolean
  messages: ComponentProps<typeof LoadingMessages>
  places: Place[]
  /** combien de lieux de la liste sont montrés ; le reste à la demande */
  shownCount: number
  onShowMore: () => void
  onChoose: (place: Place) => void
  onAddSpot: () => void
  onInfo: () => void
}

/** Sous la carte : le trajet, la légende, la liste des lieux, et les actions plus rares. */
export function PlacesColumn({ route, error, onCloseError, zoomedOut, messages, places, shownCount, onShowMore, onChoose, onAddSpot, onInfo }: Props) {
  return (
    <main className="min-h-0 overflow-y-auto overscroll-contain px-4 pt-3.5 pb-4 lg:col-start-1 lg:row-start-1">
      <InstallPrompt />
      {route}
      {error && (
        <div role="alert" className="mb-2.5 flex items-center gap-3 rounded-[22px] bg-amber-light px-4 py-3 text-lg text-amber-dark">
          <span className="flex-1">{error}</span>
          <button onClick={onCloseError} className="rounded-full bg-amber-dark px-4 py-2 font-semibold text-white">
            Fermer
          </button>
        </div>
      )}
      {zoomedOut ? (
        <p role="status" className="px-2 pt-2 text-xl font-semibold">Zoomez pour voir les lieux</p>
      ) : (
        <>
          <Legend />
          <LoadingMessages {...messages} />
          <PlaceList places={places.slice(0, shownCount)} onChoose={onChoose} />
          {places.length > shownCount && (
            <button onClick={onShowMore} className="mt-2.5 h-15 w-full rounded-[22px] border-2 border-moss text-xl font-semibold text-moss">
              Voir plus de lieux
            </button>
          )}
        </>
      )}
      <AddSpotButton onClick={onAddSpot} />
      <button onClick={onInfo} className="mt-5 flex w-full items-center justify-center gap-2 py-2 text-lg font-semibold text-moss">
        <Icon name="info" className="size-6" />
        D’où viennent les infos ?
      </button>
    </main>
  )
}
