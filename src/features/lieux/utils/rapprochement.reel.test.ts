import { describe, expect, it } from 'vitest'
import dinan from '~/features/lieux/mocks/rapprochement/dinan.json'
import lille from '~/features/lieux/mocks/rapprochement/lille-vieux-lille.json'
import lyon from '~/features/lieux/mocks/rapprochement/lyon-presquile.json'
import marseille from '~/features/lieux/mocks/rapprochement/marseille-cours-julien.json'
import montreuil from '~/features/lieux/mocks/rapprochement/montreuil-centre.json'
import paris from '~/features/lieux/mocks/rapprochement/paris-hotel-de-ville.json'
import riquewihr from '~/features/lieux/mocks/rapprochement/riquewihr.json'
import sarlat from '~/features/lieux/mocks/rapprochement/sarlat.json'
import tours from '~/features/lieux/mocks/rapprochement/tours-centre.json'
import { apparier, depuisAcceslibre, depuisOsm, regrouper, uneFicheParLieu, type Candidat } from '~/features/lieux/utils/rapprochement.utils'
import { distanceMetres } from '~/utils/distance.utils'

// Le rapprochement rodé sur de vraies données de neuf endroits (mocks/rapprochement/LISEZMOI.md) : quatre
// pour régler les règles, puis cinq neufs pour les mettre à l'épreuve sans les retoucher. Les paires aux
// noms différents ont été relues à la main le 9 novembre 2026 : les cas ci-dessous sont les plus
// difficiles, et le nombre de paires par endroit signale tout changement de comportement.

type Zone = { osm: Parameters<typeof depuisOsm>[0][]; acceslibre: Parameters<typeof depuisAcceslibre>[0][] }

function rapprocher(zone: Zone) {
  const osm = zone.osm.map(depuisOsm).filter((c): c is Candidat => c !== null)
  const fiches = zone.acceslibre.map(depuisAcceslibre).filter((c): c is Candidat => c !== null)
  const groupes = regrouper(fiches).map(g => g.map(i => fiches[i]))
  const acceslibre = uneFicheParLieu(fiches)
  const paires = apparier(osm, acceslibre).map(([i, j]) => [osm[i], acceslibre[j]] as const)
  // Les noms, pour écrire les cas comme on les lit : « OSM ~ Acceslibre ».
  const noms = paires.map(([o, a]) => `${o.nom} ~ ${a.nom}`)
  return { paires, noms, groupes: groupes.filter(g => g.length > 1).map(g => g.map(c => c.nom)) }
}

const ZONES = { paris, tours, montreuil, sarlat, lyon, lille, marseille, dinan, riquewihr } as unknown as Record<string, Zone>
const resultats = Object.fromEntries(Object.entries(ZONES).map(([nom, zone]) => [nom, rapprocher(zone)]))

describe('rapprochement sur de vraies données', () => {
  it('le nombre de paires de chaque endroit (relues à la main)', () => {
    expect(Object.fromEntries(Object.entries(resultats).map(([nom, r]) => [nom, r.paires.length])))
      .toEqual({ paris: 131, tours: 98, montreuil: 40, sarlat: 13, lyon: 222, lille: 60, marseille: 43, dinan: 30, riquewihr: 7 })
  })

  it('jamais à plus de 100 m, jamais des toilettes avec un café', () => {
    for (const { paires } of Object.values(resultats)) {
      for (const [o, a] of paires) {
        expect(distanceMetres(o, a)).toBeLessThanOrEqual(100)
        expect(!!o.toilettes).toBe(!!a.toilettes)
      }
    }
  })

  it('reconnaît les noms écrits autrement', () => {
    const noms = Object.values(resultats).flatMap(r => r.noms)
    expect(noms).toEqual(expect.arrayContaining([
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
    const noms = Object.values(resultats).flatMap(r => r.noms)
    for (const faux of [
      'Dong ~ Madiba - Afro Hot Dog', // « dong » n'est pas « dog »
      'Le Relais de l\'Hôtel de Ville ~ Sanisette automatique de la ville de Paris', // toilettes à la même adresse
      'Mulan ~ BléNoir Family le Marais', // deux commerces à la même adresse
      'Casa Loca ~ Cabana Beach',
      'Le Bistrot des Halles ~ Au D\'Tours des Halles', // seulement des mots du quartier en commun
      'Bouillon Maurice ~ BOUILLON DE LYON', // une spécialité ne prouve rien
      'Salon de thé - café - Canebière ~ O\'tacos Marseille Canebière', // le nom de la rue
      'Le Bar de la Plaine ~ Beer De La Plaine -', // « beer » simplifié en « ber » : une lettre de « bar »
      'Little Boston ~ Boston tavern', // un seul mot commun, de part et d’autre d’autres mots
    ]) expect(noms).not.toContain(faux)
  })

  it('regroupe les fiches Acceslibre en double, sans regrouper deux lieux du même quartier', () => {
    const groupes = Object.values(resultats).flatMap(r => r.groupes.map(g => g.join(' + ')))
    expect(groupes).toEqual(expect.arrayContaining([
      'Eataly + EATALY PARIS MARAIS',
      'Bistrot Beaubourg + le bistrot beaubourg',
      'BENOIT + Benoit Paris',
      'Le Petit Patrimoine + Petit patrimoine',
    ]))
    for (const groupe of groupes) {
      expect(groupe).not.toMatch(/Café du marais.*Kyo marais|Kyo marais.*Café du marais/)
      expect(groupe).not.toMatch(/Café Beaubourg.*Resto beaubourg|Beaubourg \+ Café Beaubourg/)
      expect(groupe).not.toMatch(/Au D'Tours des Halles.*Bistrot Des Halles/)
      expect(groupe).not.toMatch(/Boston tavern.*Boston trattoria|Boston trattoria.*Boston tavern/) // deux spécialités
      expect(groupe).not.toMatch(/CONFORT KEBAB.*RE CONFORT|RE CONFORT.*CONFORT KEBAB/) // la rue Confort
    }
  })
})
