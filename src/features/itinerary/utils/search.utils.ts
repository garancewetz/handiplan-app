import type { Place } from '~/types/place.types'

const simplify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** « 12 Rue Carnot 93230 Romainville » : la rue en gros, la ville dessous. */
export function split(address: string): { title: string; detail?: string } {
  const cut = address.search(/ \d{5} /)
  return cut > 0 ? { title: address.slice(0, cut), detail: address.slice(cut + 1) } : { title: address }
}

/** Les lieux déjà chargés dont le nom contient ce qu'on tape (sans accents ni majuscules), trois au plus. */
export function matchingPlaces(places: Place[], text: string): Place[] {
  const t = simplify(text.trim())
  if (t.length < 3) return []
  return places.filter(l => l.name !== l.label && simplify(l.name).includes(t)).slice(0, 3)
}
