import type { Mode } from '~/features/itinerary/api/route.api'
import type { Point } from '~/types/place.types'

export type GpsApp = 'plans' | 'waze' | 'google'

export const GPS_APPS: { id: GpsApp; name: string }[] = [
  { id: 'plans', name: 'Plans (Apple)' },
  { id: 'waze', name: 'Waze' },
  { id: 'google', name: 'Google Maps' },
]

const KEY = 'appli-gps'

export function preferredApp(): GpsApp | null {
  try {
    const v = localStorage.getItem(KEY)
    return GPS_APPS.some(a => a.id === v) ? (v as GpsApp) : null
  } catch {
    return null
  }
}

export function rememberApp(app: GpsApp) {
  try { localStorage.setItem(KEY, app) } catch { /* on redemandera la prochaine fois */ }
}

/** Le guidage vocal pas à pas reste confié à une vraie appli GPS (sécurité au volant, recalcul). */
export function openGps(destination: Point, mode: Mode, app: GpsApp) {
  const { lat, lon } = destination
  const url = {
    plans: `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=${mode === 'walk' ? 'w' : 'd'}`,
    // Waze ne fait que la voiture.
    waze: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=${mode === 'walk' ? 'walking' : 'driving'}`,
  }[app]
  window.open(url, '_blank', 'noopener')
}
