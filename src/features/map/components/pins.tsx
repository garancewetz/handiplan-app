import { useState } from 'react'
import type L from 'leaflet'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { placeIcon } from '~/features/map/utils/markers.utils'
import { pinName } from '~/features/map/utils/pin.utils'
import { placesForMap, type Bounds } from '~/features/map/utils/selection.utils'
import type { Place } from '~/types/place.types'

type Props = {
  places: Place[]
  chosenSpot: Place | null
  onChoose: (place: Place) => void
}

function boundsOf(map: L.Map): Bounds {
  const b = map.getBounds()
  const { lat, lng } = map.getCenter()
  return { centre: { lat, lon: lng }, south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() }
}

/** Les pastilles des lieux qui sont dans le cadre de la carte, remises à jour à chaque déplacement. */
export function Pins({ places, chosenSpot, onChoose }: Props) {
  const map = useMap()
  const [bounds, setBounds] = useState<Bounds>(() => boundsOf(map))
  useMapEvents({ moveend: () => setBounds(boundsOf(map)) })
  const shownOnes = placesForMap(places, bounds)
  // La place où l'on se gare reste visible, même hors du cadre ou au-delà du nombre de pastilles.
  if (chosenSpot && !shownOnes.some(l => l.id === chosenSpot.id)) shownOnes.push(chosenSpot)

  return shownOnes.map(place => (
    <Marker
      key={place.id}
      position={[place.lat, place.lon]}
      icon={placeIcon(place, place.id === chosenSpot?.id)}
      // Les lieux difficiles ou sans info passent dessous : on lit d'abord ce qui est utile.
      zIndexOffset={place.state === 'no' || place.state === 'unknown' ? -1000 : 0}
      eventHandlers={{
        click: () => onChoose(place),
        // Une pastille est un bouton : Entrée ou Espace l'ouvre aussi (Leaflet ne le fait pas).
        add: e => (e.target as L.Marker).getElement()?.addEventListener('keydown', keyPressed => {
          if (keyPressed.key !== 'Enter' && keyPressed.key !== ' ') return
          keyPressed.preventDefault()
          onChoose(place)
        }),
      }}
      title={pinName(place)}
    />
  ))
}
