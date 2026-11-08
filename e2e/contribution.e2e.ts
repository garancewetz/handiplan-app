import { connecterOsm } from './support/reseau'
import { expect, fiche, pastille, test } from './support/test'

test.describe('Compléter la carte, sur le serveur de test OSM', () => {
  test('sans compte, on propose de se connecter', async ({ page, ouvrir }) => {
    await ouvrir()
    await pastille(page, 'Marlette, attention').click()
    await fiche(page).getByRole('button', { name: 'Modifier ou compléter' }).click()
    await expect(page.getByRole('button', { name: 'Se connecter à OpenStreetMap' })).toBeVisible()
  })

  test('deux questions, un résumé, puis l’envoi au serveur de test avec les bonnes étiquettes', async ({ page, ouvrir, envoisOsm }) => {
    await connecterOsm(page)
    await ouvrir()
    await pastille(page, 'Marlette, attention').click()
    await fiche(page).getByRole('button', { name: 'Modifier ou compléter' }).click()
    await page.getByRole('button', { name: 'Répondre aux questions' }).click()

    await expect(page.getByRole('heading', { name: 'Y a-t-il une marche pour entrer ?' })).toBeVisible()
    await page.getByRole('button', { name: /Une petite marche/ }).click()
    await expect(page.getByRole('heading', { name: 'Les toilettes sont-elles adaptées ?' })).toBeVisible()
    await page.getByRole('button', { name: 'Oui', exact: true }).click()

    await expect(page.getByText('Vous confirmez : une petite marche')).toBeVisible()
    await expect(page.getByText('Nouveau : adaptées')).toBeVisible()
    await expect(page.getByText(/Signé compte_essai/)).toContainText('serveur de test')
    await page.getByRole('button', { name: 'Oui, modifier' }).click()
    await expect(page.getByText('C’est fait, merci !')).toBeVisible()

    const [creation, envoi] = envoisOsm.map(r => r.postData() ?? '')
    expect(creation).toContain('<tag k="created_by" v="Handiplan"/>')
    expect(creation).toContain('<tag k="hashtags" v="#handiplan"/>')
    expect(creation).toContain('<tag k="source" v="survey"/>')
    expect(envoi).toContain('<tag k="wheelchair" v="limited"/>')
    expect(envoi).toContain('<tag k="toilets:wheelchair" v="yes"/>')
    expect(envoi).toMatch(/<tag k="check_date:toilets:wheelchair" v="\d{4}-\d{2}-\d{2}"\/>/)
    expect(envoisOsm.every(r => r.url().startsWith('https://master.apis.dev.openstreetmap.org/'))).toBe(true)
  })

  test('ajouter une place handicapée, après vérification de l’endroit', async ({ page, ouvrir, envoisOsm }) => {
    await connecterOsm(page)
    await ouvrir()
    await page.getByRole('button', { name: 'Ajouter une place handicapée' }).click()
    await expect(page.getByText(/Adresse la plus proche/)).toBeVisible()
    await page.getByRole('button', { name: 'C’est ici' }).click()
    await page.getByRole('button', { name: 'Oui, ajouter' }).click()
    await expect(page.getByText(/C’est fait, merci/)).toBeVisible()
    const envoi = envoisOsm.map(r => r.postData() ?? '').join('')
    expect(envoi).toContain('<tag k="amenity" v="parking_space"/>')
    expect(envoi).toContain('<tag k="parking_space" v="disabled"/>')
  })
})
