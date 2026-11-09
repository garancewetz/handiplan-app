import type { Point } from '~/types/place.types'
import { browserStorage, type Kept, type Storage } from '~/features/places/api/area-storage.api'
import { areasRectangle, distribute, areasAround } from '~/features/places/utils/zones.utils'

// Au-delà d'un jour, un quartier gardé s'affiche quand même, puis se met à jour sans attendre.
const REFRESH_AFTER = 24 * 3600 * 1000

export type Rectangle = [number, number, number, number]

type Options<T> = {
  /** préfixe des clés gardées : `osm-q1`, `acceslibre-q1`… (le changer oublie l'ancienne forme) */
  dataset: string
  center: Point
  radius: number
  /** interroge le serveur sur ce rectangle [sud, ouest, nord, est] */
  load: (rectangle: Rectangle) => Promise<T[]>
  /** où se trouve un élément, pour le ranger dans son quartier */
  position: (element: T) => Point | null
  /** où garder les quartiers (la base du navigateur, sauf dans les tests) */
  storage?: Storage | null
}

const refreshing = new Set<string>()

// Les anciennes formes, gardées dans localStorage : elles ne servent plus, on libère la place.
const OLD_FORMATS = ['osm-v4:', 'acceslibre-v2:', 'osm-z1:', 'acceslibre-z1:']
let cleanedUp = false
function cleanUp() {
  if (cleanedUp) return
  cleanedUp = true
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    keys.filter(c => c && OLD_FORMATS.some(f => c.startsWith(f))).forEach(c => localStorage.removeItem(c!))
  } catch { /* stockage indisponible : rien à libérer */ }
}

async function loadAndKeep<T>({ dataset, load, position, storage }: Options<T>, keys: string[]) {
  const byArea = distribute(await load(areasRectangle(keys)), keys, position)
  const date = Date.now()
  const entries = [...byArea].map(([key, list]): [string, Kept] => [`${dataset}:${key}`, { date, data: list }])
  // Garder est un plus : si la base refuse (pleine, indisponible), on a quand même les lieux.
  await storage?.write(entries).catch(() => {})
  // Seulement les quartiers demandés : le rectangle peut couvrir un quartier déjà gardé, dont les
  // lieux sont déjà dans la liste (ils apparaissaient en double).
  return [...byArea.values()].flat()
}

/**
 * Les éléments autour d'un point, quartier par quartier (≈ 280 m) : les quartiers gardés sur le
 * téléphone s'affichent tout de suite, les autres sont chargés en une seule demande, à peine plus
 * large que le voisinage. Un quartier gardé depuis plus d'un jour est remis à jour en arrière-plan
 * (docs/decisions/carte, D6).
 */
export async function loadByArea<T>({ storage = browserStorage, ...rest }: Options<T>): Promise<T[]> {
  cleanUp()
  const options = { ...rest, storage }
  const keys = areasAround(options.center, options.radius)
  const keptAreas = (await storage?.read(keys.map(c => `${options.dataset}:${c}`)).catch(() => null)) ?? new Map<string, Kept>()
  const foundOnes: T[] = []
  const missing: string[] = []
  const stale: string[] = []
  for (const key of keys) {
    const kept = keptAreas.get(`${options.dataset}:${key}`)
    if (!kept) { missing.push(key); continue }
    foundOnes.push(...(kept.data as T[]))
    if (Date.now() - kept.date > REFRESH_AFTER && !refreshing.has(`${options.dataset}:${key}`)) stale.push(key)
  }

  if (stale.length > 0) {
    stale.forEach(c => refreshing.add(`${options.dataset}:${c}`))
    // Sans attendre : la mise à jour servira à la prochaine ouverture.
    loadAndKeep(options, stale).catch(() => {}).finally(() => stale.forEach(c => refreshing.delete(`${options.dataset}:${c}`)))
  }
  if (missing.length === 0) return foundOnes
  return [...foundOnes, ...(await loadAndKeep(options, missing))]
}
