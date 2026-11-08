import type { TypeLieu } from '~/types/lieu.types'

export type Filtre = { id: string; label: string; types?: TypeLieu[] }

// L'appli ne connaît que ce qui sert à ses deux usages : cafés, restaurants et toilettes publiques
// pour sortir, places handicapées pour se garer (docs/decisions/interface, D23).
export const FILTRES: Filtre[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'lieux', label: 'Où aller', types: ['cafe', 'resto', 'wc'] },
  { id: 'garer', label: 'Se garer', types: ['parking'] },
]

export const correspond = (type: TypeLieu, filtre: Filtre) => !filtre.types || filtre.types.includes(type)
