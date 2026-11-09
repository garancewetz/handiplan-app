import { useEffect, useState } from 'react'
import { DEMO_MODE } from '~/constants/demo.constants'
import { farEnough } from '~/features/places/utils/nearby.utils'
import type { Point } from '~/types/place.types'

// Si la position est refusée ou indisponible, on centre sur Paris pour montrer quelque chose.
const DEFAULT_POSITION: Point = { lat: 48.8566, lon: 2.3522 }

/**
 * Suit la position en continu (docs/decisions/carte, D3).
 * `here` bouge à chaque relevé, pour le point sur la carte. `position` ne bouge qu'après un vrai
 * déplacement : c'est elle qui recharge les lieux, recadre la carte et mesure les distances, sinon
 * la liste se réordonnerait et la carte sauterait à chaque pas.
 */
export function usePosition() {
  const [here, setHere] = useState<Point | null>(DEMO_MODE ? DEFAULT_POSITION : null)
  const [position, setPosition] = useState<Point | null>(DEMO_MODE ? DEFAULT_POSITION : null)
  const [refused, setRefused] = useState(false)

  useEffect(() => {
    if (DEMO_MODE) return
    if (!navigator.geolocation) {
      setRefused(true)
      setPosition(DEFAULT_POSITION)
      return
    }
    let alreadySeen = false
    const id = navigator.geolocation.watchPosition(
      p => {
        alreadySeen = true
        const reading = { lat: p.coords.latitude, lon: p.coords.longitude }
        setRefused(false)
        setHere(reading)
        setPosition(before => before && !farEnough(before, reading) ? before : reading)
      },
      e => {
        // Un relevé manqué en route (tunnel, immeubles) ne doit pas renvoyer la carte à Paris :
        // on garde le dernier point connu, sauf si la localisation est refusée.
        if (e.code !== e.PERMISSION_DENIED && alreadySeen) return
        setRefused(true)
        setHere(null)
        setPosition(DEFAULT_POSITION)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return { here, position, refused }
}
