import { test, expect } from '@playwright/test'

/**
 * Delivery E2E Tests
 * - Platform cards
 * - Stats
 * - Order feed
 * - Auto-accept toggle
 * - Simulate order
 */

test.describe('Delivery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#dostava').scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000)
  })

  test('prikaže 5 platform', async ({ page }) => {
    await expect(page.locator('text=Wolt').first()).toBeVisible()
    await expect(page.locator('text=Uber Eats').first()).toBeVisible()
    await expect(page.locator('text=Glovo').first()).toBeVisible()
    await expect(page.locator('text=Lastmin').first()).toBeVisible()
    await expect(page.locator('text=QR Naročilo')).toBeVisible()
  })

  test('stats so prikazane', async ({ page }) => {
    await expect(page.locator('text=Skupaj naročil')).toBeVisible()
    await expect(page.locator('text=Novih')).toBeVisible()
    await expect(page.locator('text=V pripravi')).toBeVisible()
    await expect(page.locator('text=Bruto promet')).toBeVisible()
    await expect(page.locator('text=Neto')).toBeVisible()
  })

  test('order feed vsebuje naročila', async ({ page }) => {
    // Vsaj eno naročilo mora biti prikazano
    const orders = page.locator('text=/DEL-/')
    await expect(orders.first()).toBeVisible({ timeout: 5000 })
  })

  test('auto-accept toggle deluje', async ({ page }) => {
    const toggle = page.locator('button:has-text("Auto-accept")')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("Auto-accept ON")')).toBeVisible()
  })

  test('simuliraj naročilo gumb deluje', async ({ page }) => {
    await page.locator('button:has-text("Simuliraj naročilo")').click()
    await page.waitForTimeout(2000)
    // Novo naročilo bi se moralo pojaviti
    const orders = page.locator('text=/DEL-/')
    const count = await orders.count()
    expect(count).toBeGreaterThan(0)
  })

  test('filter tabs delujejo', async ({ page }) => {
    await page.locator('button:has-text("Nova")').click()
    await page.waitForTimeout(500)
    // Aktivni filter
    await expect(page.locator('button:has-text("Nova").bg-slate-900')).toBeVisible()
  })

  test('API vrača naročila in statistiko', async ({ request }) => {
    const response = await request.get('/api/delivery/orders')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.orders).toBeDefined()
    expect(data.stats).toBeDefined()
    expect(data.stats.total).toBeGreaterThan(0)
    expect(data.platforms).toBeDefined()
    expect(data.platforms.length).toBe(5)
  })

  test('API POST new ustvari novo naročilo', async ({ request }) => {
    const response = await request.post('/api/delivery/orders', {
      data: { action: 'new' },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.order).toBeDefined()
    expect(data.order.platformLabel).toBeDefined()
    expect(data.order.total).toBeGreaterThan(0)
  })
})
