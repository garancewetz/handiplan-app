import { useEffect, useRef, useState } from 'react'
import { chargerProgressivement, type Chargement } from '~/features/lieux/api/lieux.api'
import { garderVoisins, mesurerDepuis } from '~/features/lieux/utils/voisinage.utils'
import type { Lieu, Point } from '~/types/lieu.types'

/**
 * Lieux et places autour d'un point, affichés au fur et à mesure que chaque source répond.
 * Quand le point change (carte déplacée), les lieux voisins déjà chargés restent affichés.
 * Les distances sont mesurées depuis `reference` (moi ou l'arrivée), pas depuis le point chargé.
 */
export function useLieux(centre: Point | null, reference: Point | null) {
  const [chargement, setChargement] = useState<Chargement>({ lieux: [], enCours: [], enPanne: [] })
  const [essai, setEssai] = useState(0)
  // Les lieux affichés au moment où l'on change de zone : la base qu'on complète.
  const affiches = useRef<Lieu[]>([])

  useEffect(() => {
    affiches.current = chargement.lieux
  }, [chargement.lieux])

  useEffect(() => {
    if (!centre) return
    const anciens = affiches.current
    return chargerProgressivement(centre, nouveau => setChargement({ ...nouveau, lieux: garderVoisins(anciens, nouveau.lieux, centre) }))
    // Suivre lat/lon plutôt que l'objet : un nouvel objet au même endroit ne doit pas tout recharger.
  }, [centre?.lat, centre?.lon, essai]) // eslint-disable-line react-hooks/exhaustive-deps

  const depuis = reference ?? centre
  return {
    ...chargement,
    lieux: depuis ? mesurerDepuis(chargement.lieux, depuis) : chargement.lieux,
    termine: chargement.enCours.length === 0,
    reessayer: () => setEssai(n => n + 1),
  }
}
