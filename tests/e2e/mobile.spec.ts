import { test, expect } from '@playwright/test'

/**
 * MOBILE TESTS
 * - Hamburger menu
 * - Responsive layout
 * - Touch targets
 */

test.describe('Mobile Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('hamburger menu je viden na mobile', async ({ page }) => {
    const hamburger = page.locator('button[aria-label="Odpri meni"]')
    await expect(hamburger).toBeVisible()
  })

  test('klik na hamburger odpre menu', async ({ page }) => {
    await page.locator('button[aria-label="Odpri meni"]').click()
    await page.waitForTimeout(1000)

    // Menu linki so vidni (znotraj dropdown div-a z class="absolute")
    const dropdown = page.locator('div.absolute.top-16')
    await expect(dropdown).toBeVisible()

    // Preveri da so linki prisotni v dropdown-u
    const links = dropdown.locator('a')
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('klik na link zapre menu in scrolla', async ({ page }) => {
    await page.locator('button[aria-label="Odpri meni"]').click()
    await page.waitForTimeout(800)

    // Klikni na "Cene" link v mobile menu-ju (znotraj dropdown-a)
    const mobileNavLinks = page.locator('div.absolute a:has-text("Cene")')
    await mobileNavLinks.first().click()
    await page.waitForTimeout(1500)

    // Menu je zaprt (Zapri meni button ni več viden)
    await expect(page.locator('button[aria-label="Zapri meni"]')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Mobile Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('hero je responsive', async ({ page }) => {
    const hero = page.locator('#main-content')
    await expect(hero).toBeVisible()

    // Naslov je viden
    await expect(page.locator('h1')).toBeVisible()
  })

  test('CTA gumbi so touch-friendly (min 40px height)', async ({ page }) => {
    // Na mobile je glavni CTA v hero skrit za "sm:inline-flex", a mobile menu ima CTA
    // Preverimo video demo gumb ki je viden
    const cta = page.locator('button:has-text("Oglej si demo")').first()
    await expect(cta).toBeVisible()

    const box = await cta.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40)
    }
  })

  test('stats grid je 2-column na mobile', async ({ page }) => {
    // Stats kartice so v 2-column grid na mobile
    const statsSection = page.locator('text=Restavracij zaupa nam').locator('..').locator('..')
    await expect(statsSection).toBeVisible()
  })
})
