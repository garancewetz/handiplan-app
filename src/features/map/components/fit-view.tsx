import { useEffect, type RefObject } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { REDUCED_MOTION } from '~/constants/motion.constants'
import type { Place, Point } from '~/types/place.types'

type Props = {
  centre: Point
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
export function FitView({ centre, places, trace, frozen, chosenZoom }: Props) {
  const map = useMap()
  const radius = Math.max(MIN_RADIUS_M, Math.min(...places.map(l => l.metres)))
  const key = trace ? `trace:${trace.length}:${trace[0]}` : [frozen, centre.lat, centre.lon, radius].join()
  useEffect(() => {
    // Une carte qui saute sous le doigt désoriente : après un déplacement à la main, seul un
    // nouveau chemin (geste explicite) la recadre.
    if (frozen && !trace) return
    // Sans lieux (pas encore arrivés, ou aucun ici) : on se centre sans changer le zoom. Un zoom
    // animé maintenant empêcherait le vrai cadrage, quand les lieux arrivent.
    if (!trace && places.length === 0 && chosenZoom.current === null) {
      map.setView([centre.lat, centre.lon], map.getZoom(), { animate: false })
      return
    }
    const fitView = () => {
      // Elle a réglé le zoom elle-même : revenir à sa position le garde, sans la forcer à rezoomer.
      if (!trace && chosenZoom.current !== null) map.setView([centre.lat, centre.lon], chosenZoom.current, { animate: !REDUCED_MOTION })
      else if (trace?.length) map.fitBounds(trace, { padding: [36, 36], maxZoom: 18, animate: !REDUCED_MOTION })
      // Un cercle centré sur soi : on reste au milieu de la carte, quel que soit le côté des lieux.
      else map.fitBounds(L.latLng(centre.lat, centre.lon).toBounds(radius * 2), { padding: [24, 24], maxZoom: STREET_ZOOM, animate: !REDUCED_MOTION })
    }
    // Leaflet ignore un recadrage pendant une animation de zoom : les lieux arrivent souvent pendant
    // le premier cadrage, on attend donc qu'il finisse.
    if ((map as L.Map & { _animatingZoom?: boolean })._animatingZoom) {
      map.once('zoomend', fitView)
      return () => { map.off('zoomend', fitView) }
    }
    fitView()
    // `cle` résume ce qui compte : on ne recadre pas à chaque nouveau tableau identique.
  }, [map, key]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
