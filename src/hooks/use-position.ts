import { useEffect, useState } from 'react'
import { MODE_DEMO } from '~/constants/demo.constants'
import { assezLoin } from '~/features/lieux/utils/voisinage.utils'
import type { Point } from '~/types/lieu.types'

// Si la position est refusée ou indisponible, on centre sur Paris pour montrer quelque chose.
const PAR_DEFAUT: Point = { lat: 48.8566, lon: 2.3522 }

/**
 * Suit la position en continu (docs/decisions/carte, D3).
 * `ici` bouge à chaque relevé, pour le point sur la carte. `position` ne bouge qu'après un vrai
 * déplacement : c'est elle qui recharge les lieux, recadre la carte et mesure les distances, sinon
 * la liste se réordonnerait et la carte sauterait à chaque pas.
 */
export function usePosition() {
  const [ici, setIci] = useState<Point | null>(MODE_DEMO ? PAR_DEFAUT : null)
  const [position, setPosition] = useState<Point | null>(MODE_DEMO ? PAR_DEFAUT : null)
  const [refusee, setRefusee] = useState(false)

  useEffect(() => {
    if (MODE_DEMO) return
    if (!navigator.geolocation) {
      setRefusee(true)
      setPosition(PAR_DEFAUT)
      return
    }
    let dejaVue = false
    const id = navigator.geolocation.watchPosition(
      p => {
        dejaVue = true
        const releve = { lat: p.coords.latitude, lon: p.coords.longitude }
        setRefusee(false)
        setIci(releve)
        setPosition(avant => avant && !assezLoin(avant, releve) ? avant : releve)
      },
      e => {
        // Un relevé manqué en route (tunnel, immeubles) ne doit pas renvoyer la carte à Paris :
        // on garde le dernier point connu, sauf si la localisation est refusée.
        if (e.code !== e.PERMISSION_DENIED && dejaVue) return
        setRefusee(true)
        setIci(null)
        setPosition(PAR_DEFAUT)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return { ici, position, refusee }
}
