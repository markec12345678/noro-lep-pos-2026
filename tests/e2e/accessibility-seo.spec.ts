import { test, expect } from '@playwright/test'

/**
 * ACCESSIBILITY & SEO TESTS
 * - Skip-to-content link
 * - ARIA labels
 * - Focus management
 * - JSON-LD structured data
 * - Sitemap & robots.txt
 */

test.describe('Accessibility', () => {
  test('skip-to-content link obstaja in deluje', async ({ page }) => {
    await page.goto('/')

    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeAttached()

    // Focus ga naredi vidnim
    await skipLink.focus()
    await expect(skipLink).toBeVisible()
  })

  test('navigacija ima ARIA label', async ({ page }) => {
    await page.goto('/')

    const nav = page.locator('nav[aria-label="Glavna navigacija"]')
    await expect(nav).toBeVisible()
  })

  test('logo link ima aria-label', async ({ page }) => {
    await page.goto('/')

    const logo = page.locator('a[aria-label="Noro Lep POS — domov"]')
    await expect(logo).toBeVisible()
  })

  test('html ima pravilen lang attribute', async ({ page }) => {
    await page.goto('/')
    const lang = await page.getAttribute('html', 'lang')
    expect(lang).toBe('sl-SI')
  })

  test('mobile menu button ima aria-label in aria-expanded', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForTimeout(1000)

    // Na začetku je "Odpri meni" in expanded=false
    const openBtn = page.locator('button[aria-label="Odpri meni"]').first()
    await expect(openBtn).toBeVisible()
    expect(await openBtn.getAttribute('aria-expanded')).toBe('false')

    // Po kliku se label spremeni v "Zapri meni" in expanded=true
    await openBtn.click()
    await page.waitForTimeout(500)

    const closeBtn = page.locator('button[aria-label="Zapri meni"]').first()
    await expect(closeBtn).toBeVisible()
    expect(await closeBtn.getAttribute('aria-expanded')).toBe('true')
  })

  test('vse slike imajo alt tekst', async ({ page }) => {
    await page.goto('/')

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).not.toBeNull()
      expect(alt!.length).toBeGreaterThan(0)
    }
  })
})

test.describe('SEO', () => {
  test('JSON-LD structured data je prisoten', async ({ page }) => {
    await page.goto('/')

    const jsonLd = page.locator('script[type="application/ld+json"]')
    await expect(jsonLd).toBeAttached()

    const content = await jsonLd.textContent()
    expect(content).toContain('Organization')
    expect(content).toContain('SoftwareApplication')
    expect(content).toContain('aggregateRating')
    expect(content).toContain('FAQPage')
  })

  test('title tag je pravilen', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title).toContain('Noro Lep POS')
  })

  test('meta description je prisoten', async ({ page }) => {
    await page.goto('/')
    const desc = await page.getAttribute('meta[name="description"]', 'content')
    expect(desc).not.toBeNull()
    expect(desc!).toContain('POS')
    expect(desc!).toContain('FURS')
  })

  test('manifest.json je referenciran', async ({ page }) => {
    await page.goto('/')
    const manifest = await page.getAttribute('link[rel="manifest"]', 'href')
    expect(manifest).toBe('/manifest.json')
  })

  test('robots.txt je dostopen', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)

    const content = await page.textContent('body')
    expect(content).toContain('User-agent')
    expect(content).toContain('Sitemap')
  })

  test('sitemap.xml je dostopen', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)

    const body = await response.text()
    expect(body).toContain('<?xml')
    expect(body).toContain('<urlset')
    expect(body).toContain('chat.z.ai')
  })

  test('canonical link je prisoten', async ({ page }) => {
    await page.goto('/')
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    expect(canonical).not.toBeNull()
  })
})

test.describe('Trust & Security', () => {
  test('TrustBar certifikati so prikazani', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // TrustBar certifikati (uporabi .first() ker se nekateri pojavijo tudi drugje)
    await expect(page.locator('text=FURS ZDavPR').first()).toBeVisible()
    await expect(page.locator('text=ISO 27001')).toBeVisible()
    await expect(page.locator('text=PCI DSS')).toBeVisible()
    await expect(page.locator('text=AI Certified')).toBeVisible()
  })

  test('scroll progress bar je prisoten', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)

    // Scroll progress bar je fixed na vrhu
    const progressBar = page.locator('.fixed.top-0.left-0.right-0.h-1')
    await expect(progressBar).toBeAttached()
  })

  test('back-to-top se pojavi po scroll-u', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)

    // Na začetku ni viden
    const backToTop = page.locator('button[aria-label="Nazaj na vrh"]')
    await expect(backToTop).not.toBeVisible()

    // Scroll dol
    await page.evaluate(() => window.scrollTo(0, 800))
    await page.waitForTimeout(1000)

    // Sedaj je viden
    await expect(backToTop).toBeVisible()
  })
})
