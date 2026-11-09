import type { PlaceType } from '~/types/place.types'

// Les questions posées sur place, une à la fois, comme StreetComplete. Chaque réponse est une valeur
// du wiki d'OpenStreetMap, rien d'autre (docs/bien-contribuer-a-osm.md, docs/decisions/interface D12).

/** `cle` : une réponse qui pose une autre étiquette que celle de la question (« pas de toilettes »). */
type Choice = { value: string; title: string; help?: string; key?: string }
export type Question = { key: string; question: string; help?: string; choice: Choice[] }

/**
 * FR:Key:wheelchair : yes = sans marche, à l'entrée et dans tout le lieu ; limited = une marche de
 * 7 cm au plus, ou une partie du lieu seulement ; no = plus haute. On demande ce qu'on voit (des
 * marches), pas d'imaginer un fauteuil : les valeurs posées restent celles du wiki.
 */
const ENTRANCE: Question = {
  key: 'wheelchair',
  question: 'Y a-t-il des marches ?',
  help: 'Pour entrer, et à l’intérieur',
  choice: [
    { value: 'yes', title: 'Non, aucune marche', help: 'Ni à l’entrée, ni dedans (ou une rampe)' },
    { value: 'limited', title: 'Une petite marche', help: '7 cm au plus, ou dans une partie du lieu' },
    { value: 'no', title: 'Oui, plus haute', help: 'Ou un escalier' },
  ],
}

/**
 * FR:Key:toilets:wheelchair : « yes » suppose porte large, place pour tourner, barre d'appui. Sans
 * toilettes, « non adaptées » serait faux : on pose alors `toilets=no` (FR:Key:toilets).
 */
const TOILETS: Question = {
  key: 'toilets:wheelchair',
  question: 'Les toilettes sont-elles adaptées ?',
  help: 'Porte large, barre d’appui, place pour tourner',
  choice: [
    { value: 'yes', title: 'Oui' },
    { value: 'no', title: 'Non' },
    { value: 'no', title: 'Il n’y a pas de toilettes', key: 'toilets' },
  ],
}

/** Pour des toilettes publiques, le wiki demande « wheelchair » sur les toilettes elles-mêmes. */
const PUBLIC_TOILETS: Question = {
  ...ENTRANCE,
  question: 'Ces toilettes sont-elles faciles d’accès ?',
  choice: [
    { value: 'yes', title: 'Oui', help: 'Sans marche, assez de place' },
    { value: 'limited', title: 'En partie', help: 'Une petite marche, ou étroites' },
    { value: 'no', title: 'Non', help: 'Marche haute, ou trop étroites' },
  ],
}

export function questionsFor(type: PlaceType): Question[] {
  if (type === 'parking') return []
  if (type === 'wc') return [PUBLIC_TOILETS]
  return [ENTRANCE, TOILETS]
}

/** Ce que dit une valeur, en mots, pour le résumé « la carte dit / vous dites ». */
const WORDS: Record<string, Record<string, string>> = {
  wheelchair: { yes: 'sans marche', limited: 'une petite marche', no: 'marche haute ou escalier', designated: 'sans marche' },
  'toilets:wheelchair': { yes: 'adaptées', no: 'non adaptées', designated: 'adaptées' },
  toilets: { yes: 'il y a des toilettes', no: 'pas de toilettes' },
}
export const inWords = (key: string, value: string | undefined) =>
  value === undefined ? 'on ne sait pas' : WORDS[key]?.[value] ?? value

export type Change = { key: string; before: string | undefined; after: string }

/** Les réponses données (« je ne sais pas » n'en est pas une : rien n'est écrit). */
export type Answers = Record<string, string>

export function changes(osmTags: Record<string, string>, answers: Answers): Change[] {
  return Object.entries(answers).map(([key, after]) => ({ key, before: osmTags[key], after }))
}

/**
 * Les étiquettes après les réponses. Comme StreetComplete, chaque réponse date sa vérification
 * (`check_date:<clé>`), même si la valeur ne change pas : on sait ainsi qu'elle a été revue.
 */
export function newTags(osmTags: Record<string, string>, answers: Answers, today: Date): Record<string, string> {
  const day = today.toISOString().slice(0, 10)
  const freshOnes = { ...osmTags }
  for (const [key, value] of Object.entries(answers)) {
    freshOnes[key] = value
    freshOnes[`check_date:${key}`] = day
  }
  return freshOnes
}

/** Le commentaire du groupe de modifications : ce qui a été vérifié, en clair. */
export function changesetComment(answers: Answers, type: PlaceType): string {
  const what = Object.keys(answers).map(key => (key === 'wheelchair' && type !== 'wc' ? 'entrée' : 'toilettes'))
  return `Accessibilité vérifiée sur place : ${[...new Set(what)].join(', ')}`
}

/** Une place handicapée, comme le wiki la décrit (FR:Tag:parking_space=disabled). */
export const SPOT_TAGS = { amenity: 'parking_space', parking_space: 'disabled' }
// Une place peut se placer depuis chez soi (pas de `source=survey`) : le commentaire ne prétend pas l'avoir vue.
export const SPOT_COMMENT = 'Place handicapée ajoutée'
