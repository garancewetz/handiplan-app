import { describe, expect, it } from 'vitest'
import { pair, fromAcceslibre, fromOsm, sameAddress, samePlace, frequentWords, streetWords, groupDuplicates, similarity, type Candidate } from '~/features/places/utils/matching.utils'

const HERE = { lat: 48.8566, lon: 2.3522 }
// ≈ 11 m, ≈ 55 m, ≈ 78 m et ≈ 110 m vers le nord
const AT_11_M = 48.8567
const AT_55_M = 48.8571
const AT_78_M = 48.8573
const AT_110_M = 48.8576

const place = (name: string, fields: Partial<Candidate> = {}): Candidate => ({ id: name, name, ...HERE, ...fields })

describe('similarity', () => {
  it('compare les mots, sans accents, petits mots ni lettres doublées', () => {
    expect(similarity('L’As du Fallafel', 'AS DU FALAFEL')).toBe(1)
    expect(similarity('Cœur de Breizh', 'Coeur de Breizh')).toBe(1)
    expect(similarity('Le Bistrot St-Paul', 'Bistrot Saint Paul')).toBe(1)
    expect(similarity('Le Bistrot', 'Le Marais Café')).toBe(0)
  })

  it('tolère une faute de frappe par mot, pas sur les mots courts', () => {
    expect(similarity('Le Coupe Gorge', 'Le Coup Gorge')).toBe(1)
    expect(similarity('Paris Kebab', 'PARIS KEBAP')).toBe(1)
    expect(similarity('Dong', 'Madiba - Afro Hot Dog')).toBe(0)
  })

  it('ignore les mots courants de l’endroit : ils disent où, pas lequel', () => {
    const frequent = new Set(['marais'])
    expect(similarity('Café du marais', 'Kyo marais')).toBe(1)
    expect(similarity('Café du marais', 'Kyo marais', frequent)).toBe(0)
  })

  it('un mot courant n’est pas une preuve, mais il reste dans le nom', () => {
    expect(similarity('Eataly', 'EATALY PARIS MARAIS', new Set(['paris', 'marais']))).toBe(1)
    expect(similarity('Kyo Lyon Opéra', 'Kyo', new Set(['lyon', 'opera']))).toBe(1)
    expect(similarity('Le Petit Léon', 'Léon de Lyon', new Set(['leon', 'lyon']))).toBe(0)
  })

  it('un nom de métier seul ne ressemble à rien : il ne dit pas quel lieu c’est', () => {
    expect(similarity('Restaurant', 'Restaurant')).toBe(0)
    expect(similarity('Toilettes publiques', 'Toilettes publiques')).toBe(0)
  })
})

describe('frequentWords', () => {
  it('les mots d’au moins trois endroits', () => {
    expect(frequentWords([place('Kyo Marais'), place('Café du Marais', { lat: AT_78_M }), place('Pizzou Marais', { lat: 48.8590 }), place('Eataly')]))
      .toEqual(new Set(['marais']))
  })

  it('trois fiches du même bar ne font qu’un endroit', () => {
    // « 405 bar », « 405 Bar à Bières », « Bar 405 » : le même bar à Lyon, pas un mot du quartier
    expect(frequentWords([place('405 bar'), place('405 Bar à Bières', { lat: AT_11_M }), place('Bar 405', { lat: AT_11_M })])).toEqual(new Set())
  })
})

describe('streetWords', () => {
  it('les mots des rues de l’endroit', () => {
    expect(streetWords([place('Confort Kebab', { address: { numero: '12', street: 'Rue Confort' } })])).toEqual(new Set(['rue', 'confort']))
  })
})

describe('sameAddress', () => {
  it('reconnaît le même numéro écrit autrement, et une plage', () => {
    expect(sameAddress({ numero: '11 bis', street: 'Rue Saint-Martin' }, { numero: '11B', street: 'rue St Martin' })).toBe(true)
    expect(sameAddress({ numero: '31-35', street: 'Boulevard de Sébastopol' }, { numero: '35', street: 'Bd de Sébastopol' })).toBe(true)
    expect(sameAddress({ numero: '11', street: 'Rue Saint-Martin' }, { numero: '11 bis', street: 'Rue Saint-Martin' })).toBe(false)
    expect(sameAddress({ numero: '35;39bis', street: 'Rue de l’Église' }, { numero: '39 bis', street: 'Rue de l’Église' })).toBe(true)
    expect(sameAddress({ numero: '12', street: 'Rue des Rosiers' }, { numero: '12', street: 'Rue des Écouffes' })).toBe(false)
  })
})

describe('samePlace', () => {
  it('reconnaît le même lieu proche avec un nom ressemblant', () => {
    expect(samePlace(place('Feria Café'), place('FERIA CAFE', { lat: AT_11_M }))).toBe(true)
    expect(samePlace(place('Pizzeria Da Mario'), place('Da Mario', { lat: AT_11_M }))).toBe(true)
  })

  it('ne confond pas deux lieux éloignés, ni deux voisins dont le nom commence pareil', () => {
    expect(samePlace(place('Feria Café'), place('Feria Café', { lat: AT_110_M }))).toBe(false)
    expect(samePlace(place('Le Bistrot'), place('Le Marais Café', { lat: AT_11_M }))).toBe(false)
    expect(samePlace(place('Café de Flore'), place('Café Charlot', { lat: AT_11_M }))).toBe(false)
  })

  it('à la même adresse, un mot commun suffit, même un peu plus loin', () => {
    const address = { numero: '12', street: 'Rue des Rosiers' }
    expect(samePlace(place('Chez Marcel', { address }), place('Bistrot Marcel', { lat: AT_55_M, address }))).toBe(true)
    expect(samePlace(place('Chez Marcel', { address }), place('Sushi Shop', { lat: AT_55_M, address }))).toBe(false)
  })

  it('le même nom exactement, jusqu’à 100 m (les deux bases notent parfois un autre numéro)', () => {
    expect(samePlace(place('Janet by Homer'), place('Janet by Homer', { lat: AT_78_M }))).toBe(true)
  })

  it('le même nom : les mêmes mots qui comptent, ou les mêmes lettres collées', () => {
    expect(samePlace(place('Filippo'), place('Restaurant Filippo', { lat: AT_78_M }))).toBe(true)
    expect(samePlace(place('Eat Day'), place('EatDay', { lat: AT_78_M }))).toBe(true)
    // un mot courant de l’endroit ne suffit pas, même collé à un mot de métier
    expect(samePlace(place('Bistrot Beaubourg'), place('Café Beaubourg', { lat: 48.8568 }), new Set(['beaubourg']))).toBe(false) // ≈ 22 m
  })

  it('à la même adresse, même un mot de la rue suffit', () => {
    const address = { numero: '6', street: 'Rue du Renard' }
    expect(samePlace(place('Le Renard', { address }), place('Le Renard Bistrot', { lat: AT_11_M, address }), new Set(['renard']))).toBe(true)
    // mais pas à un autre numéro : « Confort Kebab » (12) et « Re Confort Café » (5), rue Confort
    expect(samePlace(place('Confort Kebab', { address: { numero: '12', street: 'Rue Confort' } }), place('Re Confort Café', { lat: AT_11_M, address: { numero: '5', street: 'Rue Confort' } }), new Set(['confort']))).toBe(false)
  })

  it('deux spécialités différentes sont deux lieux ; un genre de lieu, non', () => {
    expect(samePlace(place('Boston tavern'), place('Boston trattoria', { lat: AT_11_M }))).toBe(false)
    expect(samePlace(place('Café Leffe'), place('Brasserie Leffe', { lat: AT_11_M }))).toBe(true)
    expect(samePlace(place('Bouillon Maurice'), place('Bouillon de Lyon', { lat: AT_11_M }), new Set(['lyon']))).toBe(false)
  })

  it('les mêmes mots à une faute près, mot à mot', () => {
    expect(samePlace(place('Paris Kebab'), place('PARIS KEBAP', { lat: AT_11_M }), new Set(['paris']))).toBe(true)
    expect(samePlace(place('Le Bistrot 31'), place('Le Bistrot 32', { lat: AT_11_M }))).toBe(false)
    // « Beer » simplifié devient « ber » : collé, il n’aurait qu’une lettre d’écart avec « bar »
    expect(samePlace(place('Le Bar de la Plaine'), place('Beer De La Plaine', { lat: AT_78_M }))).toBe(false)
  })

  it('ne réunit jamais deux lieux sans vrai nom', () => {
    expect(samePlace(place('Restaurant'), place('Restaurant', { lat: AT_11_M }))).toBe(false)
  })

  it('ne prend jamais des toilettes publiques pour le café d’à côté', () => {
    // la Sanisette du 50 rue de Rivoli et le café « Relais de l’Hôtel de Ville », à la même adresse
    const address = { numero: '50', street: 'Rue de Rivoli' }
    expect(samePlace(place('Le Relais de l’Hôtel de Ville', { address }), place('Sanisette Hôtel de Ville', { lat: AT_11_M, address, toilets: true }))).toBe(false)
  })
})

describe('pair', () => {
  it('chaque lieu une seule fois, au plus ressemblant', () => {
    const osm = [place('Le Petit Marcel')]
    const records = [place('Marcel et fils', { lat: AT_11_M }), place('Petit Marcel', { lat: AT_11_M })]
    expect(pair(osm, records)).toEqual([[0, 1]])
  })
})

describe('groupDuplicates', () => {
  it('regroupe les fiches du même lieu, dans l’ordre donné', () => {
    const records = [place('Eataly'), place('Sushi Shop', { lat: AT_11_M }), place('EATALY PARIS MARAIS')]
    expect(groupDuplicates(records)).toEqual([[0, 2], [1]])
  })
})

describe('depuis les données brutes', () => {
  it('un élément OSM : nom, position (ou centre), adresse, toilettes', () => {
    expect(fromOsm({ type: 'way', id: 7, center: HERE, tags: { amenity: 'toilets', name: 'Sanisette', 'addr:housenumber': '50', 'addr:street': 'Rue de Rivoli' } }))
      .toEqual({ id: 'way/7', name: 'Sanisette', ...HERE, address: { numero: '50', street: 'Rue de Rivoli' }, toilets: true })
    expect(fromOsm({ type: 'node', id: 1, ...HERE, tags: { amenity: 'cafe' } })).toBeNull()
  })

  it('une fiche Acceslibre', () => {
    expect(fromAcceslibre({ id: 'x', name: 'Bayan', activite: 'Restaurant', latitude: HERE.lat, longitude: HERE.lon, numero: '4', voie: 'Rue de la Coutellerie' }))
      .toEqual({ id: 'acceslibre/x', name: 'Bayan', ...HERE, address: { numero: '4', street: 'Rue de la Coutellerie' } })
  })
})
