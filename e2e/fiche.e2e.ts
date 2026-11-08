import { expect, fiche, pastille, test } from './support/test'

test.describe('Fiche d’un lieu : la réponse d’abord, puis le détail', () => {
  test.beforeEach(async ({ ouvrir }) => { await ouvrir() })

  test('le verdict dit ce qui gêne, en mots', async ({ page }) => {
    await pastille(page, 'Marlette, attention').click()
    await expect(fiche(page).getByRole('heading', { name: 'Marlette' })).toBeVisible()
    await expect(fiche(page)).toContainText('Attention')
    await expect(fiche(page)).toContainText('toilettes : on ne sait pas')
    await expect(fiche(page)).toContainText('à demander sur place')
  })

  test('les détails disent ce que la carte ne sait pas, sans rien inventer', async ({ page }) => {
    await pastille(page, 'Marlette, attention').click()
    await fiche(page).getByRole('button', { name: 'Voir tous les détails' }).click()
    await expect(fiche(page)).toContainText('Au 3e étage')
    await expect(fiche(page)).toContainText('La carte ne dit pas s’il y a un ascenseur')
  })

  test('une main courante est signalée quand il y a des marches (Acceslibre)', async ({ page }) => {
    // Un peu plus loin : on éloigne la carte d'un cran pour voir sa pastille.
    const carte = page.getByRole('region', { name: 'Carte des lieux' })
    await carte.getByRole('button', { name: 'Éloigner' }).click()
    await carte.getByRole('button', { name: /Bistrot à marches/ }).click()
    await expect(fiche(page)).toContainText('3 marches à l’entrée')
    await expect(fiche(page)).toContainText('Main courante pour se tenir')
  })

  test('« Fermer » et Échap referment la fiche', async ({ page }) => {
    await pastille(page, 'Marlette, attention').click()
    await fiche(page).getByRole('button', { name: 'Fermer' }).click()
    await expect(fiche(page)).toBeHidden()
    await pastille(page, 'Marlette, attention').click()
    await expect(fiche(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(fiche(page)).toBeHidden()
  })

  test('une place handicapée ne se répète pas', async ({ page }) => {
    await page.getByRole('group', { name: 'Montrer' }).getByRole('button', { name: 'Se garer' }).click()
    await page.getByRole('main').getByRole('button', { name: /Place handicapée/ }).first().click()
    await expect(fiche(page).getByText('Place handicapée', { exact: true })).toHaveCount(1)
  })
})
