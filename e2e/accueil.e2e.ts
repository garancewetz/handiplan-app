import { expect, pastille, test } from './support/test'

test.describe('Accueil : choisir un café ou un restaurant autour de soi', () => {
  test.beforeEach(async ({ ouvrir }) => { await ouvrir() })

  test('la légende dit chaque couleur avec un mot', async ({ page }) => {
    const legende = page.getByRole('list', { name: 'Les couleurs de la carte' })
    // Chaque entrée : un symbole (caché aux lecteurs d'écran), puis le mot.
    await expect(legende.getByRole('listitem')).toHaveText([/Facile$/, /Attention$/, /Difficile$/, /Pas d’info$/, /Place handicapée$/])
  })

  test('chaque pastille de la carte dit son nom et son état', async ({ page }) => {
    await expect(pastille(page, 'Marlette, attention')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Carte des lieux' }).getByRole('button', { name: /, facile$/ }).first()).toBeAttached()
  })

  test('la liste met les plus faciles d’abord', async ({ page }) => {
    const premiere = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('button') }).first()
    await expect(premiere).toContainText('Facile')
  })

  test('« Se garer » ne montre que les places, de la plus proche à la plus loin', async ({ page }) => {
    const filtres = page.getByRole('group', { name: 'Montrer' })
    await expect(filtres.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')
    await filtres.getByRole('button', { name: 'Se garer' }).click()
    await expect(filtres.getByRole('button', { name: 'Se garer' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: 'Les plus proches' })).toBeVisible()
    const lignes = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('button') })
    await expect(lignes.first()).toContainText('Place handicapée')
    for (const ligne of await lignes.all()) await expect(ligne).toContainText('Place handicapée')
  })

  test('« Où aller » cache les places', async ({ page }) => {
    await page.getByRole('group', { name: 'Montrer' }).getByRole('button', { name: 'Où aller' }).click()
    const lignes = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('button') })
    await expect(lignes.first()).toBeVisible()
    await expect(lignes.filter({ hasText: 'Place handicapée' })).toHaveCount(0)
  })

  test('« D’où viennent les infos » s’ouvre et se referme', async ({ page }) => {
    await page.getByRole('button', { name: 'D’où viennent les infos ?' }).click()
    const sources = page.getByRole('dialog', { name: 'D’où viennent les infos' })
    await expect(sources.getByRole('heading', { name: 'Les couleurs' })).toBeVisible()
    await expect(sources).toContainText('Rouge, difficile')
    await sources.getByRole('button', { name: 'Fermer' }).click()
    await expect(sources).toBeHidden()
  })

  test('la carte montre ce qui est dans son cadre : éloigner fait apparaître les lieux plus loin', async ({ page }) => {
    const carte = page.getByRole('region', { name: 'Carte des lieux' })
    const pastilles = carte.getByRole('button', { name: /, (facile|attention|difficile|pas d’info)$/ })
    await expect(pastilles.first()).toBeVisible()
    const avant = await pastilles.count()
    await carte.getByRole('button', { name: 'Éloigner' }).click()
    await expect.poll(() => pastilles.count()).toBeGreaterThan(avant)
  })

  test('après les plus faciles, difficiles et sans info sont mêlés, du plus proche au plus loin', async ({ page }) => {
    const titre = page.getByRole('heading', { name: 'Difficiles ou sans info, par distance' })
    const plus = page.getByRole('button', { name: 'Voir plus de lieux' })
    // La liste se montre par pages : on va jusqu'au bout.
    while (await plus.isVisible()) await plus.click()
    await expect(titre).toBeVisible()
    const metres = await page.getByRole('main').getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: /(Difficile|Pas d’info)$/ }) })
      .evaluateAll(lignes => lignes.map(l => Number(/à ([\d\s]+) m/.exec(l.textContent ?? '')?.[1]?.replace(/\s/g, ''))))
    // Les données de démo n'en ont qu'un ici ; l'ordre avec plusieurs est vérifié par trier() (fusion-lieux.utils.test.ts).
    expect(metres.length).toBeGreaterThan(0)
    expect(metres).toEqual([...metres].sort((a, b) => a - b))
  })
})

