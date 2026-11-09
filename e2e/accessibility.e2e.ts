import { expect, card, pin, test } from './support/test'

test.describe('Accessibilité', () => {
  test.beforeEach(async ({ open }) => { await open() })

  test('la page est en français, avec un titre principal', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Handiplan/)
  })

  test('chaque bouton a un nom, même ceux qui ne montrent qu’une icône', async ({ page }) => {
    const nameless = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('button, [role="button"]')]
      .filter(b => b.offsetParent !== null && !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title'))
      .map(b => b.outerHTML.slice(0, 80)))
    expect(nameless).toEqual([])
  })

  test('les textes affichés font au moins 18 px (sauf les crédits de la carte)', async ({ page }) => {
    const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(e => e.offsetParent !== null && !e.closest('[aria-hidden="true"], .sr-only, .leaflet-control-attribution, .leaflet-marker-icon'))
      .filter(e => [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()))
      .filter(e => parseFloat(getComputedStyle(e).fontSize) < 18)
      .map(e => `${e.textContent?.trim().slice(0, 30)} (${getComputedStyle(e).fontSize})`))
    expect(small).toEqual([])
  })

  test('le contour du clavier est visible', async ({ page }) => {
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement
      const s = getComputedStyle(e)
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    expect(outline.style).not.toBe('none')
    expect(outline.width).toBeGreaterThanOrEqual(2)
  })

  test('une pastille s’ouvre au clavier, et reprend le focus quand la fiche se ferme', async ({ page }) => {
    const marlette = pin(page, 'Marlette, attention')
    await marlette.focus()
    await page.keyboard.press('Enter')
    await expect(card(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(card(page)).toBeHidden()
    await expect(marlette).toBeFocused()
  })

  test('« réduire les animations » est respecté', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Les plus faciles d’abord' })).toBeVisible()
    const duration = await page.evaluate(() => getComputedStyle(document.querySelector('[aria-labelledby="place-card-title"]')!).transitionDuration)
    expect(duration.split(',').every(d => parseFloat(d) <= 0.01)).toBe(true)
  })

  test('Espace ouvre aussi une pastille, comme tout bouton', async ({ page }) => {
    await pin(page, 'Marlette, attention').focus()
    await page.keyboard.press(' ')
    await expect(card(page)).toBeVisible()
  })
})
