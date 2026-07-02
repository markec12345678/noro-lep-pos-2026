import { test, expect } from '@playwright/test'

test.describe('AI Prediction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#ai-prediction').scrollIntoViewIfNeeded()
    await page.waitForTimeout(3000)
  })

  test('prikaže AI stats', async ({ page }) => {
    const sec = page.locator('#ai-prediction')
    await expect(sec.getByText('Analizirano artiklov')).toBeVisible()
    await expect(sec.getByText('Kritičnih')).toBeVisible()
    await expect(sec.getByText('Povprečno zaupanje')).toBeVisible()
    await expect(sec.getByText('Vrednost dobavnice')).toBeVisible()
  })

  test('prikaže predikcije grid', async ({ page }) => {
    const sec = page.locator('#ai-prediction')
    await expect(sec.getByText('Predikcija/teden')).toBeVisible()
    await expect(sec.getByText('Zmanjka v')).toBeVisible()
    await expect(sec.getByText('Zaupanje')).toBeVisible()
  })

  test('urgency badges so prisotne', async ({ page }) => {
    const sec = page.locator('#ai-prediction')
    await expect(sec.getByText('KRITIČNO').first()).toBeVisible()
  })

  test('trend indicator je prikazan', async ({ page }) => {
    const sec = page.locator('#ai-prediction')
    const trends = sec.getByText(/Rast|Padec|Sezonsko|Stabilno/)
    await expect(trends.first()).toBeVisible()
  })

  test('toggle med Predikcije in Dobavnica', async ({ page }) => {
    const sec = page.locator('#ai-prediction')
    await sec.getByRole('button', { name: /Dobavnica/i }).click()
    await page.waitForTimeout(500)
    await expect(sec.getByText('AI samodejna dobavnica')).toBeVisible()
    await expect(sec.getByRole('button', { name: /Ustvari dobavnico/i })).toBeVisible()

    await sec.getByRole('button', { name: /Predikcije/i }).click()
    await page.waitForTimeout(500)
    await expect(sec.getByText('Predikcija/teden')).toBeVisible()
  })

  test('reorder list vsebuje artikle', async ({ page }) => {
    const sec = page.locator('#ai-prediction')
    await sec.getByRole('button', { name: /Dobavnica/i }).click()
    await page.waitForTimeout(500)
    const items = sec.getByText(/\+\d+/)
    await expect(items.first()).toBeVisible()
  })

  test('API vrača predikcije in statistiko', async ({ request }) => {
    const response = await request.get('/api/ai/predict')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.predictions).toBeDefined()
    expect(data.predictions.length).toBeGreaterThan(0)
    expect(data.stats).toBeDefined()
    expect(data.stats.totalItems).toBeGreaterThan(0)
    expect(data.stats.avgConfidence).toBeGreaterThan(50)
    expect(data.reorderList).toBeDefined()
  })

  test('AI reasoning je prikazan', async ({ page }) => {
    const sec = page.locator('#ai-prediction')
    const reasoning = sec.getByText(/Zaloga|predvideno|naroči|trend|sezonski/)
    await expect(reasoning.first()).toBeVisible()
  })
})
