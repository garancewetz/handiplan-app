import { couleur, type Entree, type Toilettes } from '~/features/lieux/utils/couleur.utils'
import type { Etat, Lieu, Ligne, Reponse, Theme, TypeLieu } from '~/types/lieu.types'

export function typeOsm(t: Record<string, string>): TypeLieu | null {
  if (t.parking_space === 'disabled' || t.amenity === 'parking') return 'parking'
  if (t.amenity === 'toilets') return 'wc'
  if (t.amenity === 'cafe' || t.amenity === 'bar' || t.amenity === 'pub') return 'cafe'
  if (t.amenity === 'restaurant' || t.amenity === 'fast_food') return 'resto'
  return null
}

const LIBELLES: Record<string, string> = {
  cafe: 'Café', bar: 'Bar', pub: 'Bar', restaurant: 'Restaurant', fast_food: 'Restauration rapide',
  toilets: 'Toilettes publiques',
}

export function libelleOsm(type: TypeLieu, t: Record<string, string>) {
  if (type === 'parking') return 'Place handicapée'
  return LIBELLES[t.amenity] ?? 'Lieu'
}

/**
 * Étiquettes OSM lues par l'appli : seulement celles du wiki qui décrivent le handicap, avec leurs
 * définitions exactes (docs/decisions/interface, D12). Le script de préparation ne garde que
 * celles-ci (scripts/lib/prepare.mjs).
 */
export const ETIQUETTES_OSM = [
  'name', 'amenity', 'parking_space', 'capacity:disabled', 'wheelchair', 'toilets:wheelchair',
  'wheelchair:description', 'wheelchair:description:fr', 'step_count', 'ramp:wheelchair', 'automatic_door',
  'door:width', 'level', 'hearing_loop',
  // pour reconnaître le même lieu dans Acceslibre (docs/decisions/donnees, D11)
  'addr:housenumber', 'addr:street',
] as const

const INCONNU: Ligne = { theme: 'Entrée', reponse: 'attention', texte: 'Accessibilité inconnue', detail: 'Personne ne l’a encore renseignée' }
const CONSEIL_INCONNU = 'Vous y êtes ? Dites-nous si c’est accessible : ça aidera tout le monde.'

// FR:Key:wheelchair, dit comme on le voit sur place (des marches), le sens « fauteuil » du wiki
// dessous : l'utilisatrice marche, le fauteuil sert d'indicateur de facilité (docs/decisions/interface, D18).
const LIGNE_ENTREE: Record<Entree, Ligne> = {
  ok: { theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche', detail: 'Accessible en fauteuil' },
  partielle: { theme: 'Entrée', reponse: 'attention', texte: 'Une petite marche à l’entrée', detail: '7 cm au plus (accès partiel en fauteuil)' },
  non: { theme: 'Entrée', reponse: 'non', texte: 'Marche haute ou escalier à l’entrée', detail: 'Plus de 7 cm (pas accessible en fauteuil)' },
  inconnue: { theme: 'Entrée', reponse: 'attention', texte: 'Entrée : on ne sait pas' },
}

/** Pour des toilettes publiques, « wheelchair » décrit les toilettes elles-mêmes. */
const LIGNE_WC: Record<Exclude<Entree, 'inconnue'>, Ligne> = {
  ok: { theme: 'Toilettes', reponse: 'oui', texte: 'Toilettes faciles d’accès', detail: 'Sans marche, assez de place' },
  partielle: { theme: 'Toilettes', reponse: 'attention', texte: 'Toilettes : accès limité', detail: 'Petite marche, ou étroites' },
  non: { theme: 'Toilettes', reponse: 'non', texte: 'Toilettes difficiles d’accès', detail: 'Marche haute, ou trop étroites' },
}

// FR:Key:toilets:wheelchair : « yes » suppose porte large, espace pour tourner, barre d'appui.
const LIGNE_TOILETTES: Record<Toilettes, Ligne> = {
  oui: { theme: 'Toilettes', reponse: 'oui', texte: 'Toilettes adaptées', detail: 'Barre d’appui, porte large, place pour tourner' },
  non: { theme: 'Toilettes', reponse: 'non', texte: 'Toilettes non adaptées' },
  inconnues: { theme: 'Toilettes', reponse: 'attention', texte: 'Toilettes : on ne sait pas', detail: 'Le lieu ne l’a pas encore dit : à demander sur place' },
}

const oui = (v: string | undefined) => v === 'yes' || v === 'designated'

/** Les autres critères handicap du wiki, quand quelqu'un les a renseignés. Sans seuil officiel, on donne le fait sans le juger. */
function details(t: Record<string, string>, lignes: Ligne[]) {
  const dans = (theme: Theme) => (reponse: Reponse, texte: string, detail?: string) =>
    lignes.push({ theme, reponse, texte, ...(detail ? { detail } : {}) })
  const porte = dans('Entrée')
  const marches = Number(t.step_count)
  if (marches > 0) porte('info', `${marches} marche${marches > 1 ? 's' : ''}`)
  if (t['ramp:wheelchair'] === 'yes') porte('oui', 'Rampe à l’entrée')
  else if (t['ramp:wheelchair'] === 'no') porte('non', 'Pas de rampe')
  if (t.automatic_door && t.automatic_door !== 'no') porte('oui', 'Porte automatique')
  const largeur = Math.round(parseFloat(t['door:width']) * 100)
  if (largeur > 0) porte('info', `Porte de ${largeur} cm`)

  const niveau = Number(t.level)
  // OSM ne décrit pas l'ascenseur d'un lieu : on le dit, plutôt que de laisser croire qu'on y monte
  // facilement (docs/decisions/interface, D21).
  if (niveau > 0) dans('À l’intérieur')('attention', `Au ${niveau === 1 ? '1er' : `${niveau}e`} étage`, 'La carte ne dit pas s’il y a un ascenseur')
  else if (niveau < 0) dans('À l’intérieur')('attention', 'En sous-sol', 'La carte ne dit pas s’il y a un ascenseur')

  if (t.hearing_loop === 'yes') dans('Accueil')('oui', 'Boucle magnétique', 'Pour les personnes malentendantes')
  const description = t['wheelchair:description:fr'] ?? t['wheelchair:description']
  if (description) dans('Accueil')('info', 'Précision laissée par un visiteur', description)
}

/** Transforme les étiquettes OSM en lignes simples « oui / attention / non / info ». */
export function decrireOsm(type: TypeLieu, t: Record<string, string>): { etat: Etat; lignes: Ligne[]; conseil?: string; acces?: Lieu['acces'] } {
  const lignes: Ligne[] = []

  if (type === 'parking') {
    const nb = Number(t['capacity:disabled'])
    lignes.push({ theme: 'Se garer', reponse: 'oui', texte: nb > 1 ? `${nb} places handicapées` : 'Place handicapée' })
    return { etat: 'parking', lignes }
  }

  if (t.wheelchair === undefined && t['toilets:wheelchair'] === undefined) {
    details(t, lignes)
    return { etat: 'inconnu', lignes: [INCONNU, ...lignes], conseil: CONSEIL_INCONNU, acces: { entree: 'inconnue', toilettes: 'inconnues' } }
  }

  if (type === 'wc') {
    // Pour des toilettes publiques, le wiki demande « wheelchair » ; certains contributeurs mettent
    // toilets:wheelchair à la place : on le lit alors, sans jamais conclure « accessible » par défaut.
    const valeur = t.wheelchair ?? t['toilets:wheelchair']
    const entree: Entree = valeur === 'no' ? 'non' : valeur === 'limited' ? 'partielle' : oui(valeur) ? 'ok' : 'inconnue'
    if (entree === 'inconnue') {
      details(t, lignes)
      return { etat: 'inconnu', lignes: [{ ...INCONNU, theme: 'Toilettes' }, ...lignes], conseil: CONSEIL_INCONNU, acces: { entree: 'inconnue', toilettes: 'inconnues' } }
    }
    // Des toilettes publiques : leur accès dit à la fois l'entrée et les toilettes.
    const acces = entree === 'non' ? { entree, toilettes: 'non' as const } : entree === 'partielle' ? { entree, toilettes: 'inconnues' as const } : { entree, toilettes: 'oui' as const }
    lignes.push(LIGNE_WC[entree])
    details(t, lignes)
    return { etat: couleur(acces.entree, acces.toilettes), lignes, acces }
  }

  const entree: Entree = oui(t.wheelchair) ? 'ok'
    : t.wheelchair === 'limited' ? 'partielle'
    : t.wheelchair === 'no' ? 'non'
    : 'inconnue'
  lignes.push(LIGNE_ENTREE[entree])

  const wc = t['toilets:wheelchair']
  const toilettes: Toilettes = oui(wc) ? 'oui' : wc === 'no' ? 'non' : 'inconnues'
  lignes.push(LIGNE_TOILETTES[toilettes])
  details(t, lignes)

  const etat = couleur(entree, toilettes)
  const conseil = etat === 'ok' && (type === 'cafe' || type === 'resto')
    ? 'Toilettes pour les clients : demandez au comptoir.'
    : undefined
  return { etat, lignes, conseil, acces: { entree, toilettes } }
}
