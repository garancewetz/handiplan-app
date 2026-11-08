import { chargerAcceslibre } from '~/features/lieux/api/acceslibre.api'
import { chargerLieux as chargerOsm } from '~/features/lieux/api/osm.api'
import { fusionner, trier } from '~/features/lieux/utils/fusion-lieux.utils'
import type { Lieu, Point, Source } from '~/types/lieu.types'

export type Chargement = {
  lieux: Lieu[]
  /** sources dont on attend encore la réponse */
  enCours: Source[]
  enPanne: Source[]
}

/**
 * Réunit OpenStreetMap (places handicapées, toilettes publiques, lieux accessibles) et Acceslibre
 * (détail des toilettes et de l'entrée). Chaque source s'affiche dès qu'elle répond : Acceslibre
 * répond en 2 à 3 s, alors qu'Overpass peut mettre une minute quand il est saturé.
 * Renvoie une fonction pour ignorer les réponses qui arriveraient après un changement de zone.
 */
export function chargerProgressivement(centre: Point, surChangement: (chargement: Chargement) => void): () => void {
  let annule = false
  let osm: Lieu[] = []
  let acceslibre: Lieu[] = []
  const enCours = new Set<Source>(['OpenStreetMap', 'Acceslibre'])
  const enPanne = new Set<Source>()

  const publier = () => {
    if (annule) return
    surChangement({ lieux: trier(fusionner(osm, acceslibre)), enCours: [...enCours], enPanne: [...enPanne] })
  }
  const suivre = (source: Source, promesse: Promise<Lieu[]>, ranger: (l: Lieu[]) => void) =>
    promesse
      .then(ranger)
      .catch(() => enPanne.add(source))
      .finally(() => { enCours.delete(source); publier() })

  publier()
  suivre('OpenStreetMap', chargerOsm(centre), l => { osm = l })
  suivre('Acceslibre', chargerAcceslibre(centre), l => { acceslibre = l })
  return () => { annule = true }
}
