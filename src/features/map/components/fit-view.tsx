import { useEffect, type RefObject } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { REDUCED_MOTION } from '~/constants/motion.constants'
import type { Place, Point } from '~/types/place.types'

type Props = {
  center: Point
  places: Place[]
  trace: [number, number][] | null
  frozen: boolean
  /** le zoom choisi à la main, gardé pour « Ma position » */
  chosenZoom: RefObject<number | null>
}

// Au plus près : le zoom où l'on voit sa rue ; et au moins ce rayon autour de soi.
const STREET_ZOOM = 18
const MIN_RADIUS_M = 50

/**
 * Cadre la carte pour que l'essentiel soit visible : le chemin s'il y en a un, sinon le centre
 * (moi ou l'arrivée) au milieu, et juste assez autour pour voir le lieu le plus proche : on regarde
 * sa rue sans avoir à zoomer soi-même (docs/decisions/carte, D5).
 */
export function FitView({ center, places, trace, frozen, chosenZoom }: Props) {
  const map = useMap()
  const radius = Math.max(MIN_RADIUS_M, Math.min(...places.map(p => p.meters)))
  // Des nombres plutôt que des objets : on ne recadre pas à chaque nouveau tableau identique.
  const { lat, lon } = center
  const noPlaces = places.length === 0
  const hasTrace = !!trace?.length

  // Un chemin : on le montre en entier. Seul un nouveau chemin recadre, pas les lieux qui arrivent.
  useEffect(() => {
    if (!trace?.length) return
    return whenIdle(map, () => map.fitBounds(trace, { padding: [36, 36], maxZoom: 18, animate: !REDUCED_MOTION }))
  }, [map, trace])

  // Sans chemin : le centre (moi ou l'arrivée) au milieu, et juste assez autour pour le lieu le plus proche.
  useEffect(() => {
    // Une carte qui saute sous le doigt désoriente : après un déplacement à la main, seul un
    // nouveau chemin (geste explicite) la recadre.
    if (hasTrace || frozen) return
    // Sans lieux (pas encore arrivés, ou aucun ici) : on se centre sans changer le zoom. Un zoom
    // animé maintenant empêcherait le vrai cadrage, quand les lieux arrivent.
    if (noPlaces && chosenZoom.current === null) {
      map.setView([lat, lon], map.getZoom(), { animate: false })
      return
    }
    return whenIdle(map, () => {
      // Elle a réglé le zoom elle-même : revenir à sa position le garde, sans la forcer à rezoomer.
      if (chosenZoom.current !== null) map.setView([lat, lon], chosenZoom.current, { animate: !REDUCED_MOTION })
      // Un cercle centré sur soi : on reste au milieu de la carte, quel que soit le côté des lieux.
      else map.fitBounds(L.latLng(lat, lon).toBounds(radius * 2), { padding: [24, 24], maxZoom: STREET_ZOOM, animate: !REDUCED_MOTION })
    })
  }, [map, hasTrace, frozen, lat, lon, radius, noPlaces, chosenZoom])

  return null
}

/**
 * Leaflet ignore un recadrage pendant une animation de zoom : les lieux arrivent souvent pendant le
 * premier cadrage, on attend donc qu'il finisse. Renvoie de quoi annuler l'attente.
 */
function whenIdle(map: L.Map, fit: () => void): (() => void) | undefined {
  if ((map as L.Map & { _animatingZoom?: boolean })._animatingZoom) {
    map.once('zoomend', fit)
    return () => { map.off('zoomend', fit) }
  }
  fit()
}
