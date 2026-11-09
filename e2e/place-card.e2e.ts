import { expect, card, pin, test } from './support/test'

test.describe('Fiche d’un lieu : la réponse d’abord, puis le détail', () => {
  test.beforeEach(async ({ open }) => { await open() })

  test('le verdict dit ce qui gêne, en mots', async ({ page }) => {
    await pin(page, 'Marlette, attention').click()
    await expect(card(page).getByRole('heading', { name: 'Marlette' })).toBeVisible()
    await expect(card(page)).toContainText('Attention')
    await expect(card(page)).toContainText('toilettes : on ne sait pas')
    await expect(card(page)).toContainText('à demander sur place')
  })

  test('les détails disent ce que la carte ne sait pas, sans rien inventer', async ({ page }) => {
    await pin(page, 'Marlette, attention').click()
    await card(page).getByRole('button', { name: 'Voir tous les détails' }).click()
    await expect(card(page)).toContainText('Au 3e étage')
    await expect(card(page)).toContainText('La carte ne dit pas s’il y a un ascenseur')
  })

  test('une main courante est signalée quand il y a des marches (Acceslibre)', async ({ page }) => {
    // Un peu plus loin : on éloigne la carte d'un cran pour voir sa pastille.
    const map = page.getByRole('region', { name: 'Carte des lieux' })
    await map.getByRole('button', { name: 'Éloigner' }).click()
    await map.getByRole('button', { name: /Bistrot à marches/ }).click()
    await expect(card(page)).toContainText('3 marches à l’entrée')
    await expect(card(page)).toContainText('Main courante pour se tenir')
  })

  test('« Fermer » et Échap referment la fiche', async ({ page }) => {
    await pin(page, 'Marlette, attention').click()
    await card(page).getByRole('button', { name: 'Fermer' }).click()
    await expect(card(page)).toBeHidden()
    await pin(page, 'Marlette, attention').click()
    await expect(card(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(card(page)).toBeHidden()
  })

  test('une place handicapée ne se répète pas', async ({ page }) => {
    await page.getByRole('group', { name: 'Montrer' }).getByRole('button', { name: 'Se garer' }).click()
    await page.getByRole('main').getByRole('button', { name: /Place handicapée/ }).first().click()
    await expect(card(page).getByText('Place handicapée', { exact: true })).toHaveCount(1)
  })
})
