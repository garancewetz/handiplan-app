import { describe, expect, it } from 'vitest'
import { pinHtml, pinName } from '~/features/map/utils/pin.utils'
import type { Place } from '~/types/place.types'

const place = (name: string, state: Place['state'], type: Place['type'] = 'cafe'): Place => ({
  id: name, type, state, name, label: 'Café', lat: 48.85, lon: 2.35, metres: 100, lines: [], sources: ['OpenStreetMap'],
})

describe('pinName', () => {
  it('donne le nom puis l’état, pour un lecteur d’écran', () => {
    expect(pinName(place('Marlette', 'check'))).toBe('Marlette, attention')
  })

  it('ne répète pas « Place handicapée »', () => {
    expect(pinName(place('Place handicapée', 'parking', 'parking'))).toBe('Place handicapée')
  })
})

describe('pinHtml', () => {
  it('met le symbole de l’état dans un coin, sauf pour une place', () => {
    expect(pinHtml(place('Marlette', 'no'), false)).toContain('<span class="state">✕</span>')
    expect(pinHtml(place('Place handicapée', 'parking', 'parking'), false)).not.toContain('class="state"')
  })
})

describe('pinHtml, pour un lecteur d’écran', () => {
  it('cache le dessin et le symbole : la pastille garde son nom (« Marlette, attention »)', () => {
    expect(pinHtml(place('Marlette', 'check'), false)).toMatch(/^<div class="marker check" aria-hidden="true">/)
  })
})
