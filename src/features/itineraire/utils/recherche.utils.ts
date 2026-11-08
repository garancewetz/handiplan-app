import type { Lieu } from '~/types/lieu.types'

const simplifier = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** « 12 Rue Carnot 93230 Romainville » : la rue en gros, la ville dessous. */
export function decouper(adresse: string): { titre: string; detail?: string } {
  const coupure = adresse.search(/ \d{5} /)
  return coupure > 0 ? { titre: adresse.slice(0, coupure), detail: adresse.slice(coupure + 1) } : { titre: adresse }
}

/** Les lieux déjà chargés dont le nom contient ce qu'on tape (sans accents ni majuscules), trois au plus. */
export function lieuxCorrespondants(lieux: Lieu[], texte: string): Lieu[] {
  const t = simplifier(texte.trim())
  if (t.length < 3) return []
  return lieux.filter(l => l.nom !== l.libelle && simplifier(l.nom).includes(t)).slice(0, 3)
}
