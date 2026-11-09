import { color, type Entrance, type Toilets } from '~/features/places/utils/color.utils'
import type { State, Place, Line, Answer, Theme, PlaceType } from '~/types/place.types'

export function osmType(tags: Record<string, string>): PlaceType | null {
  if (tags.parking_space === 'disabled' || tags.amenity === 'parking') return 'parking'
  if (tags.amenity === 'toilets') return 'wc'
  if (tags.amenity === 'cafe' || tags.amenity === 'bar' || tags.amenity === 'pub') return 'cafe'
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'restaurant'
  return null
}

const LABELS_BY_AMENITY: Record<string, string> = {
  cafe: 'Café', bar: 'Bar', pub: 'Bar', restaurant: 'Restaurant', fast_food: 'Restauration rapide',
  toilets: 'Toilettes publiques',
}

export function osmLabel(type: PlaceType, tags: Record<string, string>) {
  if (type === 'parking') return 'Place handicapée'
  return LABELS_BY_AMENITY[tags.amenity] ?? 'Lieu'
}

/**
 * Étiquettes OSM lues par l'appli : seulement celles du wiki qui décrivent le handicap, avec leurs
 * définitions exactes (docs/decisions/interface, D12). Le script de préparation ne garde que
 * celles-ci (scripts/lib/prepare.mjs).
 */
export const OSM_TAGS = [
  'name', 'amenity', 'parking_space', 'capacity:disabled', 'wheelchair', 'toilets:wheelchair',
  'wheelchair:description', 'wheelchair:description:fr', 'step_count', 'ramp:wheelchair', 'automatic_door',
  'door:width', 'level', 'hearing_loop',
  // pour reconnaître le même lieu dans Acceslibre (docs/decisions/donnees, D11)
  'addr:housenumber', 'addr:street',
] as const

const UNKNOWN: Line = { theme: 'Entrée', answer: 'warning', text: 'Accessibilité inconnue', detail: 'Personne ne l’a encore renseignée' }
const UNKNOWN_ADVICE = 'Vous y êtes ? Dites-nous si c’est accessible : ça aidera tout le monde.'

// FR:Key:wheelchair, dit comme on le voit sur place (des marches), le sens « fauteuil » du wiki
// dessous : l'utilisatrice marche, le fauteuil sert d'indicateur de facilité (docs/decisions/interface, D18).
const ENTRANCE_LINE: Record<Entrance, Line> = {
  ok: { theme: 'Entrée', answer: 'yes', text: 'Entrée sans marche', detail: 'Accessible en fauteuil' },
  partial: { theme: 'Entrée', answer: 'warning', text: 'Une petite marche à l’entrée', detail: '7 cm au plus (accès partiel en fauteuil)' },
  no: { theme: 'Entrée', answer: 'no', text: 'Marche haute ou escalier à l’entrée', detail: 'Plus de 7 cm (pas accessible en fauteuil)' },
  unknown: { theme: 'Entrée', answer: 'warning', text: 'Entrée : on ne sait pas' },
}

/** Pour des toilettes publiques, « wheelchair » décrit les toilettes elles-mêmes. */
const WC_LINE: Record<Exclude<Entrance, 'unknown'>, Line> = {
  ok: { theme: 'Toilettes', answer: 'yes', text: 'Toilettes faciles d’accès', detail: 'Sans marche, assez de place' },
  partial: { theme: 'Toilettes', answer: 'warning', text: 'Toilettes : accès limité', detail: 'Petite marche, ou étroites' },
  no: { theme: 'Toilettes', answer: 'no', text: 'Toilettes difficiles d’accès', detail: 'Marche haute, ou trop étroites' },
}

// FR:Key:toilets:wheelchair : « yes » suppose porte large, espace pour tourner, barre d'appui.
const TOILETS_LINE: Record<Toilets, Line> = {
  yes: { theme: 'Toilettes', answer: 'yes', text: 'Toilettes adaptées', detail: 'Barre d’appui, porte large, place pour tourner' },
  no: { theme: 'Toilettes', answer: 'no', text: 'Toilettes non adaptées' },
  unknown: { theme: 'Toilettes', answer: 'warning', text: 'Toilettes : on ne sait pas', detail: 'Le lieu ne l’a pas encore dit : à demander sur place' },
}

const yes = (v: string | undefined) => v === 'yes' || v === 'designated'

/** Les autres critères handicap du wiki, quand quelqu'un les a renseignés. Sans seuil officiel, on donne le fait sans le juger. */
function details(tags: Record<string, string>, lines: Line[]) {
  const inside = (theme: Theme) => (answer: Answer, text: string, detail?: string) =>
    lines.push({ theme, answer, text, ...(detail ? { detail } : {}) })
  const door = inside('Entrée')
  const stairs = Number(tags.step_count)
  if (stairs > 0) door('info', `${stairs} marche${stairs > 1 ? 's' : ''}`)
  if (tags['ramp:wheelchair'] === 'yes') door('yes', 'Rampe à l’entrée')
  else if (tags['ramp:wheelchair'] === 'no') door('no', 'Pas de rampe')
  if (tags.automatic_door && tags.automatic_door !== 'no') door('yes', 'Porte automatique')
  const width = Math.round(parseFloat(tags['door:width']) * 100)
  if (width > 0) door('info', `Porte de ${width} cm`)

  const level = Number(tags.level)
  // OSM ne décrit pas l'ascenseur d'un lieu : on le dit, plutôt que de laisser croire qu'on y monte
  // facilement (docs/decisions/interface, D21).
  if (level > 0) inside('À l’intérieur')('warning', `Au ${level === 1 ? '1er' : `${level}e`} étage`, 'La carte ne dit pas s’il y a un ascenseur')
  else if (level < 0) inside('À l’intérieur')('warning', 'En sous-sol', 'La carte ne dit pas s’il y a un ascenseur')

  if (tags.hearing_loop === 'yes') inside('Accueil')('yes', 'Boucle magnétique', 'Pour les personnes malentendantes')
  const description = tags['wheelchair:description:fr'] ?? tags['wheelchair:description']
  if (description) inside('Accueil')('info', 'Précision laissée par un visiteur', description)
}

/** Transforme les étiquettes OSM en lignes simples « oui / attention / non / info ». */
export function describeOsm(type: PlaceType, tags: Record<string, string>): { state: State; lines: Line[]; advice?: string; access?: Place['access'] } {
  const lines: Line[] = []

  if (type === 'parking') {
    const count = Number(tags['capacity:disabled'])
    lines.push({ theme: 'Se garer', answer: 'yes', text: count > 1 ? `${count} places handicapées` : 'Place handicapée' })
    return { state: 'parking', lines }
  }

  if (tags.wheelchair === undefined && tags['toilets:wheelchair'] === undefined) {
    details(tags, lines)
    return { state: 'unknown', lines: [UNKNOWN, ...lines], advice: UNKNOWN_ADVICE, access: { entrance: 'unknown', toilets: 'unknown' } }
  }

  if (type === 'wc') {
    // Pour des toilettes publiques, le wiki demande « wheelchair » ; certains contributeurs mettent
    // toilets:wheelchair à la place : on le lit alors, sans jamais conclure « accessible » par défaut.
    const value = tags.wheelchair ?? tags['toilets:wheelchair']
    const entrance: Entrance = value === 'no' ? 'no' : value === 'limited' ? 'partial' : yes(value) ? 'ok' : 'unknown'
    if (entrance === 'unknown') {
      details(tags, lines)
      return { state: 'unknown', lines: [{ ...UNKNOWN, theme: 'Toilettes' }, ...lines], advice: UNKNOWN_ADVICE, access: { entrance: 'unknown', toilets: 'unknown' } }
    }
    // Des toilettes publiques : leur accès dit à la fois l'entrée et les toilettes.
    const access = entrance === 'no' ? { entrance, toilets: 'no' as const } : entrance === 'partial' ? { entrance, toilets: 'unknown' as const } : { entrance, toilets: 'yes' as const }
    lines.push(WC_LINE[entrance])
    details(tags, lines)
    return { state: color(access.entrance, access.toilets), lines, access }
  }

  const entrance: Entrance = yes(tags.wheelchair) ? 'ok'
    : tags.wheelchair === 'limited' ? 'partial'
    : tags.wheelchair === 'no' ? 'no'
    : 'unknown'
  lines.push(ENTRANCE_LINE[entrance])

  const wc = tags['toilets:wheelchair']
  const toilets: Toilets = yes(wc) ? 'yes' : wc === 'no' ? 'no' : 'unknown'
  lines.push(TOILETS_LINE[toilets])
  details(tags, lines)

  const state = color(entrance, toilets)
  const advice = state === 'ok' && (type === 'cafe' || type === 'restaurant')
    ? 'Toilettes pour les clients : demandez au comptoir.'
    : undefined
  return { state, lines, advice, access: { entrance, toilets } }
}
