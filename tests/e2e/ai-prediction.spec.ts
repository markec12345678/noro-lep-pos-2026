import { test, expect } from '@playwright/test'

/**
 * AI Prediction E2E Tests
 * - Stats
 * - Predictions grid
 * - Reorder list toggle
 * - Urgency badges
 * - API
 */

test.describe('AI Prediction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#ai-prediction').scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000)
  })

  test('prikaže AI stats', async ({ page }) => {
    await expect(page.locator('text=Analizirano artiklov')).toBeVisible()
    await expect(page.locator('text=Kritičnih')).toBeVisible()
    await expect(page.locator('text=Povprečno zaupanje')).toBeVisible()
    await expect(page.locator('text=Vrednost dobavnice')).toBeVisible()
  })

  test('prikaže predikcije grid', async ({ page }) => {
    // Vsaj ena predikcija
    await expect(page.locator('text=Predikcija/teden')).toBeVisible()
    await expect(page.locator('text=Zmanjka v')).toBeVisible()
    await expect(page.locator('text=Zaupanje')).toBeVisible()
  })

  test('urgency badges so prisotne', async ({ page }) => {
    // KRITIČNO badge mora biti prisoten (vsi artikli imajo nizko zalogo v demo)
    await expect(page.locator('text=KRITIČNO').first()).toBeVisible()
  })

  test('trend indicator je prikazan', async ({ page }) => {
    // Vsaj en trend (Rast, Padec, Sezonsko, Stabilno)
    const trends = page.locator('text=/Rast|Padec|Sezonsko|Stabilno/')
    await expect(trends.first()).toBeVisible()
  })

  test('toggle med Predikcije in Dobavnica', async ({ page }) => {
    // Klikni na Dobavnica tab
    await page.locator('button:has-text("Dobavnica")').click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=AI samodejna dobavnica')).toBeVisible()
    await expect(page.locator('button:has-text("Ustvari dobavnico")')).toBeVisible()

    // Nazaj na predikcije
    await page.locator('button:has-text("Predikcije")').click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Predikcija/teden')).toBeVisible()
  })

  test('reorder list vsebuje artikle', async ({ page }) => {
    await page.locator('button:has-text("Dobavnica")').click()
    await page.waitForTimeout(500)
    // Artikli v reorder list
    const items = page.locator('text=/\\+\\d+/')
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
    // Vsaj en reasoning tekst
    const reasoning = page.locator('text=/Zaloga|predvideno|naroči|trend|sezonski/')
    await expect(reasoning.first()).toBeVisible()
  })
})
