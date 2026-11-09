// La connexion à OpenStreetMap se fait sans serveur (OAuth 2 avec PKCE) : l'appli tire un secret au
// hasard, n'en envoie que l'empreinte en demandant l'autorisation, puis prouve qu'elle le connaît en
// échangeant le code reçu contre la clé d'accès.

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function randomSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

/** L'empreinte du secret (SHA-256), envoyée à OpenStreetMap à la place du secret. */
export async function digest(secret: string): Promise<string> {
  const compact = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return base64url(new Uint8Array(compact))
}
