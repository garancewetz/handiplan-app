export type Point = { lat: number; lon: number }

export type TypeLieu = 'cafe' | 'resto' | 'wc' | 'parking'

export type Source = 'OpenStreetMap' | 'Acceslibre'

/** ok = toilettes adaptées, verifier = en partie, inconnu = aucune info, non = rien d'accessible, parking = place handicapée */
export type Etat = 'ok' | 'verifier' | 'inconnu' | 'non' | 'parking'

/** `info` : un fait sans jugement, quand OSM ne fixe pas de seuil (largeur de porte, étage…). */
export type Reponse = 'oui' | 'attention' | 'non' | 'info'

/** Thèmes de la fiche, dans l'ordre du trajet : on arrive, on entre, on circule, on cherche les toilettes. */
export const THEMES = ['Se garer', 'Depuis la rue', 'Entrée', 'À l’intérieur', 'Toilettes', 'Accueil'] as const
export type Theme = (typeof THEMES)[number]

export type Ligne = { theme: Theme; reponse: Reponse; texte: string; detail?: string }

export type Lieu = Point & {
  id: string
  type: TypeLieu
  etat: Etat
  nom: string
  libelle: string
  lignes: Ligne[]
  conseil?: string
  /** distance en mètres depuis le centre de recherche (moi ou l'arrivée) */
  metres: number
  sources: Source[]
  /** page Acceslibre du lieu, où l'on peut corriger sa fiche */
  lienAcceslibre?: string
}

export type Arrivee = Point & { adresse: string }
