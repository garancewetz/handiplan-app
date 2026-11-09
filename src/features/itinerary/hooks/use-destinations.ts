import { useState } from 'react'
import { readRecent, rememberRecent, type Destination } from '~/features/itinerary/utils/recent-addresses.utils'
import type { Place } from '~/types/place.types'

/** Les destinations déjà choisies (adresses et lieux), pour « Souvent » et « Récemment ». */
export function useDestinations() {
  const [recent, setRecent] = useState(readRecent)

  const remember = (destination: Omit<Destination, 'count'>) => setRecent(rememberRecent(destination))

  /** Un lieu choisi compte comme une destination : il reviendra dans « Récemment », puis « Souvent ». */
  const rememberPlace = (place: Place) =>
    remember({ lat: place.lat, lon: place.lon, address: place.name, place: { id: place.id, type: place.type, label: place.label } })

  /** Vrai s'il vient d'être retenu (choisi dans la recherche) : « Y aller » ne le compte pas deux fois. */
  const justRemembered = (place: Place) => recent[0]?.place?.id === place.id

  return { recent, remember, rememberPlace, justRemembered }
}
