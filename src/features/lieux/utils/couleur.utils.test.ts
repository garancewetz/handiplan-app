import { describe, expect, it } from 'vitest'
import { couleur } from '~/features/lieux/utils/couleur.utils'

describe('couleur', () => {
  it('vert seulement quand tout est bon', () => {
    expect(couleur('ok', 'oui')).toBe('ok')
  })

  it('orange dès qu’une partie seulement est bonne ou connue', () => {
    expect(couleur('ok', 'non')).toBe('verifier')
    expect(couleur('ok', 'inconnues')).toBe('verifier')
    expect(couleur('partielle', 'oui')).toBe('verifier')
    expect(couleur('non', 'oui')).toBe('verifier')
    expect(couleur('inconnue', 'oui')).toBe('verifier')
  })

  it('gris quand rien n’est accessible', () => {
    expect(couleur('non', 'non')).toBe('non')
    expect(couleur('non', 'inconnues')).toBe('non')
  })

  it('pointillé quand on ne sait rien', () => {
    expect(couleur('inconnue', 'inconnues')).toBe('inconnu')
  })
})
