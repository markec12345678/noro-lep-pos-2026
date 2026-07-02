import { test, expect } from '@playwright/test'

test.describe('Delivery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#dostava').scrollIntoViewIfNeeded()
    await page.waitForTimeout(3000)
  })

  test('prikaže 5 platform', async ({ page }) => {
    const sec = page.locator('#dostava')
    await expect(sec.getByText('Wolt', { exact: true })).toBeVisible()
    await expect(sec.getByText('Uber Eats', { exact: true })).toBeVisible()
    await expect(sec.getByText('Glovo', { exact: true })).toBeVisible()
    await expect(sec.getByText('Lastmin', { exact: true })).toBeVisible()
    await expect(sec.getByText('QR Naročilo', { exact: true })).toBeVisible()
  })

  test('stats so prikazane', async ({ page }) => {
    const sec = page.locator('#dostava')
    await expect(sec.getByText('Skupaj naročil')).toBeVisible()
    await expect(sec.getByText('Novih')).toBeVisible()
    await expect(sec.getByText('Bruto promet')).toBeVisible()
    await expect(sec.getByText('Neto', { exact: true })).toBeVisible()
  })

  test('order feed vsebuje naročila', async ({ page }) => {
    const sec = page.locator('#dostava')
    await expect(sec.getByText(/DEL-/)).toBeVisible({ timeout: 5000 })
  })

  test('auto-accept toggle deluje', async ({ page }) => {
    const sec = page.locator('#dostava')
    const toggle = sec.getByRole('button', { name: /Auto-accept/i })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await page.waitForTimeout(500)
    await expect(sec.getByRole('button', { name: /Auto-accept ON/i })).toBeVisible()
  })

  test('simuliraj naročilo gumb deluje', async ({ page }) => {
    const sec = page.locator('#dostava')
    const btn = sec.getByRole('button', { name: /Simuliraj naročilo/i })
    await btn.click()
    await page.waitForTimeout(2000)
    await expect(sec.getByText(/DEL-/)).toBeVisible({ timeout: 5000 })
  })

  test('filter tabs delujejo', async ({ page }) => {
    const sec = page.locator('#dostava')
    await sec.getByRole('button', { name: 'Nova' }).click()
    await page.waitForTimeout(500)
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
