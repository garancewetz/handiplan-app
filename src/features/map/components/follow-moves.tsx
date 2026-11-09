import { useEffect, useRef, type RefObject } from 'react'
import { useMapEvents } from 'react-leaflet'
import { MOVE_DEBOUNCE } from '~/constants/search.constants'
import type { Point } from '~/types/place.types'

type Props = {
  onGesture: () => void
  onMoved: (center: Point, zoom: number) => void
  /** retient le zoom fait à la main */
  chosenZoom: RefObject<number | null>
}

/**
 * Signale les déplacements faits à la main, une fois la carte immobile depuis un instant.
 * Les recadrages de l'appli (fitBounds) déclenchent aussi `moveend` : on ne retient que ceux qui
 * suivent un geste (glisser, molette, pincer, double-toucher, clavier).
 */
export function FollowMoves({ onGesture, onMoved, chosenZoom }: Props) {
  const gesture = useRef(false)
  const zoomIn = useRef<number | null>(null)
  const waiting = useRef<ReturnType<typeof setTimeout>>(undefined)
  const map = useMapEvents({
    moveend: () => {
      if (!gesture.current) return
      gesture.current = false
      // Un zoom fait à la main est retenu (glisser seul ne change rien au zoom).
      if (map.getZoom() !== zoomIn.current) chosenZoom.current = map.getZoom()
      clearTimeout(waiting.current)
      waiting.current = setTimeout(() => {
        const { lat, lng } = map.getCenter()
        onMoved({ lat, lon: lng }, map.getZoom())
      }, MOVE_DEBOUNCE)
    },
  })

  useEffect(() => {
    const begin = () => {
      if (!gesture.current) zoomIn.current = map.getZoom()
      gesture.current = true
      clearTimeout(waiting.current)
      onGesture()
    }
    map.on('dragstart', begin)
    // En capture : Leaflet peut zoomer dans son propre gestionnaire, avant que l'événement ne remonte.
    const container = map.getContainer()
    const onTouch = (e: TouchEvent) => { if (e.touches.length > 1) begin() }
    // Les boutons + et − de la carte comptent comme un geste fait à la main.
    const onPinClick = (e: MouseEvent) => { if ((e.target as Element).closest('[data-gesture]')) begin() }
    const options = { capture: true, passive: true }
    container.addEventListener('click', onPinClick, options)
    container.addEventListener('wheel', begin, options)
    container.addEventListener('dblclick', begin, options)
    container.addEventListener('keydown', begin, options)
    container.addEventListener('touchstart', onTouch, options)
    return () => {
      map.off('dragstart', begin)
      container.removeEventListener('click', onPinClick, options)
      container.removeEventListener('wheel', begin, options)
      container.removeEventListener('dblclick', begin, options)
      container.removeEventListener('keydown', begin, options)
      container.removeEventListener('touchstart', onTouch, options)
    }
  }, [map, onGesture])

  // Seulement en quittant la carte : un déplacement en attente n'a plus personne à prévenir.
  useEffect(() => () => clearTimeout(waiting.current), [])

  return null
}
