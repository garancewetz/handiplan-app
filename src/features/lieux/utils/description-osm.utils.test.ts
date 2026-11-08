import { describe, expect, it } from 'vitest'
import { decrireOsm, libelleOsm, typeOsm } from '~/features/lieux/utils/description-osm.utils'

describe('typeOsm', () => {
  it('reconnaît les places, toilettes, cafés et restaurants, et rien d’autre', () => {
    expect(typeOsm({ amenity: 'parking_space', parking_space: 'disabled' })).toBe('parking')
    expect(typeOsm({ amenity: 'toilets' })).toBe('wc')
    expect(typeOsm({ amenity: 'pub' })).toBe('cafe')
    expect(typeOsm({ amenity: 'fast_food' })).toBe('resto')
    expect(typeOsm({ shop: 'bakery' })).toBeNull()
    expect(typeOsm({ amenity: 'bench' })).toBeNull()
  })

  it('donne un libellé lisible', () => {
    expect(libelleOsm('cafe', { amenity: 'pub' })).toBe('Bar')
    expect(libelleOsm('parking', {})).toBe('Place handicapée')
  })
})

describe('decrireOsm', () => {
  it('compte les places handicapées d’un parking, sans critère étranger au handicap', () => {
    const { etat, lignes } = decrireOsm('parking', { 'capacity:disabled': '3', fee: 'no' })
    expect(etat).toBe('parking')
    expect(lignes.map(l => l.texte)).toEqual(['3 places handicapées'])
  })

  it('marque « ok » un café accessible avec toilettes adaptées, et conseille de demander au comptoir', () => {
    const r = decrireOsm('cafe', { wheelchair: 'yes', 'toilets:wheelchair': 'yes' })
    expect(r.etat).toBe('ok')
    expect(r.conseil).toMatch(/comptoir/)
  })

  it('ne promet jamais des toilettes adaptées quand on ne sait pas', () => {
    const r = decrireOsm('resto', { wheelchair: 'yes' })
    expect(r.etat).toBe('verifier')
    expect(r.lignes).toContainEqual(expect.objectContaining({ reponse: 'attention', texte: 'Toilettes : on ne sait pas' }))
  })

  it('reste « à vérifier » si l’entrée n’est que partiellement accessible', () => {
    expect(decrireOsm('cafe', { wheelchair: 'limited', 'toilets:wheelchair': 'yes' }).etat).toBe('verifier')
  })

  it('signale clairement des toilettes non adaptées', () => {
    const r = decrireOsm('cafe', { wheelchair: 'yes', 'toilets:wheelchair': 'no' })
    expect(r.lignes).toContainEqual(expect.objectContaining({ reponse: 'non' }))
  })

  it('marque « pas accessible » un lieu ou des toilettes signalés non accessibles en fauteuil', () => {
    expect(decrireOsm('resto', { wheelchair: 'no' }).etat).toBe('non')
    expect(decrireOsm('wc', { wheelchair: 'no' }).etat).toBe('non')
  })

  it('marque « inconnu » un lieu sans aucune info, et invite à la renseigner', () => {
    const r = decrireOsm('cafe', {})
    expect(r.etat).toBe('inconnu')
    expect(r.conseil).toMatch(/Dites-nous/)
    expect(decrireOsm('wc', {}).etat).toBe('inconnu')
  })

  it('lit toilets:wheelchair sur des toilettes publiques sans « wheelchair », sans jamais supposer « accessible »', () => {
    expect(decrireOsm('wc', { 'toilets:wheelchair': 'no' }).etat).toBe('non')
    expect(decrireOsm('wc', { 'toilets:wheelchair': 'yes' }).etat).toBe('ok')
    expect(decrireOsm('wc', { wheelchair: 'unknown' }).etat).toBe('inconnu')
  })

  it('distingue les toilettes publiques adaptées de celles à accès limité', () => {
    expect(decrireOsm('wc', { wheelchair: 'yes' }).etat).toBe('ok')
    expect(decrireOsm('wc', { wheelchair: 'limited' }).etat).toBe('verifier')
  })
})

describe('decrireOsm : détails renseignés par les bénévoles', () => {
  const textes = (t: Record<string, string>) => decrireOsm('cafe', t).lignes.map(l => `${l.theme} · ${l.texte}`)

  it('ajoute les autres critères handicap du wiki, et rien d’autre', () => {
    expect(textes({
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
    expect(decrireOsm('cafe', { wheelchair: 'limited' }).lignes[0]).toMatchObject({ texte: 'Une petite marche à l’entrée', detail: '7 cm au plus (accès partiel en fauteuil)' })
    expect(decrireOsm('cafe', { wheelchair: 'no' }).lignes[0]).toMatchObject({ texte: 'Marche haute ou escalier à l’entrée', detail: 'Plus de 7 cm (pas accessible en fauteuil)' })
  })

  it('garde les détails même quand l’accessibilité n’est pas renseignée', () => {
    expect(decrireOsm('cafe', { level: '-1' }).lignes.map(l => l.texte)).toEqual(['Accessibilité inconnue', 'En sous-sol'])
  })
})
