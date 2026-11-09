import { useRef } from 'react'
import { MapContainer, Marker, Polyline } from 'react-leaflet'
import { ZoomButtons } from '~/features/map/components/zoom-buttons'
import { FitView } from '~/features/map/components/fit-view'
import { BaseMap } from '~/features/map/components/base-map'
import { FollowMoves } from '~/features/map/components/follow-moves'
import { Pins } from '~/features/map/components/pins'
import { ARRIVAL_ICON, HERE_ICON } from '~/features/map/utils/markers.utils'
import { COLORS } from '~/constants/colors.constants'
import { REDUCED_MOTION } from '~/constants/motion.constants'
import type { Place, Point } from '~/types/place.types'

type Props = {
  center: Point
  towardArrival: boolean
  places: Place[]
  chosenSpot: Place | null
  /** chemin calculé vers le lieu choisi */
  trace: [number, number][] | null
  /** position suivie en continu : le point bouge avec la personne */
  here: Point | null
  /** la carte a été déplacée à la main : on ne la recadre plus quand de nouveaux lieux arrivent */
  frozen: boolean
  onChoose: (place: Place) => void
  /** dès le début d'un glissement ou d'un zoom fait à la main */
  onGesture: () => void
  /** centre et zoom de la carte, une fois le déplacement ou le zoom à la main terminé */
  onMoved: (center: Point, zoom: number) => void
}

export function PlacesMap({ center, towardArrival, places, chosenSpot, trace, here, frozen, onChoose, onGesture, onMoved }: Props) {
  // Le zoom qu'elle a choisi à la main, gardé tant que l'appli est ouverte.
  const chosenZoom = useRef<number | null>(null)
  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={17}
      zoomControl={false}
      attributionControl
      zoomAnimation={!REDUCED_MOTION}
      markerZoomAnimation={!REDUCED_MOTION}
      fadeAnimation={!REDUCED_MOTION}
      className="h-full w-full"
    >
      <BaseMap />
      <FitView center={center} places={places} trace={trace} frozen={frozen} chosenZoom={chosenZoom} />
      <FollowMoves onGesture={onGesture} onMoved={onMoved} chosenZoom={chosenZoom} />
      <ZoomButtons />

      {trace && <Polyline positions={trace} pathOptions={{ color: COLORS.moss, weight: 8, opacity: .9, lineCap: 'round', lineJoin: 'round' }} />}

      {chosenSpot && (
        <Polyline
          positions={[[chosenSpot.lat, chosenSpot.lon], [center.lat, center.lon]]}
          pathOptions={{ color: COLORS.ink, weight: 5, dashArray: '2 10', lineCap: 'round' }}
        />
      )}

      {/* Des repères, pas des boutons : ni le doigt ni le clavier ne s'y arrêtent. */}
      {towardArrival && <Marker position={[center.lat, center.lon]} icon={ARRIVAL_ICON} interactive={false} keyboard={false} zIndexOffset={2000} />}
      {here && <Marker position={[here.lat, here.lon]} icon={HERE_ICON} interactive={false} keyboard={false} zIndexOffset={1000} />}
      <Pins places={places} chosenSpot={chosenSpot} onChoose={onChoose} />
    </MapContainer>
  )
}
