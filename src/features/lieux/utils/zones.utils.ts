import type { Point } from '~/types/lieu.types'

// La mémoire du téléphone range les lieux par petits carrés (≈ 280 m sur 180 m), en degrés : la
// première fois dans un quartier, on ne charge guère plus que le voisinage (docs/decisions/carte, D6).
const GRILLE = 0.0025

/** Repère d'environ 100 m : deux demandes au même endroit, au même moment, n'en font qu'une. */
export const cleDeZone = ({ lat, lon }: Point) => `${lat.toFixed(3)},${lon.toFixed(3)}`

export const cleZone = (lat: number, lon: number) => `${Math.floor(lat / GRILLE)}_${Math.floor(lon / GRILLE)}`

/** Le rectangle [sud, ouest, nord, est] qui couvre ces zones. */
export function rectangleZones(cles: string[]): [number, number, number, number] {
  const cases = cles.map(c => c.split('_').map(Number))
  const lats = cases.map(([la]) => la)
  const lons = cases.map(([, lo]) => lo)
  const arrondi = (x: number) => Math.round(x * 1e6) / 1e6
  return [arrondi(Math.min(...lats) * GRILLE), arrondi(Math.min(...lons) * GRILLE), arrondi((Math.max(...lats) + 1) * GRILLE), arrondi((Math.max(...lons) + 1) * GRILLE)]
}

/** Zones qui couvrent un cercle de `rayon` mètres autour d'un point (1 à 4 zones, rarement plus). */
export function zonesAutour({ lat, lon }: Point, rayon: number): string[] {
  const dLat = rayon / 111320
  const dLon = rayon / (111320 * Math.cos((lat * Math.PI) / 180))
  const cles = new Set<string>()
  for (let la = lat - dLat; la <= lat + dLat + GRILLE; la += GRILLE) {
    for (let lo = lon - dLon; lo <= lon + dLon + GRILLE; lo += GRILLE) {
      cles.add(cleZone(Math.min(la, lat + dLat), Math.min(lo, lon + dLon)))
    }
  }
  return [...cles]
}

/** Range des éléments par quartier ; chaque quartier demandé a sa liste, même vide. */
export function repartir<T>(elements: T[], cles: string[], position: (e: T) => Point | null): Map<string, T[]> {
  const parZone = new Map(cles.map(c => [c, [] as T[]]))
  for (const e of elements) {
    const p = position(e)
    if (p) parZone.get(cleZone(p.lat, p.lon))?.push(e)
  }
  return parZone
}
