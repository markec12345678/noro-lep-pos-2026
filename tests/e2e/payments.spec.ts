import { test, expect } from '@playwright/test'

/**
 * Payments E2E Tests
 * - Payment section visible
 * - Payment modal opens
 * - Demo payment flow
 * - Stripe status badge
 */

test.describe('Payments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#placila').scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000)
  })

  test('prikaže vse plačilne metode', async ({ page }) => {
    await expect(page.locator('text=Apple Pay')).toBeVisible()
    await expect(page.locator('text=Google Pay')).toBeVisible()
    await expect(page.locator('text=Kartica')).toBeVisible()
    await expect(page.locator('text=NFC Contactless')).toBeVisible()
    await expect(page.locator('text=Gotovina')).toBeVisible()
    await expect(page.locator('text=QR plačilo')).toBeVisible()
  })

  test('demo CTA gumb je prisoten', async ({ page }) => {
    await expect(page.locator('button:has-text("demo plačilo")')).toBeVisible()
  })

  test('modal se odpre ob kliku', async ({ page }) => {
    await page.locator('button:has-text("demo plačilo")').click()
    await page.waitForTimeout(1000)
    await expect(page.locator('text=Plačilo računa')).toBeVisible()
    await expect(page.locator('text=Izberi način plačila')).toBeVisible()
  })

  test('modal vsebuje 5 plačilnih metod', async ({ page }) => {
    await page.locator('button:has-text("demo plačilo")').click()
    await page.waitForTimeout(1000)
    // 5 method buttons v modal-u
    const buttons = page.locator('button:has-text("Apple Pay"), button:has-text("Google Pay"), button:has-text("Kartica"), button:has-text("Contactless"), button:has-text("Gotovina")')
    await expect(buttons).toHaveCount(5)
  })

  test('Apple Pay klik sproži processing', async ({ page }) => {
    await page.locator('button:has-text("demo plačilo")').click()
    await page.waitForTimeout(500)
    await page.locator('button:has-text("Apple Pay")').click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Obdelava plačila')).toBeVisible({ timeout: 5000 })
  })

  test('demo result se prikaže po processing', async ({ page }) => {
    await page.locator('button:has-text("demo plačilo")').click()
    await page.waitForTimeout(500)
    await page.locator('button:has-text("Apple Pay")').click()
    await page.waitForTimeout(3000)
    // Demo ali success
    const demoText = page.locator('text=Demo plačilo simulirano')
    const successText = page.locator('text=Plačilo uspešno')
    await expect(demoText.or(successText)).toBeVisible({ timeout: 5000 })
  })

  test('modal se zapre ob kliku na ozadje', async ({ page }) => {
    await page.locator('button:has-text("demo plačilo")').click()
    await page.waitForTimeout(500)
    await page.locator('.fixed.inset-0').click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Plačilo računa')).not.toBeVisible()
  })

  test('API vrača Stripe status', async ({ request }) => {
    const response = await request.get('/api/payments/create-intent')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.mode).toBeDefined()
    expect(data.methods).toBeDefined()
    expect(data.methods.length).toBe(5)
  })

  test('trust badges so prikazani', async ({ page }) => {
    await expect(page.locator('text=PCI DSS certifikacija')).toBeVisible()
    await expect(page.locator('text=3D Secure')).toBeVisible()
    await expect(page.locator('text=Instant settlement')).toBeVisible()
  })
})
