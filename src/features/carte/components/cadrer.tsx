import { useEffect, type RefObject } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { MOUVEMENT_REDUIT } from '~/constants/mouvement.constants'
import type { Lieu, Point } from '~/types/lieu.types'

type Props = {
  centre: Point
  lieux: Lieu[]
  trace: [number, number][] | null
  figee: boolean
  /** le zoom choisi à la main, gardé pour « Ma position » */
  zoomChoisi: RefObject<number | null>
}

// Au plus près : le zoom où l'on voit sa rue ; et au moins ce rayon autour de soi.
const ZOOM_RUE = 18
const RAYON_MIN_M = 50

/**
 * Cadre la carte pour que l'essentiel soit visible : le chemin s'il y en a un, sinon le centre
 * (moi ou l'arrivée) au milieu, et juste assez autour pour voir le lieu le plus proche : on regarde
 * sa rue sans avoir à zoomer soi-même (docs/decisions/carte, D5).
 */
export function Cadrer({ centre, lieux, trace, figee, zoomChoisi }: Props) {
  const carte = useMap()
  const rayon = Math.max(RAYON_MIN_M, Math.min(...lieux.map(l => l.metres)))
  const cle = trace ? `trace:${trace.length}:${trace[0]}` : [figee, centre.lat, centre.lon, rayon].join()
  useEffect(() => {
    // Une carte qui saute sous le doigt désoriente : après un déplacement à la main, seul un
    // nouveau chemin (geste explicite) la recadre.
    if (figee && !trace) return
    // Sans lieux (pas encore arrivés, ou aucun ici) : on se centre sans changer le zoom. Un zoom
    // animé maintenant empêcherait le vrai cadrage, quand les lieux arrivent.
    if (!trace && lieux.length === 0 && zoomChoisi.current === null) {
      carte.setView([centre.lat, centre.lon], carte.getZoom(), { animate: false })
      return
    }
    const cadrer = () => {
      // Elle a réglé le zoom elle-même : revenir à sa position le garde, sans la forcer à rezoomer.
      if (!trace && zoomChoisi.current !== null) carte.setView([centre.lat, centre.lon], zoomChoisi.current, { animate: !MOUVEMENT_REDUIT })
      else if (trace?.length) carte.fitBounds(trace, { padding: [36, 36], maxZoom: 18, animate: !MOUVEMENT_REDUIT })
      // Un cercle centré sur soi : on reste au milieu de la carte, quel que soit le côté des lieux.
      else carte.fitBounds(L.latLng(centre.lat, centre.lon).toBounds(rayon * 2), { padding: [24, 24], maxZoom: ZOOM_RUE, animate: !MOUVEMENT_REDUIT })
    }
    // Leaflet ignore un recadrage pendant une animation de zoom : les lieux arrivent souvent pendant
    // le premier cadrage, on attend donc qu'il finisse.
    if ((carte as L.Map & { _animatingZoom?: boolean })._animatingZoom) {
      carte.once('zoomend', cadrer)
      return () => { carte.off('zoomend', cadrer) }
    }
    cadrer()
    // `cle` résume ce qui compte : on ne recadre pas à chaque nouveau tableau identique.
  }, [carte, cle]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
