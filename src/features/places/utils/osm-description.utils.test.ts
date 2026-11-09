import { describe, expect, it } from 'vitest'
import { describeOsm, osmLabel, osmType } from '~/features/places/utils/osm-description.utils'

describe('typeOsm', () => {
  it('reconnaît les places, toilettes, cafés et restaurants, et rien d’autre', () => {
    expect(osmType({ amenity: 'parking_space', parking_space: 'disabled' })).toBe('parking')
    expect(osmType({ amenity: 'toilets' })).toBe('wc')
    expect(osmType({ amenity: 'pub' })).toBe('cafe')
    expect(osmType({ amenity: 'fast_food' })).toBe('restaurant')
    expect(osmType({ shop: 'bakery' })).toBeNull()
    expect(osmType({ amenity: 'bench' })).toBeNull()
  })

  it('donne un libellé lisible', () => {
    expect(osmLabel('cafe', { amenity: 'pub' })).toBe('Bar')
    expect(osmLabel('parking', {})).toBe('Place handicapée')
  })
})

describe('decrireOsm', () => {
  it('compte les places handicapées d’un parking, sans critère étranger au handicap', () => {
    const { state, lines } = describeOsm('parking', { 'capacity:disabled': '3', fee: 'no' })
    expect(state).toBe('parking')
    expect(lines.map(l => l.text)).toEqual(['3 places handicapées'])
  })

  it('marque « ok » un café accessible avec toilettes adaptées, et conseille de demander au comptoir', () => {
    const r = describeOsm('cafe', { wheelchair: 'yes', 'toilets:wheelchair': 'yes' })
    expect(r.state).toBe('ok')
    expect(r.advice).toMatch(/comptoir/)
  })

  it('ne promet jamais des toilettes adaptées quand on ne sait pas', () => {
    const r = describeOsm('restaurant', { wheelchair: 'yes' })
    expect(r.state).toBe('check')
    expect(r.lines).toContainEqual(expect.objectContaining({ answer: 'warning', text: 'Toilettes : on ne sait pas' }))
  })

  it('reste « à vérifier » si l’entrée n’est que partiellement accessible', () => {
    expect(describeOsm('cafe', { wheelchair: 'limited', 'toilets:wheelchair': 'yes' }).state).toBe('check')
  })

  it('signale clairement des toilettes non adaptées', () => {
    const r = describeOsm('cafe', { wheelchair: 'yes', 'toilets:wheelchair': 'no' })
    expect(r.lines).toContainEqual(expect.objectContaining({ answer: 'no' }))
  })

  it('marque « pas accessible » un lieu ou des toilettes signalés non accessibles en fauteuil', () => {
    expect(describeOsm('restaurant', { wheelchair: 'no' }).state).toBe('no')
    expect(describeOsm('wc', { wheelchair: 'no' }).state).toBe('no')
  })

  it('marque « inconnu » un lieu sans aucune info, et invite à la renseigner', () => {
    const r = describeOsm('cafe', {})
    expect(r.state).toBe('unknown')
    expect(r.advice).toMatch(/Dites-nous/)
    expect(describeOsm('wc', {}).state).toBe('unknown')
  })

  it('lit toilets:wheelchair sur des toilettes publiques sans « wheelchair », sans jamais supposer « accessible »', () => {
    expect(describeOsm('wc', { 'toilets:wheelchair': 'no' }).state).toBe('no')
    expect(describeOsm('wc', { 'toilets:wheelchair': 'yes' }).state).toBe('ok')
    expect(describeOsm('wc', { wheelchair: 'unknown' }).state).toBe('unknown')
  })

  it('distingue les toilettes publiques adaptées de celles à accès limité', () => {
    expect(describeOsm('wc', { wheelchair: 'yes' }).state).toBe('ok')
    expect(describeOsm('wc', { wheelchair: 'limited' }).state).toBe('check')
  })
})

describe('decrireOsm : détails renseignés par les bénévoles', () => {
  const texts = (t: Record<string, string>) => describeOsm('cafe', t).lines.map(l => `${l.theme} · ${l.text}`)

  it('ajoute les autres critères handicap du wiki, et rien d’autre', () => {
    expect(texts({
      wheelchair: 'limited', step_count: '1', 'ramp:wheelchair': 'yes', automatic_door: 'yes', 'door:width': '0.9',
      level: '1', hearing_loop: 'yes', 'wheelchair:description': 'Sonner à droite', changing_table: 'yes', fee: 'yes',
    })).toEqual([
      'Entrée · Une petite marche à l’entrée',
      'Toilettes · Toilettes : on ne sait pas',
      'Entrée · 1 marche',
      'Entrée · Rampe à l’entrée',
      'Entrée · Porte automatique',
      'Entrée · Porte de 90 cm',
      'À l’intérieur · Au 1er étage',
      'Accueil · Boucle magnétique',
      'Accueil · Précision laissée par un visiteur',
    ])
  })

  it('dit ce qu’on voit, avec le sens du wiki pour wheelchair dessous', () => {
    expect(describeOsm('cafe', { wheelchair: 'limited' }).lines[0]).toMatchObject({ text: 'Une petite marche à l’entrée', detail: '7 cm au plus (accès partiel en fauteuil)' })
    expect(describeOsm('cafe', { wheelchair: 'no' }).lines[0]).toMatchObject({ text: 'Marche haute ou escalier à l’entrée', detail: 'Plus de 7 cm (pas accessible en fauteuil)' })
  })

  it('garde les détails même quand l’accessibilité n’est pas renseignée', () => {
    expect(describeOsm('cafe', { level: '-1' }).lines.map(l => l.text)).toEqual(['Accessibilité inconnue', 'En sous-sol'])
  })
})
