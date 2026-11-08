import { expect, test } from './support/test'

test.describe('Quand OpenStreetMap ne répond pas', () => {
  test('l’appli dit ce qui manque, montre quand même Acceslibre, et propose de réessayer', async ({ page, envoisOsm }) => {
    void envoisOsm // réseau simulé : tous les serveurs Overpass répondent 504
    await page.goto('/')
    const alerte = page.getByRole('alert')
    await expect(alerte).toContainText('OpenStreetMap ne répond pas : il manque des cafés, des restos et les places handicapées.', { timeout: 20000 })
    await expect(alerte.getByRole('button', { name: 'Réessayer' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: /Café des essais/ })).toBeVisible()
  })

  test('le serveur d’OpenStreetMap France est demandé en premier', async ({ page, envoisOsm }) => {
    void envoisOsm
    const demandes: string[] = []
    page.on('request', r => { if (r.url().includes('interpreter')) demandes.push(new URL(r.url()).host) })
    await page.goto('/')
    await expect.poll(() => demandes[0], { timeout: 20000 }).toBe('overpass.openstreetmap.fr')
  })
})
