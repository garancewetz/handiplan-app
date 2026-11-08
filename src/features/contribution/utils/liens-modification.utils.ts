import type { Lieu, Point } from '~/types/lieu.types'

const OSM = 'https://www.openstreetmap.org'
// Le hashtag pré-rempli dans iD : la communauté peut suivre les modifications faites depuis l'appli
// (lignes directrices de l'édition organisée). Il va dans la partie « # » de l'adresse.
const HASHTAG = 'hashtags=handiplan'
// Le lien « Ajouter un établissement » de la page d'accueil d'Acceslibre (connexion demandée).
const AJOUTER_ACCESLIBRE = 'https://acceslibre.beta.gouv.fr/contrib/start/'

/** Ouvre l'éditeur d'OpenStreetMap sur le lieu lui-même (`node/123`, `way/45`…), pour changer ses étiquettes. */
export function lienModifierOsm(lieu: Lieu): string | null {
  const [type, id] = lieu.id.split('/')
  if (!['node', 'way', 'relation'].includes(type) || !/^\d+$/.test(id ?? '')) return null
  return `${OSM}/edit?editor=id&${type}=${id}#${HASHTAG}`
}

/** Ouvre l'éditeur d'OpenStreetMap au plus près d'un point, pour y ajouter ce qui manque. */
export const lienAjouterOsm = (point: Point) => `${OSM}/edit?editor=id#map=20/${point.lat.toFixed(6)}/${point.lon.toFixed(6)}&${HASHTAG}`

export type Lien = { texte: string; url: string }

/**
 * Où modifier un lieu, du plus simple au plus complet. Acceslibre d'abord : son formulaire pose
 * les questions une à une. Un lieu absent d'Acceslibre peut y être ajouté. OpenStreetMap ensuite :
 * on y change directement les étiquettes du lieu.
 */
export function liensModification(lieu: Lieu): Lien[] {
  const osm = lienModifierOsm(lieu)
  // Acceslibre décrit des établissements : pas les places handicapées dans la rue.
  const acceslibre = lieu.lienAcceslibre
    ? { texte: 'Compléter sur Acceslibre', url: lieu.lienAcceslibre }
    : lieu.type !== 'parking' ? { texte: 'Ajouter sur Acceslibre', url: AJOUTER_ACCESLIBRE } : null
  return [
    ...(acceslibre ? [acceslibre] : []),
    ...(osm ? [{ texte: 'Modifier sur OpenStreetMap', url: osm }] : []),
  ]
}
