import { test as base, expect, type Page, type Request } from '@playwright/test'
import { mockNetwork } from './network'

type Fixtures = {
  /** les envois faits au serveur de test OpenStreetMap (jamais à la vraie carte) */
  osmRequests: Request[]
  /** ouvre l'appli en mode démo (données OSM enregistrées du centre de Paris) et attend les lieux */
  open: (address?: string) => Promise<void>
}

/** Le `test` de Playwright, avec le réseau toujours simulé. */
export const test = base.extend<Fixtures>({
  osmRequests: async ({ page }, provide) => {
    const { osmRequests } = await mockNetwork(page)
    await provide(osmRequests)
  },
  open: async ({ page, osmRequests }, provide) => {
    void osmRequests // le réseau est simulé avant d'ouvrir la page
    await provide(async (address = '/?demo') => {
      await page.goto(address)
      await expect(page.getByRole('heading', { name: 'Les plus faciles d’abord' })).toBeVisible()
    })
  },
})

export { expect }

/** Une pastille de la carte, par ce qu'en dit un lecteur d'écran (« Marlette, attention »). */
export const pin = (page: Page, name: string) => page.getByRole('button', { name: name, exact: true })

/** La fiche ouverte d'un lieu. */
export const card = (page: Page) => page.getByRole('dialog').filter({ has: page.locator('#place-card-title') })
