import { describe, expect, it } from 'vitest'
import { formatDistance, formatDuration } from '~/utils/format.utils'

describe('formaterDistance', () => {
  it('écrit les mètres, puis les kilomètres avec une virgule', () => {
    expect(formatDistance(66.4)).toBe('66 m')
    expect(formatDistance(1540)).toBe('1,5 km')
  })
})

describe('formaterDuree', () => {
  it('arrondit à la minute, au moins 1 min, et passe aux heures', () => {
    expect(formatDuration(20)).toBe('1 min')
    expect(formatDuration(235)).toBe('4 min')
    expect(formatDuration(3900)).toBe('1 h 05')
  })
})
