import { useRef, useState, type TouchEvent } from 'react'

// Au-delà de cette distance vers le bas, on ferme ; en deçà, la fiche revient en place.
const SEUIL_PX = 90

/**
 * Fermer un panneau en le faisant glisser vers le bas avec le doigt, comme sur iPhone.
 * Renvoie le décalage à appliquer pendant le geste et les gestionnaires tactiles à poser sur le panneau.
 */
export function useGlisserPourFermer(onFermer: () => void) {
  const depart = useRef<number | null>(null)
  const [decalage, setDecalage] = useState(0)

  const gestes = {
    onTouchStart: (e: TouchEvent) => {
      // Un panneau qui défile : tirer vers le bas remonte d'abord son contenu, on ne ferme que tout en haut.
      depart.current = e.currentTarget.scrollTop > 0 ? null : e.touches[0].clientY
    },
    onTouchMove: (e: TouchEvent) => {
      if (depart.current === null) return
      setDecalage(Math.max(0, e.touches[0].clientY - depart.current))
    },
    onTouchEnd: () => {
      if (decalage > SEUIL_PX) onFermer()
      depart.current = null
      setDecalage(0)
    },
  }

  return { decalage, glisse: decalage > 0, gestes }
}
