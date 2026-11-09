import { useRef, useState } from 'react'
import { computeRoute, suggestedMode, type Route } from '~/features/itinerary/api/route.api'
import type { Place, Point } from '~/types/place.types'
import { distanceMeters } from '~/utils/distance.utils'

/**
 * Chemin vers un lieu, calculé depuis là où l'on est vraiment (même quand la carte montre
 * l'arrivée). Une nouvelle demande rend la précédente caduque.
 */
export function useRoute(departure: Point | null) {
  const [toward, setToward] = useState<Place | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [failure, setFailure] = useState(false)
  const latestRequest = useRef(0)

  function close() {
    latestRequest.current++
    setToward(null)
    setRoute(null)
    setFailure(false)
  }

  function goTo(place: Place) {
    close()
    setToward(place)
    if (!departure) { setFailure(true); return }
    const requestId = latestRequest.current
    const mode = suggestedMode(place.type === 'parking', distanceMeters(departure, place))
    computeRoute(departure, place, mode)
      .then(result => { if (requestId === latestRequest.current) setRoute(result) })
      .catch(() => { if (requestId === latestRequest.current) setFailure(true) })
  }

  return { toward, route, failure, goTo, close }
}
