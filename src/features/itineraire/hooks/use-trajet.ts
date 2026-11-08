import { useRef, useState } from 'react'
import { calculerTrajet, modeConseille, type Trajet } from '~/features/itineraire/api/itineraire.api'
import type { Lieu, Point } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'

/**
 * Chemin vers un lieu, calculé depuis là où l'on est vraiment (même quand la carte montre
 * l'arrivée). Une nouvelle demande rend la précédente caduque.
 */
export function useTrajet(depart: Point | null) {
  const [vers, setVers] = useState<Lieu | null>(null)
  const [trajet, setTrajet] = useState<Trajet | null>(null)
  const [echec, setEchec] = useState(false)
  const derniere = useRef(0)

  function fermer() {
    derniere.current++
    setVers(null)
    setTrajet(null)
    setEchec(false)
  }

  function allerVers(lieu: Lieu) {
    fermer()
    setVers(lieu)
    if (!depart) { setEchec(true); return }
    const numero = derniere.current
    const mode = modeConseille(lieu.type === 'parking', distanceMetres(depart, lieu))
    calculerTrajet(depart, lieu, mode)
      .then(t => { if (numero === derniere.current) setTrajet(t) })
      .catch(() => { if (numero === derniere.current) setEchec(true) })
  }

  return { vers, trajet, echec, allerVers, fermer }
}
