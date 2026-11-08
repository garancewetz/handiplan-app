import { DISTANCE_RECHARGE, RAYON_GARDE, RAYON_RECHERCHE, ZOOM_MINIMUM } from '~/constants/recherche.constants'
import { trier } from '~/features/lieux/utils/fusion-lieux.utils'
import type { Lieu, Point } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'

/** Carte trop dézoomée pour charger ce qu'elle montre. */
export const tropDezoome = (zoom: number) => zoom < ZOOM_MINIMUM

/** Un petit glissement ne vaut pas un rechargement : les lieux autour sont déjà là. */
export const assezLoin = (a: Point, b: Point) => distanceMetres(a, b) > DISTANCE_RECHARGE

/**
 * Lieux à montrer pendant et après le chargement d'une nouvelle zone : on garde ceux des zones
 * voisines déjà chargées, pour que la carte ne se vide pas d'un coup quand on la fait glisser.
 * Dès qu'une source a répondu, la nouvelle zone fait foi dans son rayon : un ancien lieu y serait
 * en double, ou y aurait disparu des données.
 */
export function garderVoisins(anciens: Lieu[], nouveaux: Lieu[], centre: Point): Lieu[] {
  const ids = new Set(nouveaux.map(l => l.id))
  const gardes = anciens.filter(l => {
    if (ids.has(l.id)) return false
    const metres = distanceMetres(centre, l)
    return metres <= RAYON_GARDE && (nouveaux.length === 0 || metres > RAYON_RECHERCHE)
  })
  return [...nouveaux, ...gardes]
}

/** Distances recalculées depuis le point qui compte pour la personne (docs/decisions/carte, D2), puis tri. */
export function mesurerDepuis(lieux: Lieu[], reference: Point): Lieu[] {
  return trier(lieux.map(l => ({ ...l, metres: Math.round(distanceMetres(reference, l)) })))
}

/** La liste ne montre que la zone regardée : les voisins gardés ne servent qu'à ne pas vider la carte. */
export const dansLaZone = (lieux: Lieu[], centre: Point) =>
  lieux.filter(l => distanceMetres(centre, l) <= RAYON_RECHERCHE)
