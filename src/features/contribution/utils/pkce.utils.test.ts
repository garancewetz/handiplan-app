import { describe, expect, it } from 'vitest'
import { digest, randomSecret } from '~/features/contribution/utils/pkce.utils'

describe('PKCE', () => {
  it('calcule l’empreinte de l’exemple officiel (RFC 7636)', async () => {
    expect(await digest('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('tire un secret différent à chaque fois, sans caractère interdit dans une adresse', () => {
    const a = randomSecret()
    expect(a).not.toBe(randomSecret())
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })
})
