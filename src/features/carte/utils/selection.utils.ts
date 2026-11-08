import type { Lieu, Point } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'

/** Ce que la carte montre : son centre, et les bords du cadre. */
export type Cadre = { centre: Point; sud: number; ouest: number; nord: number; est: number }

// Au-delà, les pastilles se chevauchent et la carte devient illisible : la liste montre le reste.
const MAX_PASTILLES = 40

const dansLeCadre = (l: Lieu, c: Cadre) => l.lat >= c.sud && l.lat <= c.nord && l.lon >= c.ouest && l.lon <= c.est

/**
 * Les lieux à dessiner : tous ceux qui sont dans le cadre de la carte. S'il y en a trop, les plus
 * proches du centre de la carte, quelle que soit leur couleur : zoomer sur une rue montre ses lieux,
 * et aucune couleur ne disparaît plus qu'une autre (docs/decisions/carte, D4).
 */
export function lieuxPourCarte(lieux: Lieu[], cadre: Cadre | null): Lieu[] {
  if (!cadre) return []
  const dedans = lieux.filter(l => dansLeCadre(l, cadre))
  if (dedans.length <= MAX_PASTILLES) return dedans
  return dedans
    .map(l => ({ l, d: distanceMetres(cadre.centre, l) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, MAX_PASTILLES)
    .map(({ l }) => l)
}
