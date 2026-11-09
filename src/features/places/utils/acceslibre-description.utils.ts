import { color, type Entrance, type Toilets } from '~/features/places/utils/color.utils'
import type { State, Place, Line, Answer, Theme, PlaceType } from '~/types/place.types'

type Yes = boolean | null

export type AcceslibreRow = {
  id: string
  web_url: string | null
  name: string | null
  activite: string | null
  latitude: number | null
  longitude: number | null
  numero?: string | null
  voie?: string | null
  entree_plain_pied: Yes
  entree_marches: number | null
  entree_marches_rampe: string | null
  entree_ascenseur: Yes
  accueil_cheminement_plain_pied: Yes
  accueil_cheminement_ascenseur: Yes
  sanitaires_adaptes: Yes
  // Colonnes ajoutées ensuite : absentes des zones préparées avant leur ajout, d'où le `?`.
  stationnement_pmr?: Yes
  stationnement_ext_pmr?: Yes
  cheminement_ext_presence?: Yes
  cheminement_ext_terrain_stable?: Yes
  cheminement_ext_plain_pied?: Yes
  cheminement_ext_ascenseur?: Yes
  cheminement_ext_nombre_marches?: number | null
  cheminement_ext_rampe?: string | null
  cheminement_ext_pente_presence?: Yes
  cheminement_ext_pente_degre_difficulte?: string | null
  cheminement_ext_devers?: string | null
  cheminement_ext_retrecissement?: Yes
  cheminement_ext_main_courante?: Yes
  entree_ascenseur_pmr?: Yes
  entree_largeur_mini?: number | null
  entree_pmr?: Yes
  entree_porte_type?: string | null
  entree_porte_manoeuvre?: string | null
  entree_dispositif_appel?: Yes
  entree_aide_humaine?: Yes
  entree_balise_sonore?: Yes
  entree_marches_main_courante?: Yes
  accueil_cheminement_nombre_marches?: number | null
  accueil_cheminement_rampe?: string | null
  accueil_ascenseur_etage?: Yes
  accueil_retrecissement?: Yes
  accueil_cheminement_main_courante?: Yes
  accueil_personnels?: string | null
  accueil_equipements_malentendants_presence?: Yes
  accueil_audiodescription_presence?: Yes
  sanitaires_presence?: Yes
  labels?: string | string[] | null
}

/** Colonnes lues par l'appli : le script de préparation n'écrit que celles-ci (scripts/lib/prepare.mjs). */
export const ACCESLIBRE_COLUMNS = [
  'id', 'web_url', 'name', 'activite', 'latitude', 'longitude', 'numero', 'voie',
  'entree_plain_pied', 'entree_marches', 'entree_marches_rampe', 'entree_ascenseur',
  'accueil_cheminement_plain_pied', 'accueil_cheminement_ascenseur', 'sanitaires_adaptes',
  'stationnement_pmr', 'stationnement_ext_pmr',
  'cheminement_ext_presence', 'cheminement_ext_terrain_stable', 'cheminement_ext_plain_pied',
  'cheminement_ext_ascenseur', 'cheminement_ext_nombre_marches', 'cheminement_ext_rampe',
  'cheminement_ext_pente_presence', 'cheminement_ext_pente_degre_difficulte', 'cheminement_ext_devers',
  'cheminement_ext_retrecissement', 'cheminement_ext_main_courante',
  'entree_ascenseur_pmr', 'entree_marches_main_courante', 'entree_largeur_mini', 'entree_pmr', 'entree_porte_type', 'entree_porte_manoeuvre',
  'entree_dispositif_appel', 'entree_aide_humaine', 'entree_balise_sonore',
  'accueil_cheminement_nombre_marches', 'accueil_cheminement_rampe', 'accueil_ascenseur_etage',
  'accueil_retrecissement', 'accueil_cheminement_main_courante', 'accueil_personnels', 'accueil_equipements_malentendants_presence',
  'accueil_audiodescription_presence', 'sanitaires_presence', 'labels',
] as const satisfies readonly (keyof AcceslibreRow)[]

// On ne garde que les cafés, restaurants et toilettes publiques : où l'on entre librement, et qui
// servent à sortir (docs/decisions/interface, D23). Les noms exacts de la liste d'Acceslibre : un motif
// attrapait aussi « Barbier », « Restaurant scolaire » ou « Personnes âgées : foyer restaurant »
// (docs/decisions/donnees, D11).
export const ACTIVITIES: Record<string, PlaceType> = {
  'Restaurant': 'restaurant',
  'Restauration rapide': 'restaurant',
  'Hôtel restaurant': 'restaurant',
  'Café, bar, brasserie': 'cafe',
  'Bar tabac': 'cafe',
  'Salon de thé': 'cafe',
  'Toilettes publiques': 'wc',
}

export function acceslibreType(activite: string | null): PlaceType | null {
  return (activite && ACTIVITIES[activite]) || null
}

export function cleanName(name: string | null) {
  const n = name?.replace(/[‎‏]/g, '').trim()
  return n && n.length > 1 ? n : null
}

// En dessous, un fauteuil passe mal : 77 cm est le minimum réglementaire d'un passage.
const WHEELCHAIR_WIDTH_CM = 77

const LABELS: Record<string, string> = {
  th: 'Tourisme & Handicap', dpt: 'Destination pour Tous', mobalib: 'Mobalib', handiplage: 'Handiplage',
}

const withRamp = (ramp: string | null | undefined) => ramp === 'fixe' || ramp === 'amovible'
const stairs = (n: number | null | undefined) => n ? `${n} marche${n > 1 ? 's' : ''}` : 'Des marches'

/** Une main courante, seulement là où il y a des marches. */
function hold(line: (answer: Answer, text: string) => void, stairs: boolean, handrail: Yes | undefined) {
  if (!stairs) return
  if (handrail) line('yes', 'Main courante pour se tenir')
  else if (handrail === false) line('warning', 'Pas de main courante')
}

/** Les labels arrivent en liste (API) ou en texte « ['th', 'dpt'] » (fichier CSV). */
function knownLabels(labels: AcceslibreRow['labels']): string[] {
  const codes = Array.isArray(labels) ? labels : (labels ?? '').match(/[a-z]+/g) ?? []
  return codes.flatMap(c => LABELS[c] ? [LABELS[c]] : [])
}

function entrance(r: AcceslibreRow, line: (answer: Answer, text: string, detail?: string) => void): Entrance {
  if (r.entree_plain_pied) {
    line('yes', 'Entrée sans marche')
    return 'ok'
  }
  if (r.entree_ascenseur) {
    line(r.entree_ascenseur_pmr === false ? 'warning' : 'yes', 'Entrée par ascenseur',
      r.entree_ascenseur_pmr === false ? 'Ascenseur pas adapté aux fauteuils' : undefined)
    return 'ok'
  }
  if (withRamp(r.entree_marches_rampe)) {
    line('yes', 'Entrée avec rampe', r.entree_marches_rampe === 'amovible' ? 'Rampe à demander' : undefined)
    return 'ok'
  }
  if (r.entree_plain_pied === false) {
    line('no', `${stairs(r.entree_marches)} à l’entrée`, 'Pas de rampe indiquée')
    return 'no'
  }
  line('warning', 'Entrée : on ne sait pas')
  return 'unknown'
}

/** Toutes les informations renseignées sur Acceslibre, rangées par thème. Ce qui n'est pas renseigné n'apparaît pas. */
export function describeAcceslibre(r: AcceslibreRow): { state: Exclude<State, 'parking'>; lines: Line[]; access: NonNullable<Place['access']> } {
  const lines: Line[] = []
  const inside = (theme: Theme) => (answer: Answer, text: string, detail?: string) =>
    lines.push({ theme, answer, text, ...(detail ? { detail } : {}) })

  const park = inside('Se garer')
  if (r.stationnement_pmr) park('yes', 'Place handicapée sur place')
  else if (r.stationnement_ext_pmr) park('yes', 'Place handicapée à moins de 200 m')
  else if (r.stationnement_pmr === false && r.stationnement_ext_pmr === false) park('no', 'Pas de place handicapée à proximité')

  const street = inside('Depuis la rue')
  if (r.cheminement_ext_presence) {
    if (r.cheminement_ext_plain_pied) street('yes', 'Chemin sans marche jusqu’à l’entrée')
    else if (r.cheminement_ext_ascenseur) street('yes', 'Ascenseur sur le chemin de l’entrée')
    else if (withRamp(r.cheminement_ext_rampe)) street('yes', 'Rampe sur le chemin de l’entrée', r.cheminement_ext_rampe === 'amovible' ? 'Rampe à demander' : undefined)
    else if (r.cheminement_ext_plain_pied === false) street('no', `${stairs(r.cheminement_ext_nombre_marches)} sur le chemin de l’entrée`)
    hold(street, r.cheminement_ext_plain_pied === false, r.cheminement_ext_main_courante)
    if (r.cheminement_ext_pente_presence) {
      street(r.cheminement_ext_pente_degre_difficulte === 'importante' ? 'no' : 'warning',
        r.cheminement_ext_pente_degre_difficulte === 'importante' ? 'Pente forte' : 'Pente légère')
    }
    if (r.cheminement_ext_devers === 'important') street('warning', 'Chemin penché sur le côté')
    if (r.cheminement_ext_terrain_stable === false) street('warning', 'Sol instable', 'Pavés, gravier, terre ou herbe')
    if (r.cheminement_ext_retrecissement) street('warning', 'Passage de moins de 90 cm')
  }

  const door = inside('Entrée')
  const entranceState = entrance(r, door)
  // Avec un côté affaibli, pouvoir se tenir dans des marches change tout (docs/decisions/interface, D18).
  hold(door, r.entree_plain_pied === false, r.entree_marches_main_courante)
  if (r.entree_pmr) door('yes', 'Une entrée sans marche à part', 'Une autre porte que l’entrée principale')
  if (r.entree_largeur_mini) {
    const wide = r.entree_largeur_mini >= WHEELCHAIR_WIDTH_CM
    door(wide ? 'yes' : 'warning', `Porte de ${r.entree_largeur_mini} cm`, wide ? undefined : 'Étroite pour un fauteuil')
  }
  if (r.entree_porte_type === 'automatique') door('yes', 'Porte automatique')
  else if (r.entree_porte_manoeuvre === 'tourniquet' || r.entree_porte_manoeuvre === 'tambour') door('no', r.entree_porte_manoeuvre === 'tambour' ? 'Porte tambour' : 'Tourniquet')
  else if (r.entree_porte_type === 'manuelle') door('warning', 'Porte à ouvrir soi-même')
  if (r.entree_dispositif_appel) door('yes', 'Sonnette pour appeler')
  if (r.entree_aide_humaine) door('yes', 'On peut vous aider à entrer')

  const indoors = inside('À l’intérieur')
  if (r.accueil_cheminement_plain_pied) indoors('yes', 'Intérieur sans marche')
  else if (r.accueil_cheminement_ascenseur) indoors('yes', 'Ascenseur à l’intérieur')
  else if (withRamp(r.accueil_cheminement_rampe)) indoors('yes', 'Rampe à l’intérieur')
  else if (r.accueil_cheminement_plain_pied === false) indoors('warning', `${stairs(r.accueil_cheminement_nombre_marches)} à l’intérieur`)
  hold(indoors, r.accueil_cheminement_plain_pied === false, r.accueil_cheminement_main_courante)
  if (r.accueil_ascenseur_etage) indoors('yes', 'Ascenseur pour les étages')
  else if (r.accueil_ascenseur_etage === false) indoors('warning', 'Pas d’ascenseur pour les étages')
  if (r.accueil_retrecissement) indoors('warning', 'Passage de moins de 90 cm')

  const wc = inside('Toilettes')
  const toilets: Toilets = r.sanitaires_adaptes === true ? 'yes' : r.sanitaires_adaptes === false ? 'no' : 'unknown'
  if (r.sanitaires_presence === false) wc('no', 'Pas de toilettes')
  else if (toilets === 'yes') wc('yes', 'Toilettes adaptées')
  else if (toilets === 'no') wc('no', 'Toilettes non adaptées')
  else wc('warning', 'Toilettes : on ne sait pas', 'Le lieu ne l’a pas encore dit : à demander sur place')

  const welcome = inside('Accueil')
  if (r.accueil_personnels === 'formés') welcome('yes', 'Personnel formé au handicap')
  else if (r.accueil_personnels === 'non-formés') welcome('warning', 'Personnel non formé au handicap')
  else if (r.accueil_personnels === 'aucun') welcome('warning', 'Pas de personnel à l’accueil')
  if (r.accueil_equipements_malentendants_presence) welcome('yes', 'Aide pour les personnes sourdes ou malentendantes')
  if (r.accueil_audiodescription_presence) welcome('yes', 'Audiodescription')
  if (r.entree_balise_sonore) welcome('yes', 'Balise sonore à l’entrée')
  for (const label of knownLabels(r.labels)) welcome('yes', `Label ${label}`)

  return { state: color(entranceState, toilets), lines, access: { entrance: entranceState, toilets } }
}
