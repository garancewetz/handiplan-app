import { useEffect, useState } from 'react'
import { jeton, oublierJeton, pseudo, seConnecter, terminerConnexion } from '~/features/contribution/api/osm-session.api'
import { OSM_CLIENT_ID } from '~/features/contribution/constants/osm.constants'

/**
 * Le compte OpenStreetMap de la personne : termine la connexion au retour de la page d'OSM, puis
 * retrouve son pseudo. `disponible` est faux tant que l'appli n'est pas enregistrée sur OSM.
 */
export function useCompteOsm() {
  const [nom, setNom] = useState<string | null>(null)
  const [cle, setCle] = useState<string | null>(jeton)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    terminerConnexion()
      .then(ok => { if (ok) setCle(jeton()) })
      .catch(() => setErreur('La connexion à OpenStreetMap n’a pas marché.'))
  }, [])

  useEffect(() => {
    if (!cle) { setNom(null); return }
    pseudo(cle).then(setNom, () => { setCle(null); setNom(null) })
  }, [cle])

  return {
    disponible: Boolean(OSM_CLIENT_ID),
    cle,
    nom,
    erreur,
    connecter: () => { seConnecter().catch(() => setErreur('La connexion à OpenStreetMap n’a pas marché.')) },
    deconnecter: () => { oublierJeton(); setCle(null) },
  }
}
