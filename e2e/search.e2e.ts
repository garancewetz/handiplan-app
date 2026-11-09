import { expect, card, test } from './support/test'

const panel = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: 'Où allez-vous ?' })

test.describe('Recherche : une feuille qui monte du bas', () => {
  test.beforeEach(async ({ open }) => { await open() })

  test('au premier usage, une phrase dit quoi écrire, et le clavier est prêt', async ({ page }) => {
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    await expect(panel(page)).toContainText('Écrivez une adresse ou le nom d’un lieu')
    await expect(panel(page).getByRole('textbox', { name: 'Où allez-vous ?' })).toBeFocused()
    // Le reste de l'appli est inerte derrière : ni le clavier ni un lecteur d'écran ne s'y égarent.
    await expect(page.locator('#root')).toHaveJSProperty('inert', true)
  })

  test('un lieu tapé par son nom rouvre sa fiche, puis revient dans « Récemment »', async ({ page }) => {
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    await panel(page).getByRole('textbox').fill('marl')
    await panel(page).getByRole('button', { name: /Marlette/ }).click()
    await expect(card(page).getByRole('heading', { name: 'Marlette' })).toBeVisible()
    await card(page).getByRole('button', { name: 'Fermer' }).click()

    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    const recently = panel(page).getByRole('region', { name: 'Récemment' })
    await expect(recently.getByRole('button', { name: /Marlette/ })).toBeVisible()
    await expect(recently).toContainText('Café')
  })

  test('Échap et la flèche retour referment, et le focus revient sur la barre', async ({ page }) => {
    const bar = page.getByRole('button', { name: 'Où allez-vous ?' })
    await bar.click()
    await page.keyboard.press('Escape')
    await expect(panel(page)).toBeHidden()
    await expect(bar).toBeFocused()
    await expect(page.locator('#root')).toHaveJSProperty('inert', false)

    await bar.click()
    await panel(page).getByRole('button', { name: 'Retour' }).click()
    await expect(panel(page)).toBeHidden()
  })

  test('toucher la carte grisée referme aussi', async ({ page }) => {
    await page.getByRole('button', { name: 'Où allez-vous ?' }).click()
    await expect(panel(page)).toBeVisible()
    await page.mouse.click(180, 60)
    await expect(panel(page)).toBeHidden()
  })
})
