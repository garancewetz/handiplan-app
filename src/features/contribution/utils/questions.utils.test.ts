import { describe, expect, it } from 'vitest'
import { changes, changesetComment, inWords, newTags, questionsFor } from '~/features/contribution/utils/questions.utils'

describe('questionsFor', () => {
  it('pose l’entrée puis les toilettes pour un café', () => {
    expect(questionsFor('cafe').map(q => q.key)).toEqual(['wheelchair', 'toilets:wheelchair'])
  })

  it('ne pose que « wheelchair » pour des toilettes publiques, et rien pour une place', () => {
    expect(questionsFor('wc').map(q => q.key)).toEqual(['wheelchair'])
    expect(questionsFor('parking')).toEqual([])
  })

  it('ne propose que des valeurs du wiki', () => {
    expect(questionsFor('cafe')[0].choice.map(c => c.value)).toEqual(['yes', 'limited', 'no'])
    expect(questionsFor('cafe')[1].choice.map(c => `${c.key ?? 'toilets:wheelchair'}=${c.value}`)).toEqual([
      'toilets:wheelchair=yes', 'toilets:wheelchair=no', 'toilets=no',
    ])
  })
})

describe('newTags', () => {
  it('écrit la réponse et sa date de vérification, sans toucher au reste', () => {
    const before = { name: 'Le Bistrot', amenity: 'cafe', wheelchair: 'limited' }
    expect(newTags(before, { wheelchair: 'yes' }, new Date('2026-11-08T10:00:00Z'))).toEqual({
      name: 'Le Bistrot', amenity: 'cafe', wheelchair: 'yes', 'check_date:wheelchair': '2026-11-08',
    })
  })

  it('date aussi une réponse qui confirme la valeur existante', () => {
    expect(newTags({ wheelchair: 'yes' }, { wheelchair: 'yes' }, new Date('2026-11-08'))['check_date:wheelchair']).toBe('2026-11-08')
  })

  it('« pas de toilettes » pose toilets=no, pas « toilettes non adaptées »', () => {
    expect(newTags({ amenity: 'cafe' }, { toilets: 'no' }, new Date('2026-11-08'))).toEqual({
      amenity: 'cafe', toilets: 'no', 'check_date:toilets': '2026-11-08',
    })
    expect(inWords('toilets', 'no')).toBe('pas de toilettes')
    expect(changesetComment({ toilets: 'no' }, 'cafe')).toBe('Accessibilité vérifiée sur place : toilettes')
  })
})

describe('changes', () => {
  it('montre ce que dit la carte et ce que dit la personne', () => {
    expect(changes({ wheelchair: 'limited' }, { wheelchair: 'yes', 'toilets:wheelchair': 'yes' })).toEqual([
      { key: 'wheelchair', before: 'limited', after: 'yes' },
      { key: 'toilets:wheelchair', before: undefined, after: 'yes' },
    ])
    expect(inWords('wheelchair', 'limited')).toBe('une petite marche')
    expect(inWords('toilets:wheelchair', undefined)).toBe('on ne sait pas')
  })
})

describe('changesetComment', () => {
  it('dit en clair ce qui a été vérifié', () => {
    expect(changesetComment({ wheelchair: 'yes', 'toilets:wheelchair': 'no' }, 'cafe')).toBe('Accessibilité vérifiée sur place : entrée, toilettes')
    expect(changesetComment({ wheelchair: 'yes' }, 'wc')).toBe('Accessibilité vérifiée sur place : toilettes')
  })
})
