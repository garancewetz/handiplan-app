import { useRef, useState } from 'react'
import { computeRoute, suggestedMode, type Route } from '~/features/itinerary/api/route.api'
import type { Place, Point } from '~/types/place.types'
import { distanceMetres } from '~/utils/distance.utils'

/**
 * Chemin vers un lieu, calculé depuis là où l'on est vraiment (même quand la carte montre
 * l'arrivée). Une nouvelle demande rend la précédente caduque.
 */
export function useRoute(departure: Point | null) {
  const [toward, setToward] = useState<Place | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [failure, setFailure] = useState(false)
  const lastOne = useRef(0)

  function close() {
    lastOne.current++
    setToward(null)
    setRoute(null)
    setFailure(false)
  }

  function goTo(place: Place) {
    close()
    setToward(place)
    if (!departure) { setFailure(true); return }
    const numero = lastOne.current
    const mode = suggestedMode(place.type === 'parking', distanceMetres(departure, place))
    computeRoute(departure, place, mode)
      .then(t => { if (numero === lastOne.current) setRoute(t) })
      .catch(() => { if (numero === lastOne.current) setFailure(true) })
  }

  return { toward, route, failure, goTo, close }
}
