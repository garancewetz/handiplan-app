import { describe, expect, it } from 'vitest'
import { changements, commentaire, enMots, nouvellesEtiquettes, questionsPour } from '~/features/contribution/utils/questions.utils'

describe('questionsPour', () => {
  it('pose l’entrée puis les toilettes pour un café', () => {
    expect(questionsPour('cafe').map(q => q.cle)).toEqual(['wheelchair', 'toilets:wheelchair'])
  })

  it('ne pose que « wheelchair » pour des toilettes publiques, et rien pour une place', () => {
    expect(questionsPour('wc').map(q => q.cle)).toEqual(['wheelchair'])
    expect(questionsPour('parking')).toEqual([])
  })

  it('ne propose que des valeurs du wiki', () => {
    expect(questionsPour('cafe')[0].choix.map(c => c.valeur)).toEqual(['yes', 'limited', 'no'])
    expect(questionsPour('cafe')[1].choix.map(c => `${c.cle ?? 'toilets:wheelchair'}=${c.valeur}`)).toEqual([
      'toilets:wheelchair=yes', 'toilets:wheelchair=no', 'toilets=no',
    ])
  })
})

describe('nouvellesEtiquettes', () => {
  it('écrit la réponse et sa date de vérification, sans toucher au reste', () => {
    const avant = { name: 'Le Bistrot', amenity: 'cafe', wheelchair: 'limited' }
    expect(nouvellesEtiquettes(avant, { wheelchair: 'yes' }, new Date('2026-11-08T10:00:00Z'))).toEqual({
      name: 'Le Bistrot', amenity: 'cafe', wheelchair: 'yes', 'check_date:wheelchair': '2026-11-08',
    })
  })

  it('date aussi une réponse qui confirme la valeur existante', () => {
    expect(nouvellesEtiquettes({ wheelchair: 'yes' }, { wheelchair: 'yes' }, new Date('2026-11-08'))['check_date:wheelchair']).toBe('2026-11-08')
  })

  it('« pas de toilettes » pose toilets=no, pas « toilettes non adaptées »', () => {
    expect(nouvellesEtiquettes({ amenity: 'cafe' }, { toilets: 'no' }, new Date('2026-11-08'))).toEqual({
      amenity: 'cafe', toilets: 'no', 'check_date:toilets': '2026-11-08',
    })
    expect(enMots('toilets', 'no')).toBe('pas de toilettes')
    expect(commentaire({ toilets: 'no' }, 'cafe')).toBe('Accessibilité vérifiée sur place : toilettes')
  })
})

describe('changements', () => {
  it('montre ce que dit la carte et ce que dit la personne', () => {
    expect(changements({ wheelchair: 'limited' }, { wheelchair: 'yes', 'toilets:wheelchair': 'yes' })).toEqual([
      { cle: 'wheelchair', avant: 'limited', apres: 'yes' },
      { cle: 'toilets:wheelchair', avant: undefined, apres: 'yes' },
    ])
    expect(enMots('wheelchair', 'limited')).toBe('une petite marche')
    expect(enMots('toilets:wheelchair', undefined)).toBe('on ne sait pas')
  })
})

describe('commentaire', () => {
  it('dit en clair ce qui a été vérifié', () => {
    expect(commentaire({ wheelchair: 'yes', 'toilets:wheelchair': 'no' }, 'cafe')).toBe('Accessibilité vérifiée sur place : entrée, toilettes')
    expect(commentaire({ wheelchair: 'yes' }, 'wc')).toBe('Accessibilité vérifiée sur place : toilettes')
  })
})
