import { useEffect, useRef, useState } from 'react'
import { loadProgressively, type Loading } from '~/features/places/api/places.api'
import { keepNeighbors, measureFrom } from '~/features/places/utils/nearby.utils'
import type { Place, Point } from '~/types/place.types'

/**
 * Lieux et places autour d'un point, affichés au fur et à mesure que chaque source répond.
 * Quand le point change (carte déplacée), les lieux voisins déjà chargés restent affichés.
 * Les distances sont mesurées depuis `reference` (moi ou l'arrivée), pas depuis le point chargé.
 */
export function usePlaces(center: Point | null, reference: Point | null) {
  const [loading, setLoading] = useState<Loading>({ places: [], inFlight: [], down: [] })
  const [attempt, setAttempt] = useState(0)
  // Les lieux affichés au moment où l'on change de zone : la base qu'on complète.
  const shown = useRef<Place[]>([])

  useEffect(() => {
    shown.current = loading.places
  }, [loading.places])

  // Suivre lat/lon plutôt que l'objet : un nouvel objet au même endroit ne doit pas tout recharger.
  const lat = center?.lat
  const lon = center?.lon
  useEffect(() => {
    if (lat === undefined || lon === undefined) return
    const point = { lat, lon }
    const stale = shown.current
    return loadProgressively(point, next => setLoading({ ...next, places: keepNeighbors(stale, next.places, point) }))
  }, [lat, lon, attempt])

  const since = reference ?? center
  return {
    ...loading,
    places: since ? measureFrom(loading.places, since) : loading.places,
    finished: loading.inFlight.length === 0,
    retry: () => setAttempt(n => n + 1),
  }
}
