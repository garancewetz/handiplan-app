import L from 'leaflet'
import { pinHtml } from '~/features/map/utils/pin.utils'
import type { Place } from '~/types/place.types'

export function placeIcon(place: Place, chosen: boolean) {
  const size = place.type === 'parking' ? 42 : 50
  return L.divIcon({ html: pinHtml(place, chosen), iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

export const HERE_ICON = L.divIcon({ html: '<div class="marker-self"></div>', iconSize: [24, 24], iconAnchor: [12, 12] })
export const ARRIVAL_ICON = L.divIcon({ html: '<div class="marker-self arrival"></div>', iconSize: [24, 24], iconAnchor: [12, 12] })
