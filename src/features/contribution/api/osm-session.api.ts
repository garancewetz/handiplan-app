import { WRITE_API, OSM_CLIENT_ID, OSM_WRITE_URL } from '~/features/contribution/constants/osm.constants'
import { digest, randomSecret } from '~/features/contribution/utils/pkce.utils'

// La clé d'accès reste sur le téléphone, rangée par serveur : celle du serveur de test ne doit jamais
// servir sur la vraie carte, et inversement.
const TOKEN_KEY = `osm-jeton:${OSM_WRITE_URL}`
const PENDING_KEY = 'osm-connexion-en-cours'

// Lire son pseudo, et modifier la carte : rien d'autre.
const SCOPE = 'read_prefs write_api'

const back = () => `${window.location.origin}/`

export function token(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function forgetToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* rien à oublier */ }
}

/** Part sur la page de connexion d'OpenStreetMap ; on revient sur l'appli avec un code. */
export async function signInToOsm() {
  if (!OSM_CLIENT_ID) throw new Error('Appli non enregistrée sur OpenStreetMap (VITE_OSM_CLIENT_ID)')
  const secret = randomSecret()
  const state = randomSecret()
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ secret, state }))
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OSM_CLIENT_ID,
    redirect_uri: back(),
    scope: SCOPE,
    state: state,
    code_challenge: await digest(secret),
    code_challenge_method: 'S256',
  })
  window.location.assign(`${OSM_WRITE_URL}/oauth2/authorize?${params}`)
}

/**
 * Au retour de la page de connexion : échange le code contre la clé d'accès, puis efface le code de
 * l'adresse. Ne fait rien si l'on n'arrive pas de la connexion.
 */
export async function finishSignIn(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const pending = sessionStorage.getItem(PENDING_KEY)
  if (!code || !pending || !OSM_CLIENT_ID) return false
  sessionStorage.removeItem(PENDING_KEY)
  window.history.replaceState(null, '', window.location.pathname)
  const { secret, state } = JSON.parse(pending) as { secret: string; state: string }
  // Un retour qui ne porte pas notre « état » ne vient pas de notre demande : on l'ignore.
  if (params.get('state') !== state) return false

  const answer = await fetch(`${OSM_WRITE_URL}/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: back(), client_id: OSM_CLIENT_ID, code_verifier: secret }),
  })
  if (!answer.ok) throw new Error(`Connexion OSM ${answer.status}`)
  const { access_token: access } = (await answer.json()) as { access_token?: string }
  if (!access) throw new Error('Connexion OSM : pas de clé reçue')
  localStorage.setItem(TOKEN_KEY, access)
  return true
}

/** Le pseudo du compte connecté : les modifications seront signées de ce nom. */
export async function username(key: string): Promise<string> {
  const answer = await fetch(`${WRITE_API}/user/details.json`, { headers: { Authorization: `Bearer ${key}` } })
  if (answer.status === 401) { forgetToken(); throw new Error('Connexion OSM expirée') }
  if (!answer.ok) throw new Error(`Compte OSM ${answer.status}`)
  return ((await answer.json()) as { user: { display_name: string } }).user.display_name
}
