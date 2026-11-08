import { describe, expect, it } from 'vitest'
import { formaterDistance, formaterDuree } from '~/utils/format.utils'

describe('formaterDistance', () => {
  it('écrit les mètres, puis les kilomètres avec une virgule', () => {
    expect(formaterDistance(66.4)).toBe('66 m')
    expect(formaterDistance(1540)).toBe('1,5 km')
  })
})

describe('formaterDuree', () => {
  it('arrondit à la minute, au moins 1 min, et passe aux heures', () => {
    expect(formaterDuree(20)).toBe('1 min')
    expect(formaterDuree(235)).toBe('4 min')
    expect(formaterDuree(3900)).toBe('1 h 05')
  })
})
