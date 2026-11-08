import type { Mode } from '~/features/itineraire/api/itineraire.api'
import type { Point } from '~/types/lieu.types'

export type AppliGps = 'plans' | 'waze' | 'google'

export const APPLIS_GPS: { id: AppliGps; nom: string }[] = [
  { id: 'plans', nom: 'Plans (Apple)' },
  { id: 'waze', nom: 'Waze' },
  { id: 'google', nom: 'Google Maps' },
]

const CLE = 'appli-gps'

export function appliPreferee(): AppliGps | null {
  try {
    const v = localStorage.getItem(CLE)
    return APPLIS_GPS.some(a => a.id === v) ? (v as AppliGps) : null
  } catch {
    return null
  }
}

export function retenirAppli(appli: AppliGps) {
  try { localStorage.setItem(CLE, appli) } catch { /* on redemandera la prochaine fois */ }
}

/** Le guidage vocal pas à pas reste confié à une vraie appli GPS (sécurité au volant, recalcul). */
export function ouvrirGps(destination: Point, mode: Mode, appli: AppliGps) {
  const { lat, lon } = destination
  const url = {
    plans: `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=${mode === 'pied' ? 'w' : 'd'}`,
    // Waze ne fait que la voiture.
    waze: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=${mode === 'pied' ? 'walking' : 'driving'}`,
  }[appli]
  window.open(url, '_blank', 'noopener')
}
