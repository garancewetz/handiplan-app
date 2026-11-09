import { describe, expect, it } from 'vitest'
import {
  describeAcceslibre,
  cleanName,
  acceslibreType,
  type AcceslibreRow,
} from '~/features/places/utils/acceslibre-description.utils'

function line(fields: Partial<AcceslibreRow>): AcceslibreRow {
  return {
    id: 'x', web_url: null, name: 'Le Lieu', activite: 'Restaurant', latitude: 48.85, longitude: 2.35,
    entree_plain_pied: null, entree_marches: null, entree_marches_rampe: null, entree_ascenseur: null,
    accueil_cheminement_plain_pied: null, accueil_cheminement_ascenseur: null, sanitaires_adaptes: true,
    ...fields,
  }
}

describe('typeAcceslibre', () => {
  it('garde les lieux où l’on entre librement', () => {
    expect(acceslibreType('Café, bar, brasserie')).toBe('cafe')
    expect(acceslibreType('Restauration rapide')).toBe('restaurant')
    expect(acceslibreType('Musée')).toBeNull()
  })

  it('écarte les lieux sur rendez-vous', () => {
    expect(acceslibreType('Avocat')).toBeNull()
    expect(acceslibreType('Dentiste, chirurgien dentiste')).toBeNull()
    expect(acceslibreType(null)).toBeNull()
  })

  it('ne prend pas un barbier pour un bar, ni une cantine pour un restaurant', () => {
    expect(acceslibreType('Barbier')).toBeNull()
    expect(acceslibreType('Vente de cafés et thés')).toBeNull()
    expect(acceslibreType('Restaurant scolaire')).toBeNull()
    expect(acceslibreType('Personnes âgées : foyer restaurant')).toBeNull()
    expect(acceslibreType('Bar tabac')).toBe('cafe')
    expect(acceslibreType('Toilettes publiques')).toBe('wc')
  })
})

describe('nomPropre', () => {
  it('ignore les noms vides ou d’un seul caractère', () => {
    expect(cleanName('.')).toBeNull()
    expect(cleanName('Au Chien Qui Fume‎')).toBe('Au Chien Qui Fume')
  })
})

describe('decrireAcceslibre', () => {
  it('marque « ok » une entrée de plain-pied', () => {
    const r = describeAcceslibre(line({ entree_plain_pied: true }))
    expect(r.state).toBe('ok')
    expect(r.lines[0].text).toBe('Entrée sans marche')
  })

  it('accepte une rampe, en précisant qu’elle est à demander', () => {
    const r = describeAcceslibre(line({ entree_plain_pied: false, entree_marches: 2, entree_marches_rampe: 'amovible' }))
    expect(r.state).toBe('ok')
    expect(r.lines[0]).toMatchObject({ text: 'Entrée avec rampe', detail: 'Rampe à demander' })
  })

  it('marque « pas accessible » une entrée avec des marches sans rampe et des toilettes non adaptées', () => {
    const r = describeAcceslibre(line({ entree_plain_pied: false, entree_marches: 2, entree_marches_rampe: 'aucune', sanitaires_adaptes: false }))
    expect(r.state).toBe('no')
    expect(r.lines[0]).toMatchObject({ answer: 'no', text: '2 marches à l’entrée' })
  })

  it('marque « en partie » des marches à l’entrée mais des toilettes adaptées', () => {
    expect(describeAcceslibre(line({ entree_plain_pied: false, entree_marches: 1, sanitaires_adaptes: true })).state).toBe('check')
  })

  it('reste « à vérifier » si l’entrée est facile mais les toilettes pas adaptées ou inconnues', () => {
    const notAdapted = describeAcceslibre(line({ entree_plain_pied: true, sanitaires_adaptes: false }))
    expect(notAdapted.state).toBe('check')
    expect(notAdapted.lines).toContainEqual(expect.objectContaining({ answer: 'no', text: 'Toilettes non adaptées' }))
    expect(describeAcceslibre(line({ entree_plain_pied: true, sanitaires_adaptes: null })).state).toBe('check')
  })

  it('reste « à vérifier » quand l’entrée n’est pas renseignée', () => {
    expect(describeAcceslibre(line({})).state).toBe('check')
  })
})

describe('decrireAcceslibre : toutes les catégories renseignées', () => {
  const texts = (fields: Partial<AcceslibreRow>) =>
    describeAcceslibre(line(fields)).lines.map(l => `${l.theme} · ${l.text}`)

  it('range chaque information dans son thème, dans l’ordre de la fiche', () => {
    expect(texts({
      entree_plain_pied: true, stationnement_pmr: true, entree_largeur_mini: 90, entree_porte_type: 'automatique',
      accueil_ascenseur_etage: true, accueil_personnels: 'formés', labels: "['th']",
    })).toEqual([
      'Se garer · Place handicapée sur place',
      'Entrée · Entrée sans marche',
      'Entrée · Porte de 90 cm',
      'Entrée · Porte automatique',
      'À l’intérieur · Ascenseur pour les étages',
      'Toilettes · Toilettes adaptées',
      'Accueil · Personnel formé au handicap',
      'Accueil · Label Tourisme & Handicap',
    ])
  })

  it('signale ce qui gêne un fauteuil', () => {
    const lines = describeAcceslibre(line({
      cheminement_ext_presence: true, cheminement_ext_plain_pied: false, cheminement_ext_nombre_marches: 3,
      cheminement_ext_pente_presence: true, cheminement_ext_pente_degre_difficulte: 'importante', entree_largeur_mini: 70,
    })).lines
    expect(lines).toContainEqual({ theme: 'Depuis la rue', answer: 'no', text: '3 marches sur le chemin de l’entrée' })
    expect(lines).toContainEqual({ theme: 'Depuis la rue', answer: 'no', text: 'Pente forte' })
    expect(lines).toContainEqual({ theme: 'Entrée', answer: 'warning', text: 'Porte de 70 cm', detail: 'Étroite pour un fauteuil' })
  })

  it('n’affiche rien de ce qui n’est pas renseigné', () => {
    expect(texts({ entree_plain_pied: true })).toEqual(['Entrée · Entrée sans marche', 'Toilettes · Toilettes adaptées'])
  })

  it('dit quand il n’y a pas de toilettes du tout', () => {
    expect(texts({ sanitaires_presence: false, sanitaires_adaptes: null })).toContain('Toilettes · Pas de toilettes')
  })
})

describe('decrireAcceslibre : se tenir', () => {
  it('dit s’il y a une main courante, seulement là où il y a des marches', () => {
    const texts = (fields: Partial<AcceslibreRow>) => describeAcceslibre(line(fields)).lines.map(l => l.text)
    expect(texts({ entree_plain_pied: false, entree_marches: 2, entree_marches_main_courante: true })).toContain('Main courante pour se tenir')
    expect(texts({ entree_plain_pied: false, entree_marches: 2, entree_marches_main_courante: false })).toContain('Pas de main courante')
    expect(texts({ entree_plain_pied: true, entree_marches_main_courante: false })).not.toContain('Pas de main courante')
  })
})
