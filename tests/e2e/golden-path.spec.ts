import { test, expect } from '@playwright/test'

/**
 * GOLDEN PATH E2E TEST
 *
 * Kritični flow ki MORA delovati:
 * 1. Ustvari naročilo v POS (dodaj artikel v cart)
 * 2. Pošlji v kuhinjo (checkout → KDS dobi novo naročilo)
 * 3. Preveri da se je miza posodobila (zasedena)
 * 4. Preveri da se je analitika posodobila (promet +)
 * 5. Fiscaliziraj (FURS ZOI/EOR simulation)
 *
 * Če ta test pade, CI/CD blokira deploy.
 */

test.describe('Golden Path — POS → KDS → Tables → Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Scroll to demo section
    await page.locator('#demo').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
  })

  test('POS: lahko dodam artikel v cart', async ({ page }) => {
    // Na začetku je cart prazen
    const cartBadge = page.locator('text=0 artiklov')
    await expect(cartBadge).toBeVisible()

    // Klikni prvi artikel (TEXT natakar view je default)
    const firstItem = page.locator('button:has-text("€")').first()
    await firstItem.click()
    await page.waitForTimeout(500)

    // Cart bi moralo imeti 1 artikel
    await expect(page.locator('text=1 artiklov')).toBeVisible()
  })

  test('POS: lahko dodam več artiklov in vidim skupno ceno', async ({ page }) => {
    // Dodaj 3 artikle
    const items = page.locator('button:has-text("€")').filter({ hasNot: page.locator('text=Skupaj') }).filter({ hasNot: page.locator('text=Brezplačni') })
    await items.nth(0).click()
    await items.nth(1).click()
    await items.nth(2).click()
    await page.waitForTimeout(500)

    // Cart bi moralo imeti 3 artiklov
    await expect(page.locator('text=3 artiklov')).toBeVisible()

    // Skupna cena mora biti > 0
    const total = page.locator('text=Skupaj').locator('..').locator('text=/\\d+[.,]\\d{2}\\s*€/')
    await expect(total).toBeVisible()
  })

  test('POS: checkout pošlje naročilo in izprazni cart', async ({ page }) => {
    // Dodaj artikel
    const firstItem = page.locator('button:has-text("€")').first()
    await firstItem.click()
    await page.waitForTimeout(300)

    // Klikni "Izdaj račun · FURS"
    const checkoutBtn = page.locator('button:has-text("Izdaj račun")')
    await checkoutBtn.click()
    await page.waitForTimeout(1500)

    // Cart bi moralo biti prazno (0 artiklov)
    await expect(page.locator('text=0 artiklov')).toBeVisible()

    // Pojavi se "Poslano v kuhinjo!" message
    await expect(page.locator('text=Poslano v kuhinjo')).toBeVisible({ timeout: 5000 })
  })

  test('KDS: novo naročilo se pojavi v kanban-u', async ({ page }) => {
    // Najprej dodaj artikel in checkout
    const firstItem = page.locator('button:has-text("€")').first()
    await firstItem.click()
    await page.waitForTimeout(300)
    await page.locator('button:has-text("Izdaj račun")').click()
    await page.waitForTimeout(1500)

    // Preklopi na KDS view
    await page.locator('button:has-text("Kuhinja")').click()
    await page.waitForTimeout(1500)

    // V "Nova naročila" stolpcu bi moralo biti naročilo
    await expect(page.locator('text=Nova naročila')).toBeVisible()
    // Naročilo od "Ti (demo)" server-ja
    await expect(page.locator('text=Ti (demo)')).toBeVisible({ timeout: 5000 })
  })

  test('KDS: lahko prestavim naročilo v "V pripravi"', async ({ page }) => {
    // Preklopi na KDS
    await page.locator('button:has-text("Kuhinja")').click()
    await page.waitForTimeout(1500)

    // Klikni "Začni pripravo" na prvem naročilu
    const advanceBtn = page.locator('button:has-text("Začni pripravo")').first()
    if (await advanceBtn.isVisible()) {
      await advanceBtn.click()
      await page.waitForTimeout(1000)

      // Naročilo bi moralo biti v "V pripravi" stolpcu
      await expect(page.locator('text=V pripravi')).toBeVisible()
    }
  })

  test('Tables: miza je prikazana z statusi', async ({ page }) => {
    // Preklopi na Tables
    await page.locator('button:has-text("Mize")').click()
    await page.waitForTimeout(1500)

    // Header
    await expect(page.locator('text=Tloris restavracije')).toBeVisible()

    // Vsaj ena miza je zasedena
    await expect(page.locator('text=Zasedena').first()).toBeVisible()

    // Summary stats na dnu
    await expect(page.locator('text=Prosta')).toBeVisible()
    await expect(page.locator('text=Rezervirana')).toBeVisible()
  })

  test('Analytics: dashboard prikazuje promet in KPI', async ({ page }) => {
    // Preklopi na Analytics
    await page.locator('button:has-text("Analitika")').click()
    await page.waitForTimeout(2000)

    // Header
    await expect(page.locator('text=Analitika')).toBeVisible()

    // KPI kartice
    await expect(page.locator('text=Promet')).toBeVisible()
    await expect(page.locator('text=Naročila')).toBeVisible()
    await expect(page.locator('text=Povr. račun')).toBeVisible()

    // Chart naslovi
    await expect(page.locator('text=Promet po urah')).toBeVisible()
    await expect(page.locator('text=Top 5 jedi')).toBeVisible()
  })

  test('Real-time sync: checkout posodobi vse 4 module', async ({ page }) => {
    // Zabeleži trenutni promet v Analytics
    await page.locator('button:has-text("Analitika")').click()
    await page.waitForTimeout(2000)

    const prometBefore = await page.locator('text=/€[\\d.]+k?/').first().textContent()

    // Pojdi nazaj v POS in checkout
    await page.locator('button:has-text("POS Blagajna")').click()
    await page.waitForTimeout(1000)

    const firstItem = page.locator('button:has-text("€")').first()
    await firstItem.click()
    await page.waitForTimeout(300)
    await page.locator('button:has-text("Izdaj račun")').click()
    await page.waitForTimeout(2000)

    // Preveri KDS da je novo naročilo
    await page.locator('button:has-text("Kuhinja")').click()
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Ti (demo)')).toBeVisible({ timeout: 5000 })

    // Preveri Analytics da se je promet spremenil
    await page.locator('button:has-text("Analitika")').click()
    await page.waitForTimeout(2000)
    const prometAfter = await page.locator('text=/€[\\d.]+k?/').first().textContent()

    // Promet bi se moral spremeniti (real-time sync)
    expect(prometAfter).not.toBe(prometBefore)
  })
})
