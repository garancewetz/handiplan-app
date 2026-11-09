import { RELOAD_DISTANCE, KEEP_RADIUS, SEARCH_RADIUS, MIN_ZOOM } from '~/constants/search.constants'
import { sortPlaces } from '~/features/places/utils/merge-places.utils'
import type { Place, Point } from '~/types/place.types'
import { distanceMetres } from '~/utils/distance.utils'

/** Carte trop dézoomée pour charger ce qu'elle montre. */
export const tooZoomedOut = (zoom: number) => zoom < MIN_ZOOM

/** Un petit glissement ne vaut pas un rechargement : les lieux autour sont déjà là. */
export const farEnough = (a: Point, b: Point) => distanceMetres(a, b) > RELOAD_DISTANCE

/**
 * Lieux à montrer pendant et après le chargement d'une nouvelle zone : on garde ceux des zones
 * voisines déjà chargées, pour que la carte ne se vide pas d'un coup quand on la fait glisser.
 * Dès qu'une source a répondu, la nouvelle zone fait foi dans son rayon : un ancien lieu y serait
 * en double, ou y aurait disparu des données.
 */
export function keepNeighbours(stale: Place[], newOnes: Place[], centre: Point): Place[] {
  const ids = new Set(newOnes.map(l => l.id))
  const keptOnes = stale.filter(l => {
    if (ids.has(l.id)) return false
    const metres = distanceMetres(centre, l)
    return metres <= KEEP_RADIUS && (newOnes.length === 0 || metres > SEARCH_RADIUS)
  })
  return [...newOnes, ...keptOnes]
}

/** Distances recalculées depuis le point qui compte pour la personne (docs/decisions/carte, D2), puis tri. */
export function measureFrom(places: Place[], reference: Point): Place[] {
  return sortPlaces(places.map(l => ({ ...l, metres: Math.round(distanceMetres(reference, l)) })))
}

/** La liste ne montre que la zone regardée : les voisins gardés ne servent qu'à ne pas vider la carte. */
export const inArea = (places: Place[], centre: Point) =>
  places.filter(l => distanceMetres(centre, l) <= SEARCH_RADIUS)
