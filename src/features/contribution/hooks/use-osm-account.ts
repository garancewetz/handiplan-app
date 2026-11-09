import { useEffect, useState } from 'react'
import { token, forgetToken, username, signInToOsm, finishSignIn } from '~/features/contribution/api/osm-session.api'
import { OSM_CLIENT_ID } from '~/features/contribution/constants/osm.constants'

/**
 * Le compte OpenStreetMap de la personne : termine la connexion au retour de la page d'OSM, puis
 * retrouve son pseudo. `available` est faux tant que l'appli n'est pas enregistrée sur OSM.
 */
export function useOsmAccount() {
  const [name, setName] = useState<string | null>(null)
  const [osmToken, setOsmToken] = useState<string | null>(token)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    finishSignIn()
      .then(ok => { if (ok) setOsmToken(token()) })
      .catch(() => setError('La connexion à OpenStreetMap n’a pas marché.'))
  }, [])

  useEffect(() => {
    if (!osmToken) { setName(null); return }
    username(osmToken).then(setName, () => { setOsmToken(null); setName(null) })
  }, [osmToken])

  return {
    available: Boolean(OSM_CLIENT_ID),
    osmToken,
    name,
    error,
    signIn: () => { signInToOsm().catch(() => setError('La connexion à OpenStreetMap n’a pas marché.')) },
    signOut: () => { forgetToken(); setOsmToken(null) },
  }
}
