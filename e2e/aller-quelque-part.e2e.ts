import { retenirOuvertures } from './support/reseau'
import { expect, fiche, test } from './support/test'

test.describe('Aller quelque part : voir le quartier, puis se garer', () => {
  test('après une adresse, on voit les cafés et les places de là-bas', async ({ page, ouvrir }) => {
    await ouvrir()
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    const panneau = page.getByRole('dialog', { name: 'Où allez-vous ?' })
    await panneau.getByRole('textbox').fill('rue des rosiers')
    await panneau.getByRole('button', { name: /20 Rue des Rosiers/ }).click()

    await expect(page.getByRole('navigation').getByText('20 Rue des Rosiers 75004 Paris')).toBeVisible()
    await expect(page.getByRole('group', { name: 'Montrer' }).getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('group', { name: 'Montrer' }).getByRole('button', { name: 'Se garer' }).click()
    await expect(page.getByRole('heading', { name: 'Les plus proches de l’arrivée' })).toBeVisible()
  })

  test('la première fois, on choisit son appli ; ensuite, « Me garer ici » l’ouvre directement', async ({ page, ouvrir }) => {
    const ouvertures = await retenirOuvertures(page)
    await ouvrir()
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    const panneau = page.getByRole('dialog', { name: 'Où allez-vous ?' })
    await panneau.getByRole('textbox').fill('rue des rosiers')
    await panneau.getByRole('button', { name: /20 Rue des Rosiers/ }).click()
    await page.getByRole('group', { name: 'Montrer' }).getByRole('button', { name: 'Se garer' }).click()

    const premierePlace = page.getByRole('main').getByRole('button', { name: /Place handicapée/ }).first()
    await premierePlace.click()
    await fiche(page).getByRole('button', { name: 'Me garer ici' }).click()
    await page.getByRole('button', { name: 'Ouvrir le GPS' }).click()
    await page.getByRole('button', { name: 'Waze' }).click()
    expect((await ouvertures()).at(-1)).toMatch(/^https:\/\/waze\.com\/ul\?ll=[\d.]+,[\d.]+&navigate=yes$/)

    await premierePlace.click()
    await fiche(page).getByRole('button', { name: 'Me garer ici' }).click()
    expect(await ouvertures()).toHaveLength(2)
  })

  test('la croix annule le trajet et revient autour de soi', async ({ page, ouvrir }) => {
    await ouvrir()
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    const panneau = page.getByRole('dialog', { name: 'Où allez-vous ?' })
    await panneau.getByRole('textbox').fill('rue des rosiers')
    await panneau.getByRole('button', { name: /20 Rue des Rosiers/ }).click()
    await page.getByRole('button', { name: "Annuler l'itinéraire" }).click()
    await expect(page.getByRole('button', { name: 'Où allez-vous ?' })).toBeVisible()
  })
})
