import { useEffect, useState } from 'react'
import { MapContainer, useMapEvents } from 'react-leaflet'
import { FondCarte } from '~/features/carte/components/fond-carte'
import { ajouterPoint } from '~/features/contribution/api/osm-edition.api'
import { SERVEUR_DE_TEST } from '~/features/contribution/constants/osm.constants'
import type { useCompteOsm } from '~/features/contribution/hooks/use-compte-osm'
import { COMMENTAIRE_PLACE, ETIQUETTES_PLACE } from '~/features/contribution/utils/questions.utils'
import { adresseProche } from '~/features/itineraire/api/adresse.api'
import { lienAjouterOsm } from '~/features/contribution/utils/liens-modification.utils'
import type { Point } from '~/types/lieu.types'
import { distanceMetres } from '~/utils/distance.utils'
import { Bouton } from '~/components/bouton'
import { classeBouton } from '~/constants/boutons.constants'

type Props = {
  depart: Point
  /** places handicapées déjà connues autour, pour ne pas en ajouter une en double */
  connues: Point[]
  compte: ReturnType<typeof useCompteOsm>
  onFermer: () => void
}

type Etape = 'placer' | 'verifier' | 'envoi' | 'merci' | 'erreur'

// En deçà, une place déjà connue est probablement la même.
const DOUBLON_M = 15

function SuivreCentre({ onCentre }: { onCentre: (p: Point) => void }) {
  const carte = useMapEvents({
    moveend: () => {
      const { lat, lng } = carte.getCenter()
      onCentre({ lat, lon: lng })
    },
  })
  return null
}

/**
 * Ajouter une place handicapée. Le GPS d'un téléphone se trompe souvent de 10 à 30 m : on la place
 * soi-même, la carte glissant sous un repère fixe (plus facile que de viser un petit point), et
 * l'adresse la plus proche confirme l'endroit. Connecté à OSM, on vérifie puis on l'ajoute sans
 * quitter l'appli ; sinon, OpenStreetMap s'ouvre à cet endroit (docs/decisions/signalement, D8).
 */
export function PlacerPlace({ depart, connues, compte, onFermer }: Props) {
  const [point, setPoint] = useState(depart)
  const [adresse, setAdresse] = useState<string | null>(null)
  const [etape, setEtape] = useState<Etape>('placer')
  const dansLAppli = compte.disponible

  useEffect(() => {
    const arret = new AbortController()
    adresseProche(point, arret.signal).then(setAdresse, () => setAdresse(null))
    return () => arret.abort()
  }, [point])

  async function ajouter() {
    if (!compte.cle) return
    setEtape('envoi')
    try {
      await ajouterPoint(compte.cle, point, ETIQUETTES_PLACE, COMMENTAIRE_PLACE)
      setEtape('merci')
    } catch {
      setEtape('erreur')
    }
  }

  if (etape === 'envoi') return <p role="status" className="py-6 text-center text-[22px] font-semibold">J’envoie…</p>

  if (etape === 'merci' || etape === 'erreur') {
    return (
      <>
        <p role={etape === 'erreur' ? 'alert' : 'status'} className="text-[21px] leading-7">
          {etape === 'erreur'
            ? 'Ça n’a pas marché : rien n’a été ajouté. Vérifiez la connexion internet, puis réessayez.'
            : SERVEUR_DE_TEST
              ? 'C’est fait, merci ! Essai réussi sur le serveur de test : la vraie carte n’a pas changé.'
              : 'C’est fait, merci ! La place est sur la carte, pour tout le monde.'}
        </p>
        <Bouton variante="principal" onClick={onFermer}>Fermer</Bouton>
      </>
    )
  }

  if (etape === 'verifier') {
    const proche = connues.map(p => distanceMetres(p, point)).filter(d => d <= DOUBLON_M).sort((a, b) => a - b)[0]
    return (
      <>
        {adresse && <p className="rounded-[20px] bg-white px-4 py-3.5 text-lg">Près du {adresse}</p>}
        {/* Une place en double ferait un faux repère : on prévient, sans bloquer. */}
        {proche !== undefined && (
          <p role="alert" className="rounded-[20px] bg-ambre-clair px-4 py-3.5 text-lg text-ambre-fonce">
            Une place est déjà connue à {Math.round(proche)} m. Vérifiez que ce n’est pas la même.
          </p>
        )}
        <Bouton variante="principal" onClick={ajouter}>Oui, ajouter</Bouton>
        <Bouton variante="secondaire" onClick={() => setEtape('placer')}>Corriger l’endroit</Bouton>
        <p className="text-lg text-doux">
          Signé {compte.nom} · visible par tous{SERVEUR_DE_TEST ? ' · serveur de test, la vraie carte ne change pas' : ''}
        </p>
      </>
    )
  }

  return (
    <>
      <p id="placer-aide" className="text-[21px] leading-7">Faites glisser la carte pour mettre le repère sur la place.</p>
      {/* Au clavier, la carte se déplace avec les flèches (Leaflet) : l'aide ci-dessus vaut aussi pour elle. */}
      <div role="region" aria-label="Carte pour placer la place" aria-describedby="placer-aide" className="relative h-64 shrink-0 overflow-hidden rounded-[24px]">
        {/* Sans inertie : la carte s'arrête là où le doigt la lâche, pour viser au mètre près. */}
        <MapContainer center={[point.lat, point.lon]} zoom={18} zoomControl={false} inertia={false} className="h-full w-full">
          <FondCarte />
          <SuivreCentre onCentre={setPoint} />
        </MapContainer>
        {/* Repère fixe au centre, au-dessus de la carte : sa pointe marque l'endroit exact. */}
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-[500] size-0">
          {/* Même repère que l'adresse cherchée, dont la pointe tombe au centre d'un cadre de 24 px. */}
          <div className="-translate-x-3 -translate-y-3">
            <div className="marqueur-moi arrivee bg-place!" />
          </div>
        </div>
      </div>
      <p role="status" className="min-h-7 text-lg">{adresse ? `Adresse la plus proche : ${adresse}` : ' '}</p>
      {!dansLAppli ? (
        <a href={lienAjouterOsm(point)} target="_blank" rel="noreferrer" onClick={onFermer} className={classeBouton('principal')}>
          C’est ici
        </a>
      ) : compte.cle && compte.nom ? (
        <Bouton variante="principal" onClick={() => setEtape('verifier')}>C’est ici</Bouton>
      ) : (
        <>
          <p className="text-lg text-doux">Pour l’ajouter, connectez-vous à OpenStreetMap (compte gratuit).</p>
          <Bouton variante="principal" onClick={compte.connecter}>Se connecter à OpenStreetMap</Bouton>
        </>
      )}
      <Bouton variante="secondaire" onClick={onFermer}>Annuler</Bouton>
    </>
  )
}
