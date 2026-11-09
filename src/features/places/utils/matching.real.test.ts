import { describe, expect, it } from 'vitest'
import dinan from '~/features/places/mocks/matching/dinan.json'
import lille from '~/features/places/mocks/matching/lille-vieux-lille.json'
import lyon from '~/features/places/mocks/matching/lyon-presquile.json'
import marseille from '~/features/places/mocks/matching/marseille-cours-julien.json'
import montreuil from '~/features/places/mocks/matching/montreuil-centre.json'
import paris from '~/features/places/mocks/matching/paris-hotel-de-ville.json'
import riquewihr from '~/features/places/mocks/matching/riquewihr.json'
import sarlat from '~/features/places/mocks/matching/sarlat.json'
import tours from '~/features/places/mocks/matching/tours-centre.json'
import { pair, fromAcceslibre, fromOsm, groupDuplicates, oneRecordPerPlace, type Candidate } from '~/features/places/utils/matching.utils'
import { distanceMetres } from '~/utils/distance.utils'

// Le rapprochement rodé sur de vraies données de neuf endroits (mocks/rapprochement/LISEZMOI.md) : quatre
// pour régler les règles, puis cinq neufs pour les mettre à l'épreuve sans les retoucher. Les paires aux
// noms différents ont été relues à la main le 9 novembre 2026 : les cas ci-dessous sont les plus
// difficiles, et le nombre de paires par endroit signale tout changement de comportement.

type Zone = { osm: Parameters<typeof fromOsm>[0][]; acceslibre: Parameters<typeof fromAcceslibre>[0][] }

function matchZone(zone: Zone) {
  const osm = zone.osm.map(fromOsm).filter((c): c is Candidate => c !== null)
  const records = zone.acceslibre.map(fromAcceslibre).filter((c): c is Candidate => c !== null)
  const groups = groupDuplicates(records).map(g => g.map(i => records[i]))
  const acceslibre = oneRecordPerPlace(records)
  const pairs = pair(osm, acceslibre).map(([i, j]) => [osm[i], acceslibre[j]] as const)
  // Les noms, pour écrire les cas comme on les lit : « OSM ~ Acceslibre ».
  const names = pairs.map(([o, a]) => `${o.name} ~ ${a.name}`)
  return { pairs, names, groups: groups.filter(g => g.length > 1).map(g => g.map(c => c.name)) }
}

const ZONES = { paris, tours, montreuil, sarlat, lyon, lille, marseille, dinan, riquewihr } as unknown as Record<string, Zone>
const results = Object.fromEntries(Object.entries(ZONES).map(([name, zone]) => [name, matchZone(zone)]))

describe('rapprochement sur de vraies données', () => {
  it('le nombre de paires de chaque endroit (relues à la main)', () => {
    expect(Object.fromEntries(Object.entries(results).map(([name, r]) => [name, r.pairs.length])))
      .toEqual({ paris: 131, tours: 98, montreuil: 40, sarlat: 13, lyon: 222, lille: 60, marseille: 43, dinan: 30, riquewihr: 7 })
  })

  it('jamais à plus de 100 m, jamais des toilettes avec un café', () => {
    for (const { pairs } of Object.values(results)) {
      for (const [o, a] of pairs) {
        expect(distanceMetres(o, a)).toBeLessThanOrEqual(100)
        expect(!!o.toilets).toBe(!!a.toilets)
      }
    }
  })

  it('reconnaît les noms écrits autrement', () => {
    const names = Object.values(results).flatMap(r => r.names)
    expect(names).toEqual(expect.arrayContaining([
      'Eat Day ~ EatDay', // collé
      'Le Coupe Gorge ~ Le Coup Gorge', // faute de frappe
      'Paris Kebab ~ PARIS KEBAP',
      'Filippo ~ Restaurant Filippo', // mot de métier en plus
      'Le Sultan ~ Sultan',
      'Manhattan burgers ~ Manhattn\'s Burgers', // même adresse
      'Cœur de Breizh ~ Coeur de Breizh',
      'O\'Bist\'Ro ~ OBist\'Ro',
      'Café Cox ~ COX',
      'Le 405 ~ 405 bar', // trois fiches du même bar ne font pas un mot du quartier
      'BHV ~ BHV BRASSERIE HOTEL DE VILLE',
      'L\'express ~ L\'Express 1957',
      'L\'Épicerie de Ginette ~ Bistrot a Tartines', // reconnue par le nom de l’autre fiche du groupe
      'Boston Taverne ~ Boston tavern', // taverne et tavern : la même spécialité
      'Din\'en Crêpes ~ DIN\'en CREPE',
      'Grill Burger ~ Grill Burger', // un nom fait de spécialités reste un nom
    ]))
  })

  it('ne réunit pas des lieux différents', () => {
    const names = Object.values(results).flatMap(r => r.names)
    for (const wrong of [
      'Dong ~ Madiba - Afro Hot Dog', // « dong » n'est pas « dog »
      'Le Relais de l\'Hôtel de Ville ~ Sanisette automatique de la ville de Paris', // toilettes à la même adresse
      'Mulan ~ BléNoir Family le Marais', // deux commerces à la même adresse
      'Casa Loca ~ Cabana Beach',
      'Le Bistrot des Halles ~ Au D\'Tours des Halles', // seulement des mots du quartier en commun
      'Bouillon Maurice ~ BOUILLON DE LYON', // une spécialité ne prouve rien
      'Salon de thé - café - Canebière ~ O\'tacos Marseille Canebière', // le nom de la rue
      'Le Bar de la Plaine ~ Beer De La Plaine -', // « beer » simplifié en « ber » : une lettre de « bar »
      'Little Boston ~ Boston tavern', // un seul mot commun, de part et d’autre d’autres mots
    ]) expect(names).not.toContain(wrong)
  })

  it('regroupe les fiches Acceslibre en double, sans regrouper deux lieux du même quartier', () => {
    const groups = Object.values(results).flatMap(r => r.groups.map(g => g.join(' + ')))
    expect(groups).toEqual(expect.arrayContaining([
      'Eataly + EATALY PARIS MARAIS',
      'Bistrot Beaubourg + le bistrot beaubourg',
      'BENOIT + Benoit Paris',
      'Le Petit Patrimoine + Petit patrimoine',
    ]))
    for (const group of groups) {
      expect(group).not.toMatch(/Café du marais.*Kyo marais|Kyo marais.*Café du marais/)
      expect(group).not.toMatch(/Café Beaubourg.*Resto beaubourg|Beaubourg \+ Café Beaubourg/)
      expect(group).not.toMatch(/Au D'Tours des Halles.*Bistrot Des Halles/)
      expect(group).not.toMatch(/Boston tavern.*Boston trattoria|Boston trattoria.*Boston tavern/) // deux spécialités
      expect(group).not.toMatch(/CONFORT KEBAB.*RE CONFORT|RE CONFORT.*CONFORT KEBAB/) // la rue Confort
    }
  })
})
