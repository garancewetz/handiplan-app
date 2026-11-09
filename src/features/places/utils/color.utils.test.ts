import { describe, expect, it } from 'vitest'
import { color } from '~/features/places/utils/color.utils'

describe('color', () => {
  it('vert seulement quand tout est bon', () => {
    expect(color('ok', 'yes')).toBe('ok')
  })

  it('orange dès qu’une partie seulement est bonne ou connue', () => {
    expect(color('ok', 'no')).toBe('check')
    expect(color('ok', 'unknown')).toBe('check')
    expect(color('partial', 'yes')).toBe('check')
    expect(color('no', 'yes')).toBe('check')
    expect(color('unknown', 'yes')).toBe('check')
  })

  it('gris quand rien n’est accessible', () => {
    expect(color('no', 'no')).toBe('no')
    expect(color('no', 'unknown')).toBe('no')
  })

  it('pointillé quand on ne sait rien', () => {
    expect(color('unknown', 'unknown')).toBe('unknown')
  })
})
