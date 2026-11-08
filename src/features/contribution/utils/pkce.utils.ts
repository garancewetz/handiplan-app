// La connexion à OpenStreetMap se fait sans serveur (OAuth 2 avec PKCE) : l'appli tire un secret au
// hasard, n'en envoie que l'empreinte en demandant l'autorisation, puis prouve qu'elle le connaît en
// échangeant le code reçu contre la clé d'accès.

const base64url = (octets: Uint8Array) =>
  btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function secretAleatoire(): string {
  const octets = new Uint8Array(32)
  crypto.getRandomValues(octets)
  return base64url(octets)
}

/** L'empreinte du secret (SHA-256), envoyée à OpenStreetMap à la place du secret. */
export async function empreinte(secret: string): Promise<string> {
  const condense = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return base64url(new Uint8Array(condense))
}
