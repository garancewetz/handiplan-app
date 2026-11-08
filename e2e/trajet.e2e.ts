import { retenirOuvertures } from './support/reseau'
import { expect, fiche, pastille, test } from './support/test'

test.describe('Trajet à pied vers un café', () => {
  test('« Y aller » montre le temps à pied, puis ouvre l’appli de guidage choisie', async ({ page, ouvrir }) => {
    const ouvertures = await retenirOuvertures(page)
    await ouvrir()
    await pastille(page, 'Marlette, attention').click()
    await fiche(page).getByRole('button', { name: 'Y aller' }).click()

    await expect(page.getByText('Vers Marlette')).toBeVisible()
    await expect(page.getByText('À pied : 3 min')).toBeVisible()
    await expect(page.getByText('187 m', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Ouvrir le GPS' }).click()
    // À pied, Waze n'est pas proposé : il ne fait que la voiture.
    await expect(page.getByRole('button', { name: 'Waze' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Google Maps' }).click()
    expect((await ouvertures()).at(-1)).toContain('travelmode=walking')
  })

  test('« Fermer » retire le trajet', async ({ page, ouvrir }) => {
    await ouvrir()
    await pastille(page, 'Marlette, attention').click()
    await fiche(page).getByRole('button', { name: 'Y aller' }).click()
    await expect(page.getByText('Vers Marlette')).toBeVisible()
    await page.getByRole('main').getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByText('Vers Marlette')).toBeHidden()
  })
})
