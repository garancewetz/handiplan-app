import { useState } from 'react'
import { lireRecentes, memoriserRecente, type Destination } from '~/features/itineraire/utils/adresses-recentes.utils'
import type { Lieu } from '~/types/lieu.types'

/** Les destinations déjà choisies (adresses et lieux), pour « Souvent » et « Récemment ». */
export function useDestinations() {
  const [recentes, setRecentes] = useState(lireRecentes)

  const retenir = (destination: Omit<Destination, 'fois'>) => setRecentes(memoriserRecente(destination))

  /** Un lieu choisi compte comme une destination : il reviendra dans « Récemment », puis « Souvent ». */
  const retenirLieu = (lieu: Lieu) =>
    retenir({ lat: lieu.lat, lon: lieu.lon, adresse: lieu.nom, lieu: { id: lieu.id, type: lieu.type, libelle: lieu.libelle } })

  /** Vrai s'il vient d'être retenu (choisi dans la recherche) : « Y aller » ne le compte pas deux fois. */
  const vientDEtreRetenu = (lieu: Lieu) => recentes[0]?.lieu?.id === lieu.id

  return { recentes, retenir, retenirLieu, vientDEtreRetenu }
}
