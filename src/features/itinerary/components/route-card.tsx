import { useState } from 'react'
import type { Route } from '~/features/itinerary/api/route.api'
import { GPS_APPS, preferredApp, openGps, rememberApp, type GpsApp } from '~/features/itinerary/utils/gps.utils'
import type { Place } from '~/types/place.types'
import { formatDistance, formatDuration } from '~/utils/format.utils'
import { Button } from '~/components/button'

type Props = {
  place: Place
  route: Route | null
  /** le calcul a échoué : on propose directement le GPS */
  failure: boolean
  onClose: () => void
}

/** Le trajet vers un lieu, affiché en grand sous la carte, avec le bouton pour lancer le guidage. */
export function RouteCard({ place, route, failure, onClose }: Props) {
  const [choice, setChoice] = useState(false)
  const mode = route?.mode ?? (place.type === 'parking' ? 'car' : 'walk')

  function guide(app: GpsApp) {
    rememberApp(app)
    setChoice(false)
    openGps(place, mode, app)
  }

  function start() {
    const app = preferredApp()
    if (app) guide(app)
    else setChoice(true)
  }

  return (
    <div className="mb-2.5 flex flex-col gap-3 rounded-[22px] bg-white p-4">
      <p className="text-lg">Vers {place.name}</p>
      {route && (
        <p className="text-[28px] leading-8 font-bold">
          {mode === 'walk' ? 'À pied' : 'En voiture'} : {formatDuration(route.duration)}
          <span className="block text-xl font-semibold text-muted">{formatDistance(route.distance)}</span>
        </p>
      )}
      {!route && !failure && <p className="text-xl font-semibold">Je calcule le chemin…</p>}
      {failure && <p className="text-lg">Je n’ai pas pu calculer le chemin ici.</p>}

      {choice ? (
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">Avec quelle appli ?</p>
          {GPS_APPS.filter(a => mode === 'car' || a.id !== 'waze').map(a => (
            <button key={a.id} onClick={() => guide(a.id)} className="h-14 rounded-2xl border-2 border-moss text-xl font-semibold text-moss">
              {a.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2.5">
          {/* L'action principale à droite, à sa place habituelle (docs/decisions/interface, D20). « Ouvrir le
              GPS » dit ce qui va se passer : on quitte Handiplan pour l'appli de guidage. */}
          <Button variant="secondary" onClick={onClose} className="flex-1">Fermer</Button>
          <Button variant="primary" onClick={start} className="flex-[2]">Ouvrir le GPS</Button>
        </div>
      )}
    </div>
  )
}
