import { useRef, useState, type TouchEvent } from 'react'

// Au-delà de cette distance vers le bas, on ferme ; en deçà, la fiche revient en place.
const THRESHOLD_PX = 90

/**
 * Fermer un panneau en le faisant glisser vers le bas avec le doigt, comme sur iPhone.
 * Renvoie le décalage à appliquer pendant le geste et les gestionnaires tactiles à poser sur le panneau.
 */
export function useSwipeToClose(onClose: () => void) {
  const departure = useRef<number | null>(null)
  const [offset, setOffset] = useState(0)

  const gestures = {
    onTouchStart: (e: TouchEvent) => {
      // Un panneau qui défile : tirer vers le bas remonte d'abord son contenu, on ne ferme que tout en haut.
      departure.current = e.currentTarget.scrollTop > 0 ? null : e.touches[0].clientY
    },
    onTouchMove: (e: TouchEvent) => {
      if (departure.current === null) return
      setOffset(Math.max(0, e.touches[0].clientY - departure.current))
    },
    onTouchEnd: () => {
      if (offset > THRESHOLD_PX) onClose()
      departure.current = null
      setOffset(0)
    },
  }

  return { offset, swipe: offset > 0, gestures }
}
