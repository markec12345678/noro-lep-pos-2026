import { test, expect } from '@playwright/test'

test.describe('Command Center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#command-center').scrollIntoViewIfNeeded()
    await page.waitForTimeout(3000)
  })

  test('prikaže vseh 7 sistemov', async ({ page }) => {
    const cc = page.locator('#command-center')
    await expect(cc.getByText('POS Blagajna', { exact: true })).toBeVisible()
    await expect(cc.getByText('Kuhinja (KDS)', { exact: true })).toBeVisible()
    await expect(cc.getByText('Mize', { exact: true })).toBeVisible()
    await expect(cc.getByText('Dostava', { exact: true })).toBeVisible()
    await expect(cc.getByText('AI predikcija', { exact: true })).toBeVisible()
    await expect(cc.getByText('Plačila', { exact: true })).toBeVisible()
    await expect(cc.getByText('Zaloge', { exact: true })).toBeVisible()
  })

  test('system health bar je prikazan', async ({ page }) => {
    const cc = page.locator('#command-center')
    await expect(cc.getByText('System Health')).toBeVisible()
    await expect(cc.getByText('Uptime')).toBeVisible()
    await expect(cc.getByText('99.9%')).toBeVisible()
  })

  test('POS kartica prikazuje promet', async ({ page }) => {
    const cc = page.locator('#command-center')
    await expect(cc.getByText(/€[\d,]+/)).toBeVisible()
    await expect(cc.getByText('naročil')).toBeVisible()
  })

  test('KDS kartica prikazuje statuse', async ({ page }) => {
    const cc = page.locator('#command-center')
    await expect(cc.getByText('NOVA')).toBeVisible()
    await expect(cc.getByText('PRIPRAVA')).toBeVisible()
    await expect(cc.getByText('PRIPRAVL')).toBeVisible()
  })

  test('real-time sync indicator je prisoten', async ({ page }) => {
    const cc = page.locator('#command-center')
    await expect(cc.getByText('Real-time Sync')).toBeVisible()
    await expect(cc.getByText('7 modulov sinhroniziranih')).toBeVisible()
  })

  test('live clock se posodablja', async ({ page }) => {
    const cc = page.locator('#command-center')
    const time1 = await cc.getByText(/\d{2}:\d{2}:\d{2}/).first().textContent()
    await page.waitForTimeout(2000)
    const time2 = await cc.getByText(/\d{2}:\d{2}:\d{2}/).first().textContent()
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
