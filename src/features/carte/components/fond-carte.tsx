import { useEffect } from 'react'
import { TileLayer, useMap } from 'react-leaflet'

/**
 * Leaflet ne voit pas quand son cadre change de taille (clavier du téléphone qui se ferme, rotation,
 * fenêtre qui s'ouvre en glissant) : sans ce rappel, une partie de la carte reste grise.
 */
function SuivreTaille() {
  const carte = useMap()
  useEffect(() => {
    const observateur = new ResizeObserver(() => carte.invalidateSize())
    observateur.observe(carte.getContainer())
    return () => observateur.disconnect()
  }, [carte])
  return null
}

/** Plan IGN (Géoplateforme, sans clé) : plus épuré que le fond OSM, adouci en CSS (.fond-calme). */
export function FondCarte() {
  return (
    <>
      <TileLayer
        url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png"
        attribution='Plan &copy; <a href="https://www.ign.fr/">IGN</a> · Lieux &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        className="fond-calme"
        maxZoom={19}
      />
      <SuivreTaille />
    </>
  )
}
