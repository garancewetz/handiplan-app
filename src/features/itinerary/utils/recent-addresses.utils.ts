import type { Arrival, PlaceType } from '~/types/place.types'
import { distanceMetres } from '~/utils/distance.utils'

/** Une adresse ou un lieu déjà choisi, et combien de fois : ce qu'on demande souvent revient en premier. */
export type Destination = Arrival & { count: number; place?: { id: string; type: PlaceType; label: string } }

// Comme Waze : les dernières destinations reviennent en un toucher. Elles restent sur le téléphone.
const KEY = 'adresses-recentes'
const KEPT = 12
const SUGGESTED = 5
// À partir de trois fois, une destination est « souvent » demandée : on la garde et on la met en tête.
const OFTEN = 3
// Deux adresses à moins de 30 m sont la même destination (« 12 rue Carnot » et « Mairie »).
const SAME_SPOT_M = 30

const sameDestination = (a: Destination, b: Omit<Destination, 'count'>) =>
  a.place && b.place ? a.place.id === b.place.id : a.address === b.address || distanceMetres(a, b) <= SAME_SPOT_M

/** La nouvelle destination en tête, comptée une fois de plus, sans doublon. */
export function withRecent(list: Destination[], fresh: Omit<Destination, 'count'>): Destination[] {
  const existing = list.find(d => sameDestination(d, fresh))
  const head: Destination = { lat: fresh.lat, lon: fresh.lon, address: fresh.address, count: (existing?.count ?? 0) + 1 }
  if (fresh.place) head.place = fresh.place
  const remaining = [head, ...list.filter(d => d !== existing)]
  // Trop longue : on oublie d'abord la plus ancienne de celles qui ne servent pas souvent.
  while (remaining.length > KEPT) {
    const rare = remaining.filter(d => d.count < OFTEN)
    remaining.splice(remaining.indexOf(rare[rare.length - 1] ?? remaining[remaining.length - 1]), 1)
  }
  return remaining
}

/** Ce que le panneau propose, champ vide : les plus demandées, puis les dernières, cinq en tout. */
export function toSuggest(list: Destination[]): { often: Destination[]; recentOnes: Destination[] } {
  const often = list.filter(d => d.count >= OFTEN).sort((a, b) => b.count - a.count).slice(0, 3)
  const recentOnes = list.filter(d => !often.includes(d)).slice(0, SUGGESTED - often.length)
  return { often, recentOnes }
}

// Les destinations gardées avant le passage du code en anglais (novembre 2026) avaient des noms français :
// adresse, fois, lieu, libelle, et le type « resto ». On les relit sous la forme d'aujourd'hui.
const OLD_TYPES: Record<string, PlaceType> = { resto: 'restaurant' }
const TYPES: PlaceType[] = ['cafe', 'restaurant', 'wc', 'parking']

/** Une destination gardée sur le téléphone, ancienne ou nouvelle forme ; null si elle est illisible. */
export function fromStored(stored: unknown): Destination | null {
  if (typeof stored !== 'object' || stored === null) return null
  const d = stored as Record<string, unknown>
  const address = d.address ?? d.adresse
  if (typeof address !== 'string' || typeof d.lat !== 'number' || typeof d.lon !== 'number') return null
  const count = d.count ?? d.fois
  const destination: Destination = { lat: d.lat, lon: d.lon, address, count: typeof count === 'number' ? count : 1 }
  const p = (d.place ?? d.lieu) as Record<string, unknown> | undefined
  const type = typeof p?.type === 'string' ? OLD_TYPES[p.type] ?? p.type : undefined
  const label = p?.label ?? p?.libelle
  if (p && typeof p.id === 'string' && TYPES.includes(type as PlaceType) && typeof label === 'string') {
    destination.place = { id: p.id, type: type as PlaceType, label }
  }
  return destination
}

export function readRecent(): Destination[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.map(fromStored).filter((d): d is Destination => d !== null)
  } catch {
    return []
  }
}

export function rememberRecent(fresh: Omit<Destination, 'count'>): Destination[] {
  const list = withRecent(readRecent(), fresh)
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* stockage indisponible : la liste repartira de zéro */ }
  return list
}
