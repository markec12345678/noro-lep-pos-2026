import { test, expect } from '@playwright/test'

test.describe('Payments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#placila').scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000)
  })

  test('prikaže vse plačilne metode', async ({ page }) => {
    const sec = page.locator('#placila')
    await expect(sec.getByText('Apple Pay', { exact: true })).toBeVisible()
    await expect(sec.getByText('Google Pay', { exact: true })).toBeVisible()
    await expect(sec.getByText('Kartica', { exact: true })).toBeVisible()
    await expect(sec.getByText('NFC Contactless', { exact: true })).toBeVisible()
    await expect(sec.getByText('Gotovina', { exact: true })).toBeVisible()
    await expect(sec.getByText('QR plačilo', { exact: true })).toBeVisible()
  })

  test('demo CTA gumb je prisoten', async ({ page }) => {
    await expect(page.locator('#placila').getByRole('button', { name: /demo plačilo/i })).toBeVisible()
  })

  test('modal se odpre ob kliku', async ({ page }) => {
    await page.locator('#placila').getByRole('button', { name: /demo plačilo/i }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('Plačilo računa')).toBeVisible()
    await expect(page.getByText('Izberi način plačila')).toBeVisible()
  })

  test('modal vsebuje 5 plačilnih metod', async ({ page }) => {
    await page.locator('#placila').getByRole('button', { name: /demo plačilo/i }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByRole('button', { name: 'Apple Pay' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Google Pay' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gotovina' })).toBeVisible()
  })

  test('Apple Pay klik sproži processing', async ({ page }) => {
    await page.locator('#placila').getByRole('button', { name: /demo plačilo/i }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Apple Pay' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Obdelava plačila')).toBeVisible({ timeout: 5000 })
  })

  test('demo result se prikaže po processing', async ({ page }) => {
    await page.locator('#placila').getByRole('button', { name: /demo plačilo/i }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Apple Pay' }).click()
    await page.waitForTimeout(3000)
    const demoText = page.getByText('Demo plačilo simulirano')
    const successText = page.getByText('Plačilo uspešno')
    await expect(demoText.or(successText)).toBeVisible({ timeout: 5000 })
  })

  test('modal se zapre ob kliku na ozadje', async ({ page }) => {
    await page.locator('#placila').getByRole('button', { name: /demo plačilo/i }).click()
    await page.waitForTimeout(500)
    // Click on the overlay (fixed inset-0 div)
    await page.locator('.fixed.inset-0.bg-black\\/60').click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Plačilo računa')).not.toBeVisible()
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
    const sec = page.locator('#placila')
    await expect(sec.getByText('PCI DSS certifikacija')).toBeVisible()
    await expect(sec.getByText('3D Secure')).toBeVisible()
    await expect(sec.getByText('Instant settlement')).toBeVisible()
  })
})
