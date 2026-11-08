import { useRef } from 'react'
import { MapContainer, Marker, Polyline } from 'react-leaflet'
import { BoutonsZoom } from '~/features/carte/components/boutons-zoom'
import { Cadrer } from '~/features/carte/components/cadrer'
import { FondCarte } from '~/features/carte/components/fond-carte'
import { SuivreDeplacements } from '~/features/carte/components/suivre-deplacements'
import { Pastilles } from '~/features/carte/components/pastilles'
import { ICONE_ARRIVEE, ICONE_ICI } from '~/features/carte/utils/marqueurs.utils'
import { COULEURS } from '~/constants/couleurs.constants'
import { MOUVEMENT_REDUIT } from '~/constants/mouvement.constants'
import type { Lieu, Point } from '~/types/lieu.types'

type Props = {
  centre: Point
  versArrivee: boolean
  lieux: Lieu[]
  placeChoisie: Lieu | null
  /** chemin calculé vers le lieu choisi */
  trace: [number, number][] | null
  /** position suivie en continu : le point bouge avec la personne */
  ici: Point | null
  /** la carte a été déplacée à la main : on ne la recadre plus quand de nouveaux lieux arrivent */
  figee: boolean
  onChoisir: (lieu: Lieu) => void
  /** dès le début d'un glissement ou d'un zoom fait à la main */
  onGeste: () => void
  /** centre et zoom de la carte, une fois le déplacement ou le zoom à la main terminé */
  onDeplacee: (centre: Point, zoom: number) => void
}

export function Carte({ centre, versArrivee, lieux, placeChoisie, trace, ici, figee, onChoisir, onGeste, onDeplacee }: Props) {
  // Le zoom qu'elle a choisi à la main, gardé tant que l'appli est ouverte.
  const zoomChoisi = useRef<number | null>(null)
  return (
    <MapContainer
      center={[centre.lat, centre.lon]}
      zoom={17}
      zoomControl={false}
      attributionControl
      zoomAnimation={!MOUVEMENT_REDUIT}
      markerZoomAnimation={!MOUVEMENT_REDUIT}
      fadeAnimation={!MOUVEMENT_REDUIT}
      className="h-full w-full"
    >
      <FondCarte />
      <Cadrer centre={centre} lieux={lieux} trace={trace} figee={figee} zoomChoisi={zoomChoisi} />
      <SuivreDeplacements onGeste={onGeste} onDeplacee={onDeplacee} zoomChoisi={zoomChoisi} />
      <BoutonsZoom />

      {trace && <Polyline positions={trace} pathOptions={{ color: COULEURS.mousse, weight: 8, opacity: .9, lineCap: 'round', lineJoin: 'round' }} />}

      {placeChoisie && (
        <Polyline
          positions={[[placeChoisie.lat, placeChoisie.lon], [centre.lat, centre.lon]]}
          pathOptions={{ color: COULEURS.encre, weight: 5, dashArray: '2 10', lineCap: 'round' }}
        />
      )}

      {/* Des repères, pas des boutons : ni le doigt ni le clavier ne s'y arrêtent. */}
      {versArrivee && <Marker position={[centre.lat, centre.lon]} icon={ICONE_ARRIVEE} interactive={false} keyboard={false} zIndexOffset={2000} />}
      {ici && <Marker position={[ici.lat, ici.lon]} icon={ICONE_ICI} interactive={false} keyboard={false} zIndexOffset={1000} />}
      <Pastilles lieux={lieux} placeChoisie={placeChoisie} onChoisir={onChoisir} />
    </MapContainer>
  )
}
