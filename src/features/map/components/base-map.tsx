import { useEffect } from 'react'
import { TileLayer, useMap } from 'react-leaflet'

/**
 * Leaflet ne voit pas quand son cadre change de taille (clavier du téléphone qui se ferme, rotation,
 * fenêtre qui s'ouvre en glissant) : sans ce rappel, une partie de la carte reste grise.
 */
function FollowSize() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

/**
 * Sur un téléphone, la mention « Leaflet » repoussait OpenStreetMap hors de l'écran. Les règles
 * d'attribution d'OSM demandent une mention lisible : on la met en premier, sans le préfixe.
 */
function ReadableAttribution() {
  const map = useMap()
  useEffect(() => { map.attributionControl?.setPrefix(false) }, [map])
  return null
}

/** Plan IGN (Géoplateforme, sans clé) : plus épuré que le fond OSM, adouci en CSS (.calm-tiles). */
export function BaseMap() {
  return (
    <>
      <TileLayer
        url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Plan <a href="https://www.ign.fr/">IGN</a>'
        className="calm-tiles"
        maxZoom={19}
      />
      <FollowSize />
      <ReadableAttribution />
    </>
  )
}
