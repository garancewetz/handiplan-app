import type { Place, Point } from '~/types/place.types'

const OSM = 'https://www.openstreetmap.org'
// Le hashtag pré-rempli dans iD : la communauté peut suivre les modifications faites depuis l'appli
// (lignes directrices de l'édition organisée). Il va dans la partie « # » de l'adresse.
const HASHTAG = 'hashtags=handiplan'
// Le lien « Ajouter un établissement » de la page d'accueil d'Acceslibre (connexion demandée).
const ACCESLIBRE_ADD_URL = 'https://acceslibre.beta.gouv.fr/contrib/start/'

/** Ouvre l'éditeur d'OpenStreetMap sur le lieu lui-même (`node/123`, `way/45`…), pour changer ses étiquettes. */
export function osmEditLink(place: Place): string | null {
  const [type, id] = place.id.split('/')
  if (!['node', 'way', 'relation'].includes(type) || !/^\d+$/.test(id ?? '')) return null
  return `${OSM}/edit?editor=id&${type}=${id}#${HASHTAG}`
}

/** Ouvre l'éditeur d'OpenStreetMap au plus près d'un point, pour y ajouter ce qui manque. */
export const osmAddLink = (point: Point) => `${OSM}/edit?editor=id#map=20/${point.lat.toFixed(6)}/${point.lon.toFixed(6)}&${HASHTAG}`

export type Link = { text: string; url: string }

/**
 * Où modifier un lieu, du plus simple au plus complet. Acceslibre d'abord : son formulaire pose
 * les questions une à une. Un lieu absent d'Acceslibre peut y être ajouté. OpenStreetMap ensuite :
 * on y change directement les étiquettes du lieu.
 */
export function editLinks(place: Place): Link[] {
  const osm = osmEditLink(place)
  // Acceslibre décrit des établissements : pas les places handicapées dans la rue.
  const acceslibre = place.acceslibreLink
    ? { text: 'Compléter sur Acceslibre', url: place.acceslibreLink }
    : place.type !== 'parking' ? { text: 'Ajouter sur Acceslibre', url: ACCESLIBRE_ADD_URL } : null
  return [
    ...(acceslibre ? [acceslibre] : []),
    ...(osm ? [{ text: 'Modifier sur OpenStreetMap', url: osm }] : []),
  ]
}
