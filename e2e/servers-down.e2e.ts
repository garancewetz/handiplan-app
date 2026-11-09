import { expect, test } from './support/test'

test.describe('Quand OpenStreetMap ne répond pas', () => {
  test('l’appli dit ce qui manque, montre quand même Acceslibre, et propose de réessayer', async ({ page, osmRequests }) => {
    void osmRequests // réseau simulé : tous les serveurs Overpass répondent 504
    await page.goto('/')
    const alert = page.getByRole('alert')
    await expect(alert).toContainText('OpenStreetMap ne répond pas : il manque des cafés, des restos et les places handicapées.', { timeout: 20000 })
    await expect(alert.getByRole('button', { name: 'Réessayer' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('button', { name: /Café des essais/ })).toBeVisible()
  })

  test('le serveur d’OpenStreetMap France est demandé en premier', async ({ page, osmRequests }) => {
    void osmRequests
    const requests: string[] = []
    page.on('request', r => { if (r.url().includes('interpreter')) requests.push(new URL(r.url()).host) })
    await page.goto('/')
    await expect.poll(() => requests[0], { timeout: 20000 }).toBe('overpass.openstreetmap.fr')
  })
})
