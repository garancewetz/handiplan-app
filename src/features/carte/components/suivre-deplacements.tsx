import { useEffect, useRef, type RefObject } from 'react'
import { useMapEvents } from 'react-leaflet'
import { ATTENTE_DEPLACEMENT } from '~/constants/recherche.constants'
import type { Point } from '~/types/lieu.types'

type Props = {
  onGeste: () => void
  onDeplacee: (centre: Point, zoom: number) => void
  /** retient le zoom fait à la main */
  zoomChoisi: RefObject<number | null>
}

/**
 * Signale les déplacements faits à la main, une fois la carte immobile depuis un instant.
 * Les recadrages de l'appli (fitBounds) déclenchent aussi `moveend` : on ne retient que ceux qui
 * suivent un geste (glisser, molette, pincer, double-toucher, clavier).
 */
export function SuivreDeplacements({ onGeste, onDeplacee, zoomChoisi }: Props) {
  const geste = useRef(false)
  const zoomAvant = useRef<number | null>(null)
  const attente = useRef<ReturnType<typeof setTimeout>>(undefined)
  const commencer = () => {
    if (!geste.current) zoomAvant.current = carte.getZoom()
    geste.current = true
    clearTimeout(attente.current)
    onGeste()
  }
  const carte = useMapEvents({
    dragstart: commencer,
    moveend: () => {
      if (!geste.current) return
      geste.current = false
      // Un zoom fait à la main est retenu (glisser seul ne change rien au zoom).
      if (carte.getZoom() !== zoomAvant.current) zoomChoisi.current = carte.getZoom()
      clearTimeout(attente.current)
      attente.current = setTimeout(() => {
        const { lat, lng } = carte.getCenter()
        onDeplacee({ lat, lon: lng }, carte.getZoom())
      }, ATTENTE_DEPLACEMENT)
    },
  })

  useEffect(() => {
    // En capture : Leaflet peut zoomer dans son propre gestionnaire, avant que l'événement ne remonte.
    const conteneur = carte.getContainer()
    const surToucher = (e: TouchEvent) => { if (e.touches.length > 1) commencer() }
    // Les boutons + et − de la carte comptent comme un geste fait à la main.
    const surClic = (e: MouseEvent) => { if ((e.target as Element).closest('[data-geste]')) commencer() }
    const options = { capture: true, passive: true }
    conteneur.addEventListener('click', surClic, options)
    conteneur.addEventListener('wheel', commencer, options)
    conteneur.addEventListener('dblclick', commencer, options)
    conteneur.addEventListener('keydown', commencer, options)
    conteneur.addEventListener('touchstart', surToucher, options)
    return () => {
      conteneur.removeEventListener('click', surClic, options)
      conteneur.removeEventListener('wheel', commencer, options)
      conteneur.removeEventListener('dblclick', commencer, options)
      conteneur.removeEventListener('keydown', commencer, options)
      conteneur.removeEventListener('touchstart', surToucher, options)
      clearTimeout(attente.current)
    }
  }, [carte]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
