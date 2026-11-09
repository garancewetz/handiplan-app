import type { Place, Point } from '~/types/place.types'
import { distanceMetres } from '~/utils/distance.utils'

/** Ce que la carte montre : son centre, et les bords du cadre. */
export type Bounds = { centre: Point; south: number; west: number; north: number; east: number }

// Au-delà, les pastilles se chevauchent et la carte devient illisible : la liste montre le reste.
const MAX_PINS = 40

const inBounds = (l: Place, c: Bounds) => l.lat >= c.south && l.lat <= c.north && l.lon >= c.west && l.lon <= c.east

/**
 * Les lieux à dessiner : tous ceux qui sont dans le cadre de la carte. S'il y en a trop, les plus
 * proches du centre de la carte, quelle que soit leur couleur : zoomer sur une rue montre ses lieux,
 * et aucune couleur ne disparaît plus qu'une autre (docs/decisions/carte, D4).
 */
export function placesForMap(places: Place[], bounds: Bounds | null): Place[] {
  if (!bounds) return []
  const indoors = places.filter(l => inBounds(l, bounds))
  if (indoors.length <= MAX_PINS) return indoors
  return indoors
    .map(l => ({ l, d: distanceMetres(bounds.centre, l) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, MAX_PINS)
    .map(({ l }) => l)
}
