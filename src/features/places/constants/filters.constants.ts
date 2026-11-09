import type { PlaceType } from '~/types/place.types'

export type Filter = { id: string; label: string; types?: PlaceType[] }

// L'appli ne connaît que ce qui sert à ses deux usages : cafés, restaurants et toilettes publiques
// pour sortir, places handicapées pour se garer (docs/decisions/interface, D23).
export const FILTERS: Filter[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'lieux', label: 'Où aller', types: ['cafe', 'restaurant', 'wc'] },
  { id: 'garer', label: 'Se garer', types: ['parking'] },
]

export const matches = (type: PlaceType, filter: Filter) => !filter.types || filter.types.includes(type)
