import { useState } from 'react'
import type L from 'leaflet'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { iconeLieu } from '~/features/carte/utils/marqueurs.utils'
import { nomPastille } from '~/features/carte/utils/pastille.utils'
import { lieuxPourCarte, type Cadre } from '~/features/carte/utils/selection.utils'
import type { Lieu } from '~/types/lieu.types'

type Props = {
  lieux: Lieu[]
  placeChoisie: Lieu | null
  onChoisir: (lieu: Lieu) => void
}

function cadreDe(carte: L.Map): Cadre {
  const b = carte.getBounds()
  const { lat, lng } = carte.getCenter()
  return { centre: { lat, lon: lng }, sud: b.getSouth(), ouest: b.getWest(), nord: b.getNorth(), est: b.getEast() }
}

/** Les pastilles des lieux qui sont dans le cadre de la carte, remises à jour à chaque déplacement. */
export function Pastilles({ lieux, placeChoisie, onChoisir }: Props) {
  const carte = useMap()
  const [cadre, setCadre] = useState<Cadre>(() => cadreDe(carte))
  useMapEvents({ moveend: () => setCadre(cadreDe(carte)) })
  const montres = lieuxPourCarte(lieux, cadre)
  // La place où l'on se gare reste visible, même hors du cadre ou au-delà du nombre de pastilles.
  if (placeChoisie && !montres.some(l => l.id === placeChoisie.id)) montres.push(placeChoisie)

  return montres.map(lieu => (
    <Marker
      key={lieu.id}
      position={[lieu.lat, lieu.lon]}
      icon={iconeLieu(lieu, lieu.id === placeChoisie?.id)}
      // Les lieux difficiles ou sans info passent dessous : on lit d'abord ce qui est utile.
      zIndexOffset={lieu.etat === 'non' || lieu.etat === 'inconnu' ? -1000 : 0}
      eventHandlers={{
        click: () => onChoisir(lieu),
        // Une pastille est un bouton : Entrée ou Espace l'ouvre aussi (Leaflet ne le fait pas).
        add: e => (e.target as L.Marker).getElement()?.addEventListener('keydown', touche => {
          if (touche.key !== 'Enter' && touche.key !== ' ') return
          touche.preventDefault()
          onChoisir(lieu)
        }),
      }}
      title={nomPastille(lieu)}
    />
  ))
}
