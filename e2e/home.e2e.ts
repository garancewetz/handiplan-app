import { expect, pin, test } from './support/test'

test.describe('Accueil : choisir un café ou un restaurant autour de soi', () => {
  test.beforeEach(async ({ open }) => { await open() })

  test('la légende dit chaque couleur avec un mot', async ({ page }) => {
    const legend = page.getByRole('list', { name: 'Les couleurs de la carte' })
    // Chaque entrée : un symbole (caché aux lecteurs d'écran), puis le mot.
    await expect(legend.getByRole('listitem')).toHaveText([/Facile$/, /Attention$/, /Difficile$/, /Pas d’info$/, /Place handicapée$/])
  })

  test('chaque pastille de la carte dit son nom et son état', async ({ page }) => {
    await expect(pin(page, 'Marlette, attention')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Carte des lieux' }).getByRole('button', { name: /, facile$/ }).first()).toBeAttached()
  })

  test('la liste met les plus faciles d’abord', async ({ page }) => {
    const firstOne = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('button') }).first()
    await expect(firstOne).toContainText('Facile')
  })

  test('« Se garer » ne montre que les places, de la plus proche à la plus loin', async ({ page }) => {
    const filters = page.getByRole('group', { name: 'Montrer' })
    await expect(filters.getByRole('button', { name: 'Tout' })).toHaveAttribute('aria-pressed', 'true')
    await filters.getByRole('button', { name: 'Se garer' }).click()
    await expect(filters.getByRole('button', { name: 'Se garer' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: 'Les plus proches' })).toBeVisible()
    const lines = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('button') })
    await expect(lines.first()).toContainText('Place handicapée')
    for (const line of await lines.all()) await expect(line).toContainText('Place handicapée')
  })

  test('« Où aller » cache les places', async ({ page }) => {
    await page.getByRole('group', { name: 'Montrer' }).getByRole('button', { name: 'Où aller' }).click()
    const lines = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('button') })
    await expect(lines.first()).toBeVisible()
    await expect(lines.filter({ hasText: 'Place handicapée' })).toHaveCount(0)
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
    const map = page.getByRole('region', { name: 'Carte des lieux' })
    const pins = map.getByRole('button', { name: /, (facile|attention|difficile|pas d’info)$/ })
    await expect(pins.first()).toBeVisible()
    const before = await pins.count()
    await map.getByRole('button', { name: 'Éloigner' }).click()
    await expect.poll(() => pins.count()).toBeGreaterThan(before)
  })

  test('après les plus faciles, difficiles et sans info sont mêlés, du plus proche au plus loin', async ({ page }) => {
    const title = page.getByRole('heading', { name: 'Difficiles ou sans info, par distance' })
    const more = page.getByRole('button', { name: 'Voir plus de lieux' })
    // La liste se montre par pages : on va jusqu'au bout.
    while (await more.isVisible()) await more.click()
    await expect(title).toBeVisible()
    const metres = await page.getByRole('main').getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: /(Difficile|Pas d’info)$/ }) })
      .evaluateAll(lines => lines.map(l => Number(/à ([\d\s]+) m/.exec(l.textContent ?? '')?.[1]?.replace(/\s/g, ''))))
    // Les données de démo n'en ont qu'un ici ; l'ordre avec plusieurs est vérifié par trier() (fusion-lieux.utils.test.ts).
    expect(metres.length).toBeGreaterThan(0)
    expect(metres).toEqual([...metres].sort((a, b) => a - b))
  })
})

