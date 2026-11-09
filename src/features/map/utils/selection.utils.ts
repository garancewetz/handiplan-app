import type { Place, Point } from '~/types/place.types'
import { distanceMeters } from '~/utils/distance.utils'

/** Ce que la carte montre : son centre, et les bords du cadre. */
export type Bounds = { center: Point; south: number; west: number; north: number; east: number }

// Au-delà, les pastilles se chevauchent et la carte devient illisible : la liste montre le reste.
const MAX_PINS = 40

const inBounds = (p: Place, c: Bounds) => p.lat >= c.south && p.lat <= c.north && p.lon >= c.west && p.lon <= c.east

/**
 * Les lieux à dessiner : tous ceux qui sont dans le cadre de la carte. S'il y en a trop, les plus
 * proches du centre de la carte, quelle que soit leur couleur : zoomer sur une rue montre ses lieux,
 * et aucune couleur ne disparaît plus qu'une autre (docs/decisions/carte, D4).
 */
export function placesForMap(places: Place[], bounds: Bounds | null): Place[] {
  if (!bounds) return []
  const indoors = places.filter(p => inBounds(p, bounds))
  if (indoors.length <= MAX_PINS) return indoors
  return indoors
    .map(p => ({ p, d: distanceMeters(bounds.center, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, MAX_PINS)
    .map(({ p }) => p)
}
