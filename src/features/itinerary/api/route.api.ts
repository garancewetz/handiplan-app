import type { Point } from '~/types/place.types'

// Calcul d'itinéraire de l'IGN (Géoplateforme) : gratuit, sans clé, autorisé depuis un navigateur.
const API = 'https://data.geopf.fr/navigation/itineraire'

export type Mode = 'walk' | 'car'

export type Route = {
  mode: Mode
  /** en secondes */
  duration: number
  /** en mètres */
  distance: number
  trace: [number, number][]
}

export async function computeRoute(departure: Point, arrival: Point, mode: Mode): Promise<Route> {
  const params = new URLSearchParams({
    resource: 'bdtopo-valhalla',
    start: `${departure.lon},${departure.lat}`,
    end: `${arrival.lon},${arrival.lat}`,
    profile: mode === 'walk' ? 'pedestrian' : 'car',
    optimization: 'fastest',
    geometryFormat: 'geojson',
    getSteps: 'false',
  })
  const answer = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(15000) })
  if (!answer.ok) throw new Error(`Itinéraire IGN ${answer.status}`)
  const r = await answer.json()
  const coordinates: [number, number][] = r.geometry?.coordinates ?? []
  return {
    mode,
    duration: r.duration,
    distance: r.distance,
    trace: coordinates.map(([lon, lat]) => [lat, lon]),
  }
}

/** Au-delà de 1,5 km, on propose la voiture : marcher plus loin est rarement réaliste. */
export const suggestedMode = (towardSpot: boolean, metres: number): Mode =>
  towardSpot || metres > 1500 ? 'car' : 'walk'
