import type { Point } from '~/types/lieu.types'

// Calcul d'itinéraire de l'IGN (Géoplateforme) : gratuit, sans clé, autorisé depuis un navigateur.
const API = 'https://data.geopf.fr/navigation/itineraire'

export type Mode = 'pied' | 'voiture'

export type Trajet = {
  mode: Mode
  /** en secondes */
  duree: number
  /** en mètres */
  distance: number
  trace: [number, number][]
}

export async function calculerTrajet(depart: Point, arrivee: Point, mode: Mode): Promise<Trajet> {
  const params = new URLSearchParams({
    resource: 'bdtopo-valhalla',
    start: `${depart.lon},${depart.lat}`,
    end: `${arrivee.lon},${arrivee.lat}`,
    profile: mode === 'pied' ? 'pedestrian' : 'car',
    optimization: 'fastest',
    geometryFormat: 'geojson',
    getSteps: 'false',
  })
  const reponse = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(15000) })
  if (!reponse.ok) throw new Error(`Itinéraire IGN ${reponse.status}`)
  const r = await reponse.json()
  const coordonnees: [number, number][] = r.geometry?.coordinates ?? []
  return {
    mode,
    duree: r.duration,
    distance: r.distance,
    trace: coordonnees.map(([lon, lat]) => [lat, lon]),
  }
}

/** Au-delà de 1,5 km, on propose la voiture : marcher plus loin est rarement réaliste. */
export const modeConseille = (versUnePlace: boolean, metres: number): Mode =>
  versUnePlace || metres > 1500 ? 'voiture' : 'pied'
