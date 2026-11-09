import { RELOAD_DISTANCE, KEEP_RADIUS, SEARCH_RADIUS, MIN_ZOOM } from '~/constants/search.constants'
import { sortPlaces } from '~/features/places/utils/merge-places.utils'
import type { Place, Point } from '~/types/place.types'
import { distanceMeters } from '~/utils/distance.utils'

/** Carte trop dézoomée pour charger ce qu'elle montre. */
export const tooZoomedOut = (zoom: number) => zoom < MIN_ZOOM

/** Un petit glissement ne vaut pas un rechargement : les lieux autour sont déjà là. */
export const farEnough = (a: Point, b: Point) => distanceMeters(a, b) > RELOAD_DISTANCE

/**
 * Lieux à montrer pendant et après le chargement d'une nouvelle zone : on garde ceux des zones
 * voisines déjà chargées, pour que la carte ne se vide pas d'un coup quand on la fait glisser.
 * Dès qu'une source a répondu, la nouvelle zone fait foi dans son rayon : un ancien lieu y serait
 * en double, ou y aurait disparu des données.
 */
export function keepNeighbors(stale: Place[], fresh: Place[], center: Point): Place[] {
  const ids = new Set(fresh.map(p => p.id))
  const kept = stale.filter(p => {
    if (ids.has(p.id)) return false
    const meters = distanceMeters(center, p)
    return meters <= KEEP_RADIUS && (fresh.length === 0 || meters > SEARCH_RADIUS)
  })
  return [...fresh, ...kept]
}

/** Distances recalculées depuis le point qui compte pour la personne (docs/decisions/carte, D2), puis tri. */
export function measureFrom(places: Place[], reference: Point): Place[] {
  return sortPlaces(places.map(p => ({ ...p, meters: Math.round(distanceMeters(reference, p)) })))
}

/** La liste ne montre que la zone regardée : les voisins gardés ne servent qu'à ne pas vider la carte. */
export const inArea = (places: Place[], center: Point) =>
  places.filter(p => distanceMeters(center, p) <= SEARCH_RADIUS)
