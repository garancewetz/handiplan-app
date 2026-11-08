import L from 'leaflet'
import { htmlPastille } from '~/features/carte/utils/pastille.utils'
import type { Lieu } from '~/types/lieu.types'

export function iconeLieu(lieu: Lieu, choisi: boolean) {
  const taille = lieu.type === 'parking' ? 42 : 50
  return L.divIcon({ html: htmlPastille(lieu, choisi), iconSize: [taille, taille], iconAnchor: [taille / 2, taille / 2] })
}

export const ICONE_ICI = L.divIcon({ html: '<div class="marqueur-moi"></div>', iconSize: [24, 24], iconAnchor: [12, 12] })
export const ICONE_ARRIVEE = L.divIcon({ html: '<div class="marqueur-moi arrivee"></div>', iconSize: [24, 24], iconAnchor: [12, 12] })
