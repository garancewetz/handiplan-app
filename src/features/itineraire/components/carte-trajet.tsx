import { useState } from 'react'
import type { Trajet } from '~/features/itineraire/api/itineraire.api'
import { APPLIS_GPS, appliPreferee, ouvrirGps, retenirAppli, type AppliGps } from '~/features/itineraire/utils/gps.utils'
import type { Lieu } from '~/types/lieu.types'
import { formaterDistance, formaterDuree } from '~/utils/format.utils'
import { Bouton } from '~/components/bouton'

type Props = {
  lieu: Lieu
  trajet: Trajet | null
  /** le calcul a échoué : on propose directement le GPS */
  echec: boolean
  onFermer: () => void
}

/** Le trajet vers un lieu, affiché en grand sous la carte, avec le bouton pour lancer le guidage. */
export function CarteTrajet({ lieu, trajet, echec, onFermer }: Props) {
  const [choix, setChoix] = useState(false)
  const mode = trajet?.mode ?? (lieu.type === 'parking' ? 'voiture' : 'pied')

  function guider(appli: AppliGps) {
    retenirAppli(appli)
    setChoix(false)
    ouvrirGps(lieu, mode, appli)
  }

  function demarrer() {
    const appli = appliPreferee()
    if (appli) guider(appli)
    else setChoix(true)
  }

  return (
    <div className="mb-2.5 flex flex-col gap-3 rounded-[22px] bg-white p-4">
      <p className="text-lg">Vers {lieu.nom}</p>
      {trajet && (
        <p className="text-[28px] leading-8 font-bold">
          {mode === 'pied' ? 'À pied' : 'En voiture'} : {formaterDuree(trajet.duree)}
          <span className="block text-xl font-semibold text-doux">{formaterDistance(trajet.distance)}</span>
        </p>
      )}
      {!trajet && !echec && <p className="text-xl font-semibold">Je calcule le chemin…</p>}
      {echec && <p className="text-lg">Je n’ai pas pu calculer le chemin ici.</p>}

      {choix ? (
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold">Avec quelle appli ?</p>
          {APPLIS_GPS.filter(a => mode === 'voiture' || a.id !== 'waze').map(a => (
            <button key={a.id} onClick={() => guider(a.id)} className="h-14 rounded-2xl border-2 border-mousse text-xl font-semibold text-mousse">
              {a.nom}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2.5">
          {/* L'action principale à droite, à sa place habituelle (docs/decisions/interface, D20). « Ouvrir le
              GPS » dit ce qui va se passer : on quitte Handiplan pour l'appli de guidage. */}
          <Bouton variante="secondaire" onClick={onFermer} className="flex-1">Fermer</Bouton>
          <Bouton variante="principal" onClick={demarrer} className="flex-[2]">Ouvrir le GPS</Bouton>
        </div>
      )}
    </div>
  )
}
