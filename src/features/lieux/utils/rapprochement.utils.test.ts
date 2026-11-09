import { describe, expect, it } from 'vitest'
import { apparier, depuisAcceslibre, depuisOsm, memeAdresse, memeLieu, motsCourants, motsDesRues, regrouper, ressemblance, type Candidat } from '~/features/lieux/utils/rapprochement.utils'

const ICI = { lat: 48.8566, lon: 2.3522 }
// ≈ 11 m, ≈ 55 m, ≈ 78 m et ≈ 110 m vers le nord
const A_11_M = 48.8567
const A_55_M = 48.8571
const A_78_M = 48.8573
const A_110_M = 48.8576

const lieu = (nom: string, champs: Partial<Candidat> = {}): Candidat => ({ id: nom, nom, ...ICI, ...champs })

describe('ressemblance', () => {
  it('compare les mots, sans accents, petits mots ni lettres doublées', () => {
    expect(ressemblance('L’As du Fallafel', 'AS DU FALAFEL')).toBe(1)
    expect(ressemblance('Cœur de Breizh', 'Coeur de Breizh')).toBe(1)
    expect(ressemblance('Le Bistrot St-Paul', 'Bistrot Saint Paul')).toBe(1)
    expect(ressemblance('Le Bistrot', 'Le Marais Café')).toBe(0)
  })

  it('tolère une faute de frappe par mot, pas sur les mots courts', () => {
    expect(ressemblance('Le Coupe Gorge', 'Le Coup Gorge')).toBe(1)
    expect(ressemblance('Paris Kebab', 'PARIS KEBAP')).toBe(1)
    expect(ressemblance('Dong', 'Madiba - Afro Hot Dog')).toBe(0)
  })

  it('ignore les mots courants de l’endroit : ils disent où, pas lequel', () => {
    const courants = new Set(['marais'])
    expect(ressemblance('Café du marais', 'Kyo marais')).toBe(1)
    expect(ressemblance('Café du marais', 'Kyo marais', courants)).toBe(0)
  })

  it('un mot courant n’est pas une preuve, mais il reste dans le nom', () => {
    expect(ressemblance('Eataly', 'EATALY PARIS MARAIS', new Set(['paris', 'marais']))).toBe(1)
    expect(ressemblance('Kyo Lyon Opéra', 'Kyo', new Set(['lyon', 'opera']))).toBe(1)
    expect(ressemblance('Le Petit Léon', 'Léon de Lyon', new Set(['leon', 'lyon']))).toBe(0)
  })

  it('un nom de métier seul ne ressemble à rien : il ne dit pas quel lieu c’est', () => {
    expect(ressemblance('Restaurant', 'Restaurant')).toBe(0)
    expect(ressemblance('Toilettes publiques', 'Toilettes publiques')).toBe(0)
  })
})

describe('motsCourants', () => {
  it('les mots d’au moins trois endroits', () => {
    expect(motsCourants([lieu('Kyo Marais'), lieu('Café du Marais', { lat: A_78_M }), lieu('Pizzou Marais', { lat: 48.8590 }), lieu('Eataly')]))
      .toEqual(new Set(['marais']))
  })

  it('trois fiches du même bar ne font qu’un endroit', () => {
    // « 405 bar », « 405 Bar à Bières », « Bar 405 » : le même bar à Lyon, pas un mot du quartier
    expect(motsCourants([lieu('405 bar'), lieu('405 Bar à Bières', { lat: A_11_M }), lieu('Bar 405', { lat: A_11_M })])).toEqual(new Set())
  })
})

describe('motsDesRues', () => {
  it('les mots des rues de l’endroit', () => {
    expect(motsDesRues([lieu('Confort Kebab', { adresse: { numero: '12', rue: 'Rue Confort' } })])).toEqual(new Set(['rue', 'confort']))
  })
})

describe('memeAdresse', () => {
  it('reconnaît le même numéro écrit autrement, et une plage', () => {
    expect(memeAdresse({ numero: '11 bis', rue: 'Rue Saint-Martin' }, { numero: '11B', rue: 'rue St Martin' })).toBe(true)
    expect(memeAdresse({ numero: '31-35', rue: 'Boulevard de Sébastopol' }, { numero: '35', rue: 'Bd de Sébastopol' })).toBe(true)
    expect(memeAdresse({ numero: '11', rue: 'Rue Saint-Martin' }, { numero: '11 bis', rue: 'Rue Saint-Martin' })).toBe(false)
    expect(memeAdresse({ numero: '35;39bis', rue: 'Rue de l’Église' }, { numero: '39 bis', rue: 'Rue de l’Église' })).toBe(true)
    expect(memeAdresse({ numero: '12', rue: 'Rue des Rosiers' }, { numero: '12', rue: 'Rue des Écouffes' })).toBe(false)
  })
})

describe('memeLieu', () => {
  it('reconnaît le même lieu proche avec un nom ressemblant', () => {
    expect(memeLieu(lieu('Feria Café'), lieu('FERIA CAFE', { lat: A_11_M }))).toBe(true)
    expect(memeLieu(lieu('Pizzeria Da Mario'), lieu('Da Mario', { lat: A_11_M }))).toBe(true)
  })

  it('ne confond pas deux lieux éloignés, ni deux voisins dont le nom commence pareil', () => {
    expect(memeLieu(lieu('Feria Café'), lieu('Feria Café', { lat: A_110_M }))).toBe(false)
    expect(memeLieu(lieu('Le Bistrot'), lieu('Le Marais Café', { lat: A_11_M }))).toBe(false)
    expect(memeLieu(lieu('Café de Flore'), lieu('Café Charlot', { lat: A_11_M }))).toBe(false)
  })

  it('à la même adresse, un mot commun suffit, même un peu plus loin', () => {
    const adresse = { numero: '12', rue: 'Rue des Rosiers' }
    expect(memeLieu(lieu('Chez Marcel', { adresse }), lieu('Bistrot Marcel', { lat: A_55_M, adresse }))).toBe(true)
    expect(memeLieu(lieu('Chez Marcel', { adresse }), lieu('Sushi Shop', { lat: A_55_M, adresse }))).toBe(false)
  })

  it('le même nom exactement, jusqu’à 100 m (les deux bases notent parfois un autre numéro)', () => {
    expect(memeLieu(lieu('Janet by Homer'), lieu('Janet by Homer', { lat: A_78_M }))).toBe(true)
  })

  it('le même nom : les mêmes mots qui comptent, ou les mêmes lettres collées', () => {
    expect(memeLieu(lieu('Filippo'), lieu('Restaurant Filippo', { lat: A_78_M }))).toBe(true)
    expect(memeLieu(lieu('Eat Day'), lieu('EatDay', { lat: A_78_M }))).toBe(true)
    // un mot courant de l’endroit ne suffit pas, même collé à un mot de métier
    expect(memeLieu(lieu('Bistrot Beaubourg'), lieu('Café Beaubourg', { lat: 48.8568 }), new Set(['beaubourg']))).toBe(false) // ≈ 22 m
  })

  it('à la même adresse, même un mot de la rue suffit', () => {
    const adresse = { numero: '6', rue: 'Rue du Renard' }
    expect(memeLieu(lieu('Le Renard', { adresse }), lieu('Le Renard Bistrot', { lat: A_11_M, adresse }), new Set(['renard']))).toBe(true)
    // mais pas à un autre numéro : « Confort Kebab » (12) et « Re Confort Café » (5), rue Confort
    expect(memeLieu(lieu('Confort Kebab', { adresse: { numero: '12', rue: 'Rue Confort' } }), lieu('Re Confort Café', { lat: A_11_M, adresse: { numero: '5', rue: 'Rue Confort' } }), new Set(['confort']))).toBe(false)
  })

  it('deux spécialités différentes sont deux lieux ; un genre de lieu, non', () => {
    expect(memeLieu(lieu('Boston tavern'), lieu('Boston trattoria', { lat: A_11_M }))).toBe(false)
    expect(memeLieu(lieu('Café Leffe'), lieu('Brasserie Leffe', { lat: A_11_M }))).toBe(true)
    expect(memeLieu(lieu('Bouillon Maurice'), lieu('Bouillon de Lyon', { lat: A_11_M }), new Set(['lyon']))).toBe(false)
  })

  it('les mêmes mots à une faute près, mot à mot', () => {
    expect(memeLieu(lieu('Paris Kebab'), lieu('PARIS KEBAP', { lat: A_11_M }), new Set(['paris']))).toBe(true)
    expect(memeLieu(lieu('Le Bistrot 31'), lieu('Le Bistrot 32', { lat: A_11_M }))).toBe(false)
    // « Beer » simplifié devient « ber » : collé, il n’aurait qu’une lettre d’écart avec « bar »
    expect(memeLieu(lieu('Le Bar de la Plaine'), lieu('Beer De La Plaine', { lat: A_78_M }))).toBe(false)
  })

  it('ne réunit jamais deux lieux sans vrai nom', () => {
    expect(memeLieu(lieu('Restaurant'), lieu('Restaurant', { lat: A_11_M }))).toBe(false)
  })

  it('ne prend jamais des toilettes publiques pour le café d’à côté', () => {
    // la Sanisette du 50 rue de Rivoli et le café « Relais de l’Hôtel de Ville », à la même adresse
    const adresse = { numero: '50', rue: 'Rue de Rivoli' }
    expect(memeLieu(lieu('Le Relais de l’Hôtel de Ville', { adresse }), lieu('Sanisette Hôtel de Ville', { lat: A_11_M, adresse, toilettes: true }))).toBe(false)
  })
})

describe('apparier', () => {
  it('chaque lieu une seule fois, au plus ressemblant', () => {
    const osm = [lieu('Le Petit Marcel')]
    const fiches = [lieu('Marcel et fils', { lat: A_11_M }), lieu('Petit Marcel', { lat: A_11_M })]
    expect(apparier(osm, fiches)).toEqual([[0, 1]])
  })
})

describe('regrouper', () => {
  it('regroupe les fiches du même lieu, dans l’ordre donné', () => {
    const fiches = [lieu('Eataly'), lieu('Sushi Shop', { lat: A_11_M }), lieu('EATALY PARIS MARAIS')]
    expect(regrouper(fiches)).toEqual([[0, 2], [1]])
  })
})

describe('depuis les données brutes', () => {
  it('un élément OSM : nom, position (ou centre), adresse, toilettes', () => {
    expect(depuisOsm({ type: 'way', id: 7, center: ICI, tags: { amenity: 'toilets', name: 'Sanisette', 'addr:housenumber': '50', 'addr:street': 'Rue de Rivoli' } }))
      .toEqual({ id: 'way/7', nom: 'Sanisette', ...ICI, adresse: { numero: '50', rue: 'Rue de Rivoli' }, toilettes: true })
    expect(depuisOsm({ type: 'node', id: 1, ...ICI, tags: { amenity: 'cafe' } })).toBeNull()
  })

  it('une fiche Acceslibre', () => {
    expect(depuisAcceslibre({ id: 'x', name: 'Bayan', activite: 'Restaurant', latitude: ICI.lat, longitude: ICI.lon, numero: '4', voie: 'Rue de la Coutellerie' }))
      .toEqual({ id: 'acceslibre/x', nom: 'Bayan', ...ICI, adresse: { numero: '4', rue: 'Rue de la Coutellerie' } })
  })
})
