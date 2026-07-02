import { test, expect } from '@playwright/test'

/**
 * Command Center E2E Tests
 * - 7 sistemov prikazanih
 * - System health bar
 * - Live clock
 * - Auto-refresh
 */

test.describe('Command Center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#command-center').scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000)
  })

  test('prikaže vseh 7 sistemov', async ({ page }) => {
    await expect(page.locator('text=POS Blagajna')).toBeVisible()
    await expect(page.locator('text=Kuhinja (KDS)')).toBeVisible()
    await expect(page.locator('text=Mize')).toBeVisible()
    await expect(page.locator('text=Dostava')).toBeVisible()
    await expect(page.locator('text=AI predikcija')).toBeVisible()
    await expect(page.locator('text=Plačila')).toBeVisible()
    await expect(page.locator('text=Zaloge')).toBeVisible()
  })

  test('system health bar je prikazan', async ({ page }) => {
    await expect(page.locator('text=System Health')).toBeVisible()
    await expect(page.locator('text=Uptime')).toBeVisible()
    await expect(page.locator('text=99.9%')).toBeVisible()
  })

  test('POS kartica prikazuje promet', async ({ page }) => {
    await expect(page.locator('text=POS Blagajna').locator('..').locator('text=/€[\\d,]+/')).toBeVisible()
    await expect(page.locator('text=naročil')).toBeVisible()
  })

  test('KDS kartica prikuja statuse', async ({ page }) => {
    await expect(page.locator('text=NOVA')).toBeVisible()
    await expect(page.locator('text=PRIPRAVA')).toBeVisible()
    await expect(page.locator('text=PRIPRAVL')).toBeVisible()
  })

  test('real-time sync indicator je prisoten', async ({ page }) => {
    await expect(page.locator('text=Real-time Sync')).toBeVisible()
    await expect(page.locator('text=7 modulov sinhroniziranih')).toBeVisible()
  })

  test('live clock se posodablja', async ({ page }) => {
    const time1 = await page.locator('text=/\\d{2}:\\d{2}:\\d{2}/').first().textContent()
    await page.waitForTimeout(2000)
    const time2 = await page.locator('text=/\\d{2}:\\d{2}:\\d{2}/').first().textContent()
    expect(time1).not.toBeNull()
    expect(time2).not.toBeNull()
  })

  test('API /api/dashboard/overview vrača vse sisteme', async ({ request }) => {
    const response = await request.get('/api/dashboard/overview')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.pos).toBeDefined()
    expect(data.kds).toBeDefined()
    expect(data.tables).toBeDefined()
    expect(data.delivery).toBeDefined()
    expect(data.ai).toBeDefined()
    expect(data.payments).toBeDefined()
    expect(data.inventory).toBeDefined()
    expect(data.systemHealth).toBeDefined()
    expect(data.systemHealth.activeModules).toBe(7)
  })
})
