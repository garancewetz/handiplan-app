import { signInOsm } from './support/network'
import { expect, card, pin, test } from './support/test'

test.describe('Compléter la carte, sur le serveur de test OSM', () => {
  test('sans compte, on propose de se connecter', async ({ page, open }) => {
    await open()
    await pin(page, 'Marlette, attention').click()
    await card(page).getByRole('button', { name: 'Modifier ou compléter' }).click()
    await expect(page.getByRole('button', { name: 'Se connecter à OpenStreetMap' })).toBeVisible()
  })

  test('deux questions, un résumé, puis l’envoi au serveur de test avec les bonnes étiquettes', async ({ page, open, osmRequests }) => {
    await signInOsm(page)
    await open()
    await pin(page, 'Marlette, attention').click()
    await card(page).getByRole('button', { name: 'Modifier ou compléter' }).click()
    await page.getByRole('button', { name: 'Répondre aux questions' }).click()

    await expect(page.getByRole('heading', { name: 'Y a-t-il des marches ?' })).toBeVisible()
    await page.getByRole('button', { name: /Une petite marche/ }).click()
    await expect(page.getByRole('heading', { name: 'Les toilettes sont-elles adaptées ?' })).toBeVisible()
    await page.getByRole('button', { name: 'Oui', exact: true }).click()

    await expect(page.getByText('Vous confirmez : une petite marche')).toBeVisible()
    await expect(page.getByText('Nouveau : adaptées')).toBeVisible()
    await expect(page.getByText(/Signé compte_essai/)).toContainText('serveur de test')
    await page.getByRole('button', { name: 'Oui, modifier' }).click()
    await expect(page.getByText('C’est fait, merci !')).toBeVisible()

    const [creation, sending] = osmRequests.map(r => r.postData() ?? '')
    expect(creation).toContain('<tag k="created_by" v="Handiplan 0.1"/>')
    expect(creation).toContain('<tag k="hashtags" v="#handiplan"/>')
    expect(creation).toContain('<tag k="source" v="survey"/>')
    expect(sending).toContain('<tag k="wheelchair" v="limited"/>')
    expect(sending).toContain('<tag k="toilets:wheelchair" v="yes"/>')
    expect(sending).toMatch(/<tag k="check_date:toilets:wheelchair" v="\d{4}-\d{2}-\d{2}"\/>/)
    expect(osmRequests.every(r => r.url().startsWith('https://master.apis.dev.openstreetmap.org/'))).toBe(true)
  })

  test('« pas de toilettes » pose toilets=no, sans juger des toilettes qui n’existent pas', async ({ page, open, osmRequests }) => {
    await signInOsm(page)
    await open()
    await pin(page, 'Marlette, attention').click()
    await card(page).getByRole('button', { name: 'Modifier ou compléter' }).click()
    await page.getByRole('button', { name: 'Répondre aux questions' }).click()
    await page.getByRole('button', { name: 'Je ne sais pas, passer' }).click()
    await page.getByRole('button', { name: 'Il n’y a pas de toilettes' }).click()

    await expect(page.getByText('Nouveau : pas de toilettes')).toBeVisible()
    await page.getByRole('button', { name: 'Oui, modifier' }).click()
    await expect(page.getByText('C’est fait, merci !')).toBeVisible()
    const sending = osmRequests.map(r => r.postData() ?? '').join('')
    expect(sending).toContain('<tag k="toilets" v="no"/>')
    expect(sending).not.toContain('<tag k="toilets:wheelchair" v="no"/>')
  })

  test('ajouter une place handicapée, après vérification de l’endroit', async ({ page, open, osmRequests }) => {
    await signInOsm(page)
    await open()
    await page.getByRole('button', { name: 'Ajouter une place handicapée' }).click()
    await expect(page.getByText(/Adresse la plus proche/)).toBeVisible()
    await page.getByRole('button', { name: 'C’est ici' }).click()
    await page.getByRole('button', { name: 'Oui, ajouter' }).click()
    await expect(page.getByText(/C’est fait, merci/)).toBeVisible()
    const sending = osmRequests.map(r => r.postData() ?? '').join('')
    expect(sending).toContain('<tag k="amenity" v="parking_space"/>')
    expect(sending).toContain('<tag k="parking_space" v="disabled"/>')
  })
})
