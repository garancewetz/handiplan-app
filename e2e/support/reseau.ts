import type { Page, Request } from '@playwright/test'
import { ACCESLIBRE, ADRESSE_MARAIS, TRAJET, TUILE_VIDE } from '../donnees/reponses'

const json = (corps: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(corps) })

/**
 * Simule tous les services extérieurs : la page ne parle jamais à internet. Rend la liste des envois
 * faits au serveur de test OpenStreetMap, pour vérifier ce qui serait publié.
 */
export async function simulerReseau(page: Page) {
  const envoisOsm: Request[] = []

  // Fond de carte IGN : des tuiles vides, la carte s'affiche vite et toujours pareil.
  await page.route('https://data.geopf.fr/wmts**', r => r.fulfill({ status: 200, contentType: 'image/png', body: TUILE_VIDE }))
  // Overpass (hors mode démo) : en panne, comme le 8 novembre 2026. Un test peut le remplacer.
  await page.route(/overpass|maps\.mail\.ru/, r => r.fulfill({ status: 504, body: 'Gateway Time-out' }))
  // Acceslibre.
  await page.route('https://tabular-api.data.gouv.fr/**', r => {
    // Comme l'API tabulaire : seulement les activités demandées (« activite__in », entre guillemets).
    const activites = new URL(r.request().url()).searchParams.get('activite__in') ?? ''
    const lignes = ACCESLIBRE.filter(l => activites.includes(`"${l.activite}"`))
    return r.fulfill(json({ data: lignes, meta: { total: lignes.length }, links: { next: null } }))
  })
  // Recherche d'adresses (IGN) et de lieux par nom (Photon).
  await page.route('https://data.geopf.fr/geocodage/search**', r => {
    const index = new URL(r.request().url()).searchParams.get('index')
    const adresse = { geometry: { coordinates: [ADRESSE_MARAIS.lon, ADRESSE_MARAIS.lat] }, properties: { _type: 'address', label: ADRESSE_MARAIS.label } }
    return r.fulfill(json({ features: index === 'address' ? [adresse] : [] }))
  })
  await page.route('https://data.geopf.fr/geocodage/reverse**', r => r.fulfill(json({ features: [{ properties: { label: '8 Place de l’Hôtel de Ville 75004 Paris' } }] })))
  await page.route('https://photon.komoot.io/**', r => r.fulfill(json({ features: [] })))
  // Trajet (IGN).
  await page.route('https://data.geopf.fr/navigation/**', r => r.fulfill(json(TRAJET)))
  // OpenStreetMap : lecture de l'élément sur la vraie carte, écriture sur le serveur de test.
  await page.route('https://api.openstreetmap.org/api/0.6/**', r => r.fulfill(json({
    elements: [{ type: 'node', id: 1, version: 3, lat: 48.8574, lon: 2.3527, tags: { name: 'Marlette', amenity: 'cafe', wheelchair: 'limited' } }],
  })))
  await page.route('https://master.apis.dev.openstreetmap.org/**', r => {
    const url = r.request().url()
    if (url.includes('/user/details.json')) return r.fulfill(json({ user: { display_name: 'compte_essai' } }))
    envoisOsm.push(r.request())
    return r.fulfill({ status: 200, contentType: 'text/plain', body: url.includes('/changeset/create') ? '778' : '' })
  })

  return { envoisOsm }
}

/** Se connecte au serveur de test OSM, comme après le retour de la page de connexion. */
export async function connecterOsm(page: Page) {
  await page.addInitScript(() => localStorage.setItem('osm-jeton:https://master.apis.dev.openstreetmap.org', 'jeton-e2e'))
}

/** Remplace l'ouverture d'une autre appli (Waze, Google Maps) : on note l'adresse au lieu de partir. */
export async function retenirOuvertures(page: Page) {
  await page.addInitScript(() => {
    const ouvertures: string[] = []
    Object.assign(window, { ouvertures })
    window.open = (url?: string | URL) => { ouvertures.push(String(url)); return null }
  })
  return () => page.evaluate(() => (window as unknown as { ouvertures: string[] }).ouvertures)
}
