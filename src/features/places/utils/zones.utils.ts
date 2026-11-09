import type { Point } from '~/types/place.types'

// La mémoire du téléphone range les lieux par petits carrés (≈ 280 m sur 180 m), en degrés : la
// première fois dans un quartier, on ne charge guère plus que le voisinage (docs/decisions/carte, D6).
const GRID = 0.0025

/** Repère d'environ 100 m : deux demandes au même endroit, au même moment, n'en font qu'une. */
export const zoneKey = ({ lat, lon }: Point) => `${lat.toFixed(3)},${lon.toFixed(3)}`

export const areaKey = (lat: number, lon: number) => `${Math.floor(lat / GRID)}_${Math.floor(lon / GRID)}`

/** Le rectangle [sud, ouest, nord, est] qui couvre ces zones. */
export function areasRectangle(keys: string[]): [number, number, number, number] {
  const cells = keys.map(c => c.split('_').map(Number))
  const lats = cells.map(([la]) => la)
  const lons = cells.map(([, lo]) => lo)
  const round = (x: number) => Math.round(x * 1e6) / 1e6
  return [round(Math.min(...lats) * GRID), round(Math.min(...lons) * GRID), round((Math.max(...lats) + 1) * GRID), round((Math.max(...lons) + 1) * GRID)]
}

/** Zones qui couvrent un cercle de `radius` mètres autour d'un point (1 à 4 zones, rarement plus). */
export function areasAround({ lat, lon }: Point, radius: number): string[] {
  const dLat = radius / 111320
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180))
  const keys = new Set<string>()
  for (let la = lat - dLat; la <= lat + dLat + GRID; la += GRID) {
    for (let lo = lon - dLon; lo <= lon + dLon + GRID; lo += GRID) {
      keys.add(areaKey(Math.min(la, lat + dLat), Math.min(lo, lon + dLon)))
    }
  }
  return [...keys]
}

/** Range des éléments par quartier ; chaque quartier demandé a sa liste, même vide. */
export function distribute<T>(elements: T[], keys: string[], position: (e: T) => Point | null): Map<string, T[]> {
  const byArea = new Map(keys.map(c => [c, [] as T[]]))
  for (const e of elements) {
    const p = position(e)
    if (p) byArea.get(areaKey(p.lat, p.lon))?.push(e)
  }
  return byArea
}
