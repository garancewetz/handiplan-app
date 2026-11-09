import type { Source } from '~/types/place.types'

type Props = {
  /** le titre de la liste, qui dit dans quel ordre elle est */
  title: string
  noPlace: boolean
  finished: boolean
  inFlight: Source[]
  down: Source[]
  noneVisible: boolean
  onRetry: () => void
}

const ALERT = 'mb-2.5 flex items-center gap-3 rounded-[22px] bg-amber-light px-4 py-3 text-lg text-amber-dark'

/** Titre de la liste et messages d'attente ou de panne des sources. */
export function LoadingMessages({ title, noPlace, finished, inFlight, down, noneVisible, onRetry }: Props) {
  return (
    <>
      <h2 className="px-2 pb-2.5 text-lg font-semibold">
        {noPlace && !finished ? 'Je cherche les lieux autour…' : title}
      </h2>
      {/* Annoncé par les lecteurs d'écran à chaque changement, sans couper ce qu'ils lisent. */}
      <div role="status">
        {inFlight.includes('OpenStreetMap') && !noPlace && (
          <p className="mb-2.5 px-2 text-lg text-muted">Je cherche encore les cafés, restos et places…</p>
        )}
        {finished && down.length === 0 && noneVisible && (
          <p className="px-2 text-lg">Aucun lieu trouvé ici pour l’instant.</p>
        )}
      </div>
      {finished && down.length > 0 && (
        <div role="alert" className={ALERT}>
          <span className="flex-1">
            {down.includes('OpenStreetMap')
              ? 'OpenStreetMap ne répond pas : il manque des cafés, des restos et les places handicapées.'
              : 'Le détail des toilettes n’a pas pu être chargé.'}
          </span>
          <button onClick={onRetry} className="rounded-full bg-amber-dark px-4 py-2 font-semibold text-white">
            Réessayer
          </button>
        </div>
      )}
    </>
  )
}
