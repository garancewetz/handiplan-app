import { describe, expect, it } from 'vitest'
import { fusionner, trier } from '~/features/lieux/utils/fusion-lieux.utils'
import type { Lieu } from '~/types/lieu.types'

function lieu(champs: Partial<Lieu>): Lieu {
  return {
    id: 'node/1', type: 'cafe', etat: 'verifier', nom: 'Feria Café', libelle: 'Café',
    lat: 48.8566, lon: 2.3522, metres: 100, lignes: [], sources: ['OpenStreetMap'],
    ...champs,
  }
}

// ≈ 11 m vers le nord / ≈ 110 m vers le nord
const PROCHE = 48.8567
const LOIN = 48.8576

describe('fusionner', () => {
  it('garde un seul lieu, avec la description Acceslibre et le nom OSM', () => {
    const osm = lieu({ nom: 'Feria Café' })
    const acceslibre = lieu({ id: 'acceslibre/9', nom: 'FERIA CAFE', etat: 'ok', lat: PROCHE, sources: ['Acceslibre'] })
    const resultat = fusionner([osm], [acceslibre])
    expect(resultat).toHaveLength(1)
    expect(resultat[0]).toMatchObject({ id: 'node/1', nom: 'Feria Café', etat: 'ok', sources: ['OpenStreetMap', 'Acceslibre'] })
  })

  it('un lieu OSM ne s’apparie qu’une fois, au plus ressemblant', () => {
    const osm = lieu({ nom: 'Le Petit Marcel' })
    const proche = lieu({ id: 'acceslibre/1', nom: 'Petit Marcel', lat: PROCHE, sources: ['Acceslibre'] })
    const autre = lieu({ id: 'acceslibre/2', nom: 'Marcel et fils', lat: PROCHE, sources: ['Acceslibre'] })
    const resultat = fusionner([osm], [autre, proche])
    expect(resultat.map(l => l.id)).toEqual(['node/1', 'acceslibre/2'])
  })

  it('un Acceslibre muet sur les toilettes n’efface pas des toilettes adaptées notées dans OSM', () => {
    const osm = lieu({
      etat: 'verifier', acces: { entree: 'inconnue', toilettes: 'oui' },
      lignes: [{ theme: 'Entrée', reponse: 'attention', texte: 'Entrée : on ne sait pas' }, { theme: 'Toilettes', reponse: 'oui', texte: 'Toilettes adaptées' }],
    })
    const acceslibre = lieu({
      id: 'acceslibre/9', nom: 'FERIA CAFE', lat: PROCHE, sources: ['Acceslibre'], etat: 'verifier',
      acces: { entree: 'ok', toilettes: 'inconnues' },
      lignes: [{ theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' }, { theme: 'Toilettes', reponse: 'attention', texte: 'Toilettes : on ne sait pas' }],
    })
    const [reuni] = fusionner([osm], [acceslibre])
    expect(reuni.etat).toBe('ok')
    expect(reuni.lignes.map(l => l.texte)).toEqual(['Entrée sans marche', 'Toilettes adaptées'])
    expect(reuni.conseil).toBe('Toilettes pour les clients : demandez au comptoir.')
  })

  it('quand OSM et Acceslibre se contredisent, ni l’un ni l’autre : « Attention », et ce que dit chacun', () => {
    // Restaurant Bayan : OSM « marche haute », Acceslibre « entrée sans marche » (et toilettes adaptées)
    const osm = lieu({
      nom: 'Restaurant Bayan', etat: 'non', acces: { entree: 'non', toilettes: 'inconnues' },
      lignes: [{ theme: 'Entrée', reponse: 'non', texte: 'Marche haute ou escalier à l’entrée' }],
    })
    const acceslibre = lieu({
      id: 'acceslibre/9', nom: 'Bayan', lat: PROCHE, sources: ['Acceslibre'], etat: 'ok', acces: { entree: 'ok', toilettes: 'oui' },
      lignes: [
        { theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' },
        { theme: 'Entrée', reponse: 'oui', texte: 'Porte de 90 cm' },
        { theme: 'Toilettes', reponse: 'oui', texte: 'Toilettes adaptées' },
      ],
    })
    const [reuni] = fusionner([osm], [acceslibre])
    expect(reuni.etat).toBe('verifier')
    expect(reuni.lignes[0]).toEqual({
      theme: 'Entrée', reponse: 'attention', texte: 'Entrée : les infos ne sont pas d’accord',
      detail: 'OpenStreetMap : marche haute ou escalier à l’entrée · Acceslibre : entrée sans marche',
    })
    expect(reuni.lignes.map(l => l.texte)).toEqual(['Entrée : les infos ne sont pas d’accord', 'Porte de 90 cm', 'Toilettes adaptées'])
    expect(reuni.conseil).toBe('Les infos ne sont pas d’accord : à vérifier sur place.')
  })

  it('un désaccord sur les toilettes n’est jamais « Facile »', () => {
    const osm = lieu({ acces: { entree: 'ok', toilettes: 'non' }, lignes: [{ theme: 'Toilettes', reponse: 'non', texte: 'Toilettes non adaptées' }] })
    const acceslibre = lieu({
      id: 'acceslibre/9', lat: PROCHE, sources: ['Acceslibre'], etat: 'ok', acces: { entree: 'ok', toilettes: 'oui' },
      lignes: [{ theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' }, { theme: 'Toilettes', reponse: 'oui', texte: 'Toilettes adaptées' }],
    })
    const [reuni] = fusionner([osm], [acceslibre])
    expect(reuni.etat).toBe('verifier')
    expect(reuni.lignes.find(l => l.theme === 'Toilettes')?.detail).toBe('OpenStreetMap : toilettes non adaptées · Acceslibre : toilettes adaptées')
  })

  it('« petite marche » contre « sans marche » : pas de désaccord, la réponse la plus prudente', () => {
    const osm = lieu({ acces: { entree: 'partielle', toilettes: 'inconnues' }, lignes: [{ theme: 'Entrée', reponse: 'attention', texte: 'Une petite marche à l’entrée' }] })
    const acceslibre = lieu({
      id: 'acceslibre/9', lat: PROCHE, sources: ['Acceslibre'], acces: { entree: 'ok', toilettes: 'oui' },
      lignes: [{ theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' }, { theme: 'Entrée', reponse: 'oui', texte: 'Sonnette pour appeler' }, { theme: 'Toilettes', reponse: 'oui', texte: 'Toilettes adaptées' }],
    })
    const [reuni] = fusionner([osm], [acceslibre])
    expect(reuni.etat).toBe('verifier')
    expect(reuni.lignes.map(l => l.texte)).toEqual(['Une petite marche à l’entrée', 'Sonnette pour appeler', 'Toilettes adaptées'])
    expect(reuni.conseil).toBeUndefined()
  })

  it('« petite marche » contre « marches » : les deux disent une marche, on reste « Difficile »', () => {
    const osm = lieu({ acces: { entree: 'partielle', toilettes: 'inconnues' }, lignes: [{ theme: 'Entrée', reponse: 'attention', texte: 'Une petite marche à l’entrée' }] })
    const acceslibre = lieu({
      id: 'acceslibre/9', lat: PROCHE, sources: ['Acceslibre'], acces: { entree: 'non', toilettes: 'non' },
      lignes: [{ theme: 'Entrée', reponse: 'non', texte: '2 marches à l’entrée' }, { theme: 'Toilettes', reponse: 'non', texte: 'Toilettes non adaptées' }],
    })
    const [reuni] = fusionner([osm], [acceslibre])
    expect(reuni.etat).toBe('non')
    expect(reuni.lignes[0].texte).toBe('2 marches à l’entrée')
  })

  it('le lieu réuni garde la position et le type d’OSM, plus précis', () => {
    const osm = lieu({ type: 'resto', libelle: 'Restaurant', lat: 48.8566, metres: 100 })
    const acceslibre = lieu({ id: 'acceslibre/9', type: 'cafe', libelle: 'Café', lat: PROCHE, metres: 111, sources: ['Acceslibre'] })
    expect(fusionner([osm], [acceslibre])[0]).toMatchObject({ type: 'resto', libelle: 'Restaurant', lat: 48.8566, metres: 100 })
  })

  it('deux fiches Acceslibre du même lieu : celle qui sait l’emporte, pas la plus longue', () => {
    // « BENOIT » ne dit rien de l’entrée, « Benoit Paris » dit « entrée sans marche »
    const muette = lieu({
      id: 'acceslibre/1', nom: 'BENOIT', sources: ['Acceslibre'], acces: { entree: 'inconnue', toilettes: 'oui' },
      lignes: [{ theme: 'Entrée', reponse: 'attention', texte: 'Entrée : on ne sait pas' }, { theme: 'Toilettes', reponse: 'oui', texte: 'Toilettes adaptées' }, { theme: 'Accueil', reponse: 'oui', texte: 'Personnel formé au handicap' }],
    })
    const sait = lieu({
      id: 'acceslibre/2', nom: 'Benoit Paris', sources: ['Acceslibre'], acces: { entree: 'ok', toilettes: 'inconnues' },
      lignes: [{ theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' }, { theme: 'Toilettes', reponse: 'attention', texte: 'Toilettes : on ne sait pas' }],
    })
    const [reuni, ...reste] = fusionner([], [muette, sait])
    expect(reste).toHaveLength(0)
    expect(reuni.etat).toBe('ok')
    expect(reuni.lignes.map(l => l.texte)).toEqual(['Entrée sans marche', 'Toilettes adaptées', 'Personnel formé au handicap'])
  })

  it('deux fiches Acceslibre qui se contredisent : on le dit', () => {
    const sansMarche = lieu({ id: 'acceslibre/1', nom: 'Le Bûcheron', sources: ['Acceslibre'], acces: { entree: 'ok', toilettes: 'inconnues' }, lignes: [{ theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' }] })
    const marches = lieu({ id: 'acceslibre/2', nom: 'Le Bucheron', sources: ['Acceslibre'], acces: { entree: 'non', toilettes: 'inconnues' }, lignes: [{ theme: 'Entrée', reponse: 'non', texte: '3 marches à l’entrée' }] })
    const [reuni] = fusionner([], [sansMarche, marches])
    expect(reuni.etat).toBe('verifier')
    expect(reuni.lignes[0].detail).toMatch(/^Une fiche Acceslibre : .* · une autre : /)
  })

  it('le désaccord entre deux fiches Acceslibre reste dit après la fusion avec OSM', () => {
    const sansMarche = lieu({ id: 'acceslibre/1', nom: 'Le Bûcheron', sources: ['Acceslibre'], acces: { entree: 'ok', toilettes: 'inconnues' }, lignes: [{ theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' }] })
    const marches = lieu({ id: 'acceslibre/2', nom: 'Le Bucheron', sources: ['Acceslibre'], acces: { entree: 'non', toilettes: 'inconnues' }, lignes: [{ theme: 'Entrée', reponse: 'non', texte: '3 marches à l’entrée' }] })
    const osm = lieu({ nom: 'Le Bûcheron', acces: { entree: 'ok', toilettes: 'inconnues' }, lignes: [{ theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' }] })
    const [reuni] = fusionner([osm], [sansMarche, marches])
    expect(reuni.etat).toBe('verifier')
    expect(reuni.conseil).toBe('Les infos ne sont pas d’accord : à vérifier sur place.')
  })

  it('deux fiches Acceslibre du même lieu n’en font qu’une, la plus complète', () => {
    const courte = lieu({ id: 'acceslibre/1', nom: 'Eataly', sources: ['Acceslibre'] })
    const complete = lieu({ id: 'acceslibre/2', nom: 'EATALY PARIS MARAIS', sources: ['Acceslibre'], lignes: [{ theme: 'Entrée', reponse: 'oui', texte: 'Entrée sans marche' }] })
    expect(fusionner([], [courte, complete]).map(l => l.id)).toEqual(['acceslibre/2'])
  })

  it('ne réunit jamais une place handicapée avec un café qui s’appelle « La Place »', () => {
    const place = lieu({ id: 'node/2', type: 'parking', nom: 'Place handicapée', etat: 'parking' })
    const cafe = lieu({ id: 'acceslibre/9', nom: 'La Place Handicapée', lat: PROCHE, sources: ['Acceslibre'] })
    expect(fusionner([place], [cafe]).map(l => l.id).sort()).toEqual(['acceslibre/9', 'node/2'])
  })

  it('ajoute les lieux qu’Acceslibre est seul à connaître', () => {
    const acceslibre = lieu({ id: 'acceslibre/9', nom: 'Le Bistrot', type: 'resto', lat: LOIN, sources: ['Acceslibre'] })
    expect(fusionner([lieu({})], [acceslibre])).toHaveLength(2)
  })
})

describe('trier', () => {
  it('met les plus faciles d’abord, puis les difficiles et les sans info mêlés, par distance', () => {
    const ordre = trier([
      lieu({ id: 'e', etat: 'inconnu', metres: 7 }),
      lieu({ id: 'd', etat: 'non', metres: 5 }),
      lieu({ id: 'a', etat: 'verifier', metres: 10 }),
      lieu({ id: 'b', etat: 'ok', metres: 200 }),
      lieu({ id: 'c', etat: 'parking', metres: 50 }),
    ]).map(l => l.id)
    expect(ordre).toEqual(['c', 'b', 'a', 'd', 'e'])
  })
})
