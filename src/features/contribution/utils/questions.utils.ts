import type { TypeLieu } from '~/types/lieu.types'

// Les questions posées sur place, une à la fois, comme StreetComplete. Chaque réponse est une valeur
// du wiki d'OpenStreetMap, rien d'autre (docs/bien-contribuer-a-osm.md, docs/decisions/interface D12).

/** `cle` : une réponse qui pose une autre étiquette que celle de la question (« pas de toilettes »). */
type Choix = { valeur: string; titre: string; aide?: string; cle?: string }
export type Question = { cle: string; question: string; aide?: string; choix: Choix[] }

/**
 * FR:Key:wheelchair : yes = sans marche, à l'entrée et dans tout le lieu ; limited = une marche de
 * 7 cm au plus, ou une partie du lieu seulement ; no = plus haute. On demande ce qu'on voit (des
 * marches), pas d'imaginer un fauteuil : les valeurs posées restent celles du wiki.
 */
const ENTREE: Question = {
  cle: 'wheelchair',
  question: 'Y a-t-il des marches ?',
  aide: 'Pour entrer, et à l’intérieur',
  choix: [
    { valeur: 'yes', titre: 'Non, aucune marche', aide: 'Ni à l’entrée, ni dedans (ou une rampe)' },
    { valeur: 'limited', titre: 'Une petite marche', aide: '7 cm au plus, ou dans une partie du lieu' },
    { valeur: 'no', titre: 'Oui, plus haute', aide: 'Ou un escalier' },
  ],
}

/**
 * FR:Key:toilets:wheelchair : « yes » suppose porte large, place pour tourner, barre d'appui. Sans
 * toilettes, « non adaptées » serait faux : on pose alors `toilets=no` (FR:Key:toilets).
 */
const TOILETTES: Question = {
  cle: 'toilets:wheelchair',
  question: 'Les toilettes sont-elles adaptées ?',
  aide: 'Porte large, barre d’appui, place pour tourner',
  choix: [
    { valeur: 'yes', titre: 'Oui' },
    { valeur: 'no', titre: 'Non' },
    { valeur: 'no', titre: 'Il n’y a pas de toilettes', cle: 'toilets' },
  ],
}

/** Pour des toilettes publiques, le wiki demande « wheelchair » sur les toilettes elles-mêmes. */
const TOILETTES_PUBLIQUES: Question = {
  ...ENTREE,
  question: 'Ces toilettes sont-elles faciles d’accès ?',
  choix: [
    { valeur: 'yes', titre: 'Oui', aide: 'Sans marche, assez de place' },
    { valeur: 'limited', titre: 'En partie', aide: 'Une petite marche, ou étroites' },
    { valeur: 'no', titre: 'Non', aide: 'Marche haute, ou trop étroites' },
  ],
}

export function questionsPour(type: TypeLieu): Question[] {
  if (type === 'parking') return []
  if (type === 'wc') return [TOILETTES_PUBLIQUES]
  return [ENTREE, TOILETTES]
}

/** Ce que dit une valeur, en mots, pour le résumé « la carte dit / vous dites ». */
const MOTS: Record<string, Record<string, string>> = {
  wheelchair: { yes: 'sans marche', limited: 'une petite marche', no: 'marche haute ou escalier', designated: 'sans marche' },
  'toilets:wheelchair': { yes: 'adaptées', no: 'non adaptées', designated: 'adaptées' },
  toilets: { yes: 'il y a des toilettes', no: 'pas de toilettes' },
}
export const enMots = (cle: string, valeur: string | undefined) =>
  valeur === undefined ? 'on ne sait pas' : MOTS[cle]?.[valeur] ?? valeur

export type Changement = { cle: string; avant: string | undefined; apres: string }

/** Les réponses données (« je ne sais pas » n'en est pas une : rien n'est écrit). */
export type Reponses = Record<string, string>

export function changements(etiquettes: Record<string, string>, reponses: Reponses): Changement[] {
  return Object.entries(reponses).map(([cle, apres]) => ({ cle, avant: etiquettes[cle], apres }))
}

/**
 * Les étiquettes après les réponses. Comme StreetComplete, chaque réponse date sa vérification
 * (`check_date:<clé>`), même si la valeur ne change pas : on sait ainsi qu'elle a été revue.
 */
export function nouvellesEtiquettes(etiquettes: Record<string, string>, reponses: Reponses, aujourdhui: Date): Record<string, string> {
  const jour = aujourdhui.toISOString().slice(0, 10)
  const nouvelles = { ...etiquettes }
  for (const [cle, valeur] of Object.entries(reponses)) {
    nouvelles[cle] = valeur
    nouvelles[`check_date:${cle}`] = jour
  }
  return nouvelles
}

/** Le commentaire du groupe de modifications : ce qui a été vérifié, en clair. */
export function commentaire(reponses: Reponses, type: TypeLieu): string {
  const quoi = Object.keys(reponses).map(cle => (cle === 'wheelchair' && type !== 'wc' ? 'entrée' : 'toilettes'))
  return `Accessibilité vérifiée sur place : ${[...new Set(quoi)].join(', ')}`
}

/** Une place handicapée, comme le wiki la décrit (FR:Tag:parking_space=disabled). */
export const ETIQUETTES_PLACE = { amenity: 'parking_space', parking_space: 'disabled' }
// Une place peut se placer depuis chez soi (pas de `source=survey`) : le commentaire ne prétend pas l'avoir vue.
export const COMMENTAIRE_PLACE = 'Place handicapée ajoutée'
