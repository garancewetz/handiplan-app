import { useState } from 'react'
import { assezLoin, tropDezoome } from '~/features/lieux/utils/voisinage.utils'
import type { Point } from '~/types/lieu.types'

/**
 * Ce que la carte regarde. Tant qu'on ne la touche pas, elle suit `centre` (sa position ou
 * l'arrivée). Déplacée à la main, elle se fige : on charge autour de ce qu'on regarde, et elle ne
 * saute plus sous le doigt. Trop dézoomée, elle ne montre plus de lieux (on invite à zoomer).
 */
export function useVueCarte(centre: Point | null) {
  const [figee, setFigee] = useState(false)
  const [centreVu, setCentreVu] = useState<Point | null>(null)
  const [dezoomee, setDezoomee] = useState(false)
  const chargerAutour = centreVu ?? centre

  function deplacer(vu: Point, zoom: number) {
    setDezoomee(tropDezoome(zoom))
    if (tropDezoome(zoom)) return
    if (!chargerAutour || assezLoin(chargerAutour, vu)) setCentreVu(vu)
  }

  /** Revient à `centre` : la carte suit de nouveau sa position ou l'arrivée. */
  function oublier() {
    setFigee(false)
    setCentreVu(null)
    setDezoomee(false)
  }

  return { figee, dezoomee, chargerAutour, geste: () => setFigee(true), deplacer, oublier }
}
