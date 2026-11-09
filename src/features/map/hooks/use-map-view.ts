import { useState } from 'react'
import { farEnough, tooZoomedOut } from '~/features/places/utils/nearby.utils'
import type { Point } from '~/types/place.types'

/**
 * Ce que la carte regarde. Tant qu'on ne la touche pas, elle suit `center` (sa position ou
 * l'arrivée). Déplacée à la main, elle se fige : on charge autour de ce qu'on regarde, et elle ne
 * saute plus sous le doigt. Trop dézoomée, elle ne montre plus de lieux (on invite à zoomer).
 */
export function useMapView(center: Point | null) {
  const [frozen, setFrozen] = useState(false)
  const [viewCenter, setViewCenter] = useState<Point | null>(null)
  const [zoomedOut, setZoomedOut] = useState(false)
  const loadAround = viewCenter ?? center

  function move(seen: Point, zoom: number) {
    setZoomedOut(tooZoomedOut(zoom))
    if (tooZoomedOut(zoom)) return
    if (!loadAround || farEnough(loadAround, seen)) setViewCenter(seen)
  }

  /** Revient à `center` : la carte suit de nouveau sa position ou l'arrivée. */
  function forget() {
    setFrozen(false)
    setViewCenter(null)
    setZoomedOut(false)
  }

  return { frozen, zoomedOut, loadAround, gesture: () => setFrozen(true), move, forget }
}
