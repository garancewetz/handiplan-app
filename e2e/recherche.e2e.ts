import { expect, fiche, test } from './support/test'

const panneau = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: 'Où allez-vous ?' })

test.describe('Recherche : une feuille qui monte du bas', () => {
  test.beforeEach(async ({ ouvrir }) => { await ouvrir() })

  test('au premier usage, une phrase dit quoi écrire, et le clavier est prêt', async ({ page }) => {
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    await expect(panneau(page)).toContainText('Écrivez une adresse ou le nom d’un lieu')
    await expect(panneau(page).getByRole('textbox', { name: 'Où allez-vous ?' })).toBeFocused()
    // Le reste de l'appli est inerte derrière : ni le clavier ni un lecteur d'écran ne s'y égarent.
    await expect(page.locator('#root')).toHaveJSProperty('inert', true)
  })

  test('un lieu tapé par son nom rouvre sa fiche, puis revient dans « Récemment »', async ({ page }) => {
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    await panneau(page).getByRole('textbox').fill('marl')
    await panneau(page).getByRole('button', { name: /Marlette/ }).click()
    await expect(fiche(page).getByRole('heading', { name: 'Marlette' })).toBeVisible()
    await fiche(page).getByRole('button', { name: 'Fermer' }).click()

    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    const recemment = panneau(page).getByRole('region', { name: 'Récemment' })
    await expect(recemment.getByRole('button', { name: /Marlette/ })).toBeVisible()
    await expect(recemment).toContainText('Café')
  })

  test('Échap et la flèche retour referment, et le focus revient sur la barre', async ({ page }) => {
    const barre = page.getByRole('button', { name: 'Où allez-vous ?' })
    await barre.click()
    await page.keyboard.press('Escape')
    await expect(panneau(page)).toBeHidden()
    await expect(barre).toBeFocused()
    await expect(page.locator('#root')).toHaveJSProperty('inert', false)

    await barre.click()
    await panneau(page).getByRole('button', { name: 'Retour' }).click()
    await expect(panneau(page)).toBeHidden()
  })

  test('toucher la carte grisée referme aussi', async ({ page }) => {
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    await expect(panneau(page)).toBeVisible()
    await page.mouse.click(180, 60)
    await expect(panneau(page)).toBeHidden()
  })
})
