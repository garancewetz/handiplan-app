export type Point = { lat: number; lon: number }

export type PlaceType = 'cafe' | 'restaurant' | 'wc' | 'parking'

export type Source = 'OpenStreetMap' | 'Acceslibre'

/** ok = toilettes adaptées, verifier = en partie, inconnu = aucune info, non = rien d'accessible, parking = place handicapée */
export type State = 'ok' | 'check' | 'unknown' | 'no' | 'parking'

/** `info` : un fait sans jugement, quand OSM ne fixe pas de seuil (largeur de porte, étage…). */
export type Answer = 'yes' | 'warning' | 'no' | 'info'

/** Thèmes de la fiche, dans l'ordre du trajet : on arrive, on entre, on circule, on cherche les toilettes. */
export const THEMES = ['Se garer', 'Depuis la rue', 'Entrée', 'À l’intérieur', 'Toilettes', 'Accueil'] as const
export type Theme = (typeof THEMES)[number]

export type Line = { theme: Theme; answer: Answer; text: string; detail?: string }

/** Ce qu'une source dit de l'entrée et des toilettes : de quoi choisir la meilleure en fusionnant. */
export type Entrance = 'ok' | 'partial' | 'no' | 'unknown'
export type Toilets = 'yes' | 'no' | 'unknown'

/** Le numéro et la rue, pour reconnaître un même lieu dans OSM et dans Acceslibre. */
export type Address = { number: string; street: string }

export type Place = Point & {
  id: string
  type: PlaceType
  state: State
  name: string
  label: string
  lines: Line[]
  advice?: string
  /** distance en mètres depuis le centre de recherche (moi ou l'arrivée) */
  meters: number
  sources: Source[]
  /** page Acceslibre du lieu, où l'on peut corriger sa fiche */
  acceslibreLink?: string
  /** ce que la source dit de l'entrée et des toilettes (pas pour une place) */
  access?: { entrance: Entrance; toilets: Toilets }
  address?: Address
  /** les deux sources se contredisent sur l'entrée ou les toilettes (docs/decisions/donnees, D12) */
  disagreement?: boolean
  /** les noms des autres fiches Acceslibre du même lieu, pour le reconnaître dans OSM */
  otherNames?: string[]
}

export type Arrival = Point & { address: string }
