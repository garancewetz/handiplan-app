import { API_ECRITURE, OSM_CLIENT_ID, OSM_ECRITURE } from '~/features/contribution/constants/osm.constants'
import { empreinte, secretAleatoire } from '~/features/contribution/utils/pkce.utils'

// La clé d'accès reste sur le téléphone, rangée par serveur : celle du serveur de test ne doit jamais
// servir sur la vraie carte, et inversement.
const CLE_JETON = `osm-jeton:${OSM_ECRITURE}`
const CLE_ATTENTE = 'osm-connexion-en-cours'

// Lire son pseudo, et modifier la carte : rien d'autre.
const PORTEE = 'read_prefs write_api'

const retour = () => `${window.location.origin}/`

export function jeton(): string | null {
  try { return localStorage.getItem(CLE_JETON) } catch { return null }
}

export function oublierJeton() {
  try { localStorage.removeItem(CLE_JETON) } catch { /* rien à oublier */ }
}

/** Part sur la page de connexion d'OpenStreetMap ; on revient sur l'appli avec un code. */
export async function seConnecter() {
  if (!OSM_CLIENT_ID) throw new Error('Appli non enregistrée sur OpenStreetMap (VITE_OSM_CLIENT_ID)')
  const secret = secretAleatoire()
  const etat = secretAleatoire()
  sessionStorage.setItem(CLE_ATTENTE, JSON.stringify({ secret, etat }))
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OSM_CLIENT_ID,
    redirect_uri: retour(),
    scope: PORTEE,
    state: etat,
    code_challenge: await empreinte(secret),
    code_challenge_method: 'S256',
  })
  window.location.assign(`${OSM_ECRITURE}/oauth2/authorize?${params}`)
}

/**
 * Au retour de la page de connexion : échange le code contre la clé d'accès, puis efface le code de
 * l'adresse. Ne fait rien si l'on n'arrive pas de la connexion.
 */
export async function terminerConnexion(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const enAttente = sessionStorage.getItem(CLE_ATTENTE)
  if (!code || !enAttente || !OSM_CLIENT_ID) return false
  sessionStorage.removeItem(CLE_ATTENTE)
  window.history.replaceState(null, '', window.location.pathname)
  const { secret, etat } = JSON.parse(enAttente) as { secret: string; etat: string }
  // Un retour qui ne porte pas notre « état » ne vient pas de notre demande : on l'ignore.
  if (params.get('state') !== etat) return false

  const reponse = await fetch(`${OSM_ECRITURE}/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: retour(), client_id: OSM_CLIENT_ID, code_verifier: secret }),
  })
  if (!reponse.ok) throw new Error(`Connexion OSM ${reponse.status}`)
  const { access_token: acces } = (await reponse.json()) as { access_token?: string }
  if (!acces) throw new Error('Connexion OSM : pas de clé reçue')
  localStorage.setItem(CLE_JETON, acces)
  return true
}

/** Le pseudo du compte connecté : les modifications seront signées de ce nom. */
export async function pseudo(cle: string): Promise<string> {
  const reponse = await fetch(`${API_ECRITURE}/user/details.json`, { headers: { Authorization: `Bearer ${cle}` } })
  if (reponse.status === 401) { oublierJeton(); throw new Error('Connexion OSM expirée') }
  if (!reponse.ok) throw new Error(`Compte OSM ${reponse.status}`)
  return ((await reponse.json()) as { user: { display_name: string } }).user.display_name
}
