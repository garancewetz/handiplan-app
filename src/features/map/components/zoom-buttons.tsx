import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

/**
 * Zoomer d'une seule main : pincer demande deux doigts. Deux gros boutons, en bas à droite, à leur
 * place habituelle (docs/decisions/interface, D16 et D20).
 */
export function ZoomButtons() {
  const map = useMap()
  const buttons = useRef<HTMLDivElement>(null)
  // Un double toucher sur un bouton ne doit pas, en plus, zoomer la carte dessous.
  useEffect(() => { if (buttons.current) L.DomEvent.disableClickPropagation(buttons.current) }, [])
  const style = 'flex size-13 items-center justify-center rounded-2xl bg-white text-3xl leading-none font-bold text-ink shadow-md'
  return (
    <div ref={buttons} className="absolute right-3 bottom-8 z-[500] flex flex-col gap-2">
      <button type="button" data-geste aria-label="Rapprocher" onClick={() => map.zoomIn()} className={style}>+</button>
      <button type="button" data-geste aria-label="Éloigner" onClick={() => map.zoomOut()} className={style}>−</button>
    </div>
  )
}
