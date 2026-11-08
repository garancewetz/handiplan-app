import { test as base, expect, type Page, type Request } from '@playwright/test'
import { simulerReseau } from './reseau'

type Outils = {
  /** les envois faits au serveur de test OpenStreetMap (jamais à la vraie carte) */
  envoisOsm: Request[]
  /** ouvre l'appli en mode démo (données OSM enregistrées du centre de Paris) et attend les lieux */
  ouvrir: (adresse?: string) => Promise<void>
}

/** Le `test` de Playwright, avec le réseau toujours simulé. */
export const test = base.extend<Outils>({
  envoisOsm: async ({ page }, utiliser) => {
    const { envoisOsm } = await simulerReseau(page)
    await utiliser(envoisOsm)
  },
  ouvrir: async ({ page, envoisOsm }, utiliser) => {
    void envoisOsm // le réseau est simulé avant d'ouvrir la page
    await utiliser(async (adresse = '/?demo') => {
      await page.goto(adresse)
      await expect(page.getByRole('heading', { name: 'Les plus faciles d’abord' })).toBeVisible()
    })
  },
})

export { expect }

/** Une pastille de la carte, par ce qu'en dit un lecteur d'écran (« Marlette, attention »). */
export const pastille = (page: Page, nom: string) => page.getByRole('button', { name: nom, exact: true })

/** La fiche ouverte d'un lieu. */
export const fiche = (page: Page) => page.getByRole('dialog').filter({ has: page.locator('#fiche-titre') })
