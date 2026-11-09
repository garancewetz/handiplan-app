import { useEffect, useState } from 'react'
import { MapContainer, useMapEvents } from 'react-leaflet'
import { BaseMap } from '~/features/map/components/base-map'
import { addPoint } from '~/features/contribution/api/osm-edition.api'
import { TEST_SERVER } from '~/features/contribution/constants/osm.constants'
import type { useOsmAccount } from '~/features/contribution/hooks/use-osm-account'
import { SPOT_COMMENT, SPOT_TAGS } from '~/features/contribution/utils/questions.utils'
import { nearestAddress } from '~/features/itinerary/api/address.api'
import { osmAddLink } from '~/features/contribution/utils/edit-links.utils'
import type { Point } from '~/types/place.types'
import { distanceMeters } from '~/utils/distance.utils'
import { Button } from '~/components/button'
import { buttonClass } from '~/constants/buttons.constants'

type Props = {
  departure: Point
  /** places handicapées déjà connues autour, pour ne pas en ajouter une en double */
  known: Point[]
  account: ReturnType<typeof useOsmAccount>
  onClose: () => void
}

type Step = 'placing' | 'check' | 'sending' | 'thanks' | 'error'

// En deçà, une place déjà connue est probablement la même.
const DUPLICATE_M = 15

function FollowCenter({ onCenter }: { onCenter: (p: Point) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const { lat, lng } = map.getCenter()
      onCenter({ lat, lon: lng })
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
export function SpotPlacer({ departure, known, account, onClose }: Props) {
  const [point, setPoint] = useState(departure)
  const [address, setAddress] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('placing')
  const inApp = account.available

  useEffect(() => {
    const stop = new AbortController()
    nearestAddress(point, stop.signal).then(setAddress, () => setAddress(null))
    return () => stop.abort()
  }, [point])

  async function add() {
    if (!account.osmToken) return
    setStep('sending')
    try {
      await addPoint(account.osmToken, point, SPOT_TAGS, SPOT_COMMENT)
      setStep('thanks')
    } catch {
      setStep('error')
    }
  }

  if (step === 'sending') return <p role="status" className="py-6 text-center text-[22px] font-semibold">J’envoie…</p>

  if (step === 'thanks' || step === 'error') {
    return (
      <>
        <p role={step === 'error' ? 'alert' : 'status'} className="text-[21px] leading-7">
          {step === 'error'
            ? 'Ça n’a pas marché : rien n’a été ajouté. Vérifiez la connexion internet, puis réessayez.'
            : TEST_SERVER
              ? 'C’est fait, merci ! Essai réussi sur le serveur de test : la vraie carte n’a pas changé.'
              : 'C’est fait, merci ! La place est sur la carte, pour tout le monde.'}
        </p>
        <Button variant="primary" onClick={onClose}>Fermer</Button>
      </>
    )
  }

  if (step === 'check') {
    const near = known.map(p => distanceMeters(p, point)).filter(d => d <= DUPLICATE_M).sort((a, b) => a - b)[0]
    return (
      <>
        {address && <p className="rounded-[20px] bg-white px-4 py-3.5 text-lg">Près du {address}</p>}
        {/* Une place en double ferait un faux repère : on prévient, sans bloquer. */}
        {near !== undefined && (
          <p role="alert" className="rounded-[20px] bg-amber-light px-4 py-3.5 text-lg text-amber-dark">
            Une place est déjà connue à {Math.round(near)} m. Vérifiez que ce n’est pas la même.
          </p>
        )}
        <Button variant="primary" onClick={add}>Oui, ajouter</Button>
        <Button variant="secondary" onClick={() => setStep('placing')}>Corriger l’endroit</Button>
        <p className="text-lg text-muted">
          Signé {account.name} · visible par tous{TEST_SERVER ? ' · serveur de test, la vraie carte ne change pas' : ''}
        </p>
      </>
    )
  }

  return (
    <>
      <p id="spot-placer-help" className="text-[21px] leading-7">Faites glisser la carte pour mettre le repère sur la place.</p>
      {/* Au clavier, la carte se déplace avec les flèches (Leaflet) : l'aide ci-dessus vaut aussi pour elle. */}
      <div role="region" aria-label="Carte pour placer la place" aria-describedby="spot-placer-help" className="relative h-64 shrink-0 overflow-hidden rounded-[24px]">
        {/* Sans inertie : la carte s'arrête là où le doigt la lâche, pour viser au mètre près. */}
        <MapContainer center={[point.lat, point.lon]} zoom={18} zoomControl={false} inertia={false} className="h-full w-full">
          <BaseMap />
          <FollowCenter onCenter={setPoint} />
        </MapContainer>
        {/* Repère fixe au centre, au-dessus de la carte : sa pointe marque l'endroit exact. */}
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-[500] size-0">
          {/* Même repère que l'adresse cherchée, dont la pointe tombe au centre d'un cadre de 24 px. */}
          <div className="-translate-x-3 -translate-y-3">
            <div className="marker-self arrival bg-parking!" />
          </div>
        </div>
      </div>
      <p role="status" className="min-h-7 text-lg">{address ? `Adresse la plus proche : ${address}` : ' '}</p>
      {!inApp ? (
        <a href={osmAddLink(point)} target="_blank" rel="noreferrer" onClick={onClose} className={buttonClass('primary')}>
          C’est ici
        </a>
      ) : account.osmToken && account.name ? (
        <Button variant="primary" onClick={() => setStep('check')}>C’est ici</Button>
      ) : (
        <>
          <p className="text-lg text-muted">Pour l’ajouter, connectez-vous à OpenStreetMap (compte gratuit).</p>
          <Button variant="primary" onClick={account.signIn}>Se connecter à OpenStreetMap</Button>
        </>
      )}
      <Button variant="secondary" onClick={onClose}>Annuler</Button>
    </>
  )
}
