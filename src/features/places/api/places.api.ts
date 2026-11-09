import { loadAcceslibre } from '~/features/places/api/acceslibre.api'
import { loadPlaces as chargerOsm } from '~/features/places/api/osm.api'
import { mergePlaces, sortPlaces } from '~/features/places/utils/merge-places.utils'
import type { Place, Point, Source } from '~/types/place.types'

export type Loading = {
  places: Place[]
  /** sources dont on attend encore la réponse */
  inFlight: Source[]
  down: Source[]
}

/**
 * Réunit OpenStreetMap (places handicapées, toilettes publiques, lieux accessibles) et Acceslibre
 * (détail des toilettes et de l'entrée). Chaque source s'affiche dès qu'elle répond : Acceslibre
 * répond en 2 à 3 s, alors qu'Overpass peut mettre une minute quand il est saturé.
 * Renvoie une fonction pour ignorer les réponses qui arriveraient après un changement de zone.
 */
export function loadProgressively(centre: Point, onChanged: (loading: Loading) => void): () => void {
  let cancelled = false
  let osm: Place[] = []
  let acceslibre: Place[] = []
  const inFlight = new Set<Source>(['OpenStreetMap', 'Acceslibre'])
  const down = new Set<Source>()

  const publish = () => {
    if (cancelled) return
    onChanged({ places: sortPlaces(mergePlaces(osm, acceslibre)), inFlight: [...inFlight], down: [...down] })
  }
  const follow = (source: Source, promise: Promise<Place[]>, sort: (l: Place[]) => void) =>
    promise
      .then(sort)
      .catch(() => down.add(source))
      .finally(() => { inFlight.delete(source); publish() })

  publish()
  follow('OpenStreetMap', chargerOsm(centre), l => { osm = l })
  follow('Acceslibre', loadAcceslibre(centre), l => { acceslibre = l })
  return () => { cancelled = true }
}
