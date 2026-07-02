import { test, expect } from '@playwright/test'

/**
 * FEATURE TESTS
 * - Language switcher (SLO/EN/DE/IT)
 * - ROI calculator (interaktivni drsniki)
 * - Video demo modal
 */

test.describe('Language Switcher', () => {
  test('lahko odprem in izberem jezik', async ({ page }) => {
    await page.goto('/')

    // Klikni na jezikovni switcher (default SLO)
    const langBtn = page.locator('button:has-text("SLO")')
    await langBtn.click()
    await page.waitForTimeout(500)

    // Dropdown bi se odprl z 4 jeziki
    await expect(page.locator('text=Slovenščina')).toBeVisible()
    await expect(page.locator('text=English')).toBeVisible()
    await expect(page.locator('text=Deutsch')).toBeVisible()
    await expect(page.locator('text=Italiano')).toBeVisible()
  })

  test('lahko preklopi na EN', async ({ page }) => {
    await page.goto('/')

    await page.locator('button:has-text("SLO")').click()
    await page.waitForTimeout(300)

    await page.locator('button:has-text("English")').click()
    await page.waitForTimeout(500)

    // Button bi sedaj kazal "EN"
    await expect(page.locator('button:has-text("EN")')).toBeVisible()
  })

  test('dropdown se zapre ob kliku izven', async ({ page }) => {
    await page.goto('/')

    await page.locator('button:has-text("SLO")').click()
    await page.waitForTimeout(300)

    // Klikni izven dropdown-a
    await page.locator('h1').first().click()
    await page.waitForTimeout(500)

    // Dropdown bi se moral zapreti
    await expect(page.locator('text=Slovenščina')).not.toBeVisible()
  })
})

test.describe('ROI Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('#roi').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
  })

  test('prikaže default prihranek', async ({ page }) => {
    // Default vrednosti: 12 miz, 80 gostje, 16€
    await expect(page.locator('text=Število miz')).toBeVisible()
    await expect(page.locator('text=Dnevnih gostov')).toBeVisible()
    await expect(page.locator('text=Povprečni račun')).toBeVisible()

    // Prihranek je prikazan
    await expect(page.locator('text=/\\+[\\d.]+k?\\s*€/')).toBeVisible()
  })

  test('sprememba drsnika posodobi prihranek', async ({ page }) => {
    // Zabeleži trenutni prihranek
    const before = await page.locator('text=/\\+[\\d.]+k?\\s*€/').first().textContent()

    // Spremeni "Število miz" drsnik (več)
    const slider = page.locator('input[type="range"]').first()
    await slider.fill('30')
    await page.waitForTimeout(1000)

    // Prihranek bi se moral spremeniti
    const after = await page.locator('text=/\\+[\\d.]+k?\\s*€/').first().textContent()
    expect(after).not.toBe(before)
  })

  test('ROI badge je prikazan', async ({ page }) => {
    await expect(page.locator('text=/ROI:\\s*\\d+x/')).toBeVisible()
  })

  test('breakdown kartice so prikazane', async ({ page }) => {
    await expect(page.locator('text=Letni promet')).toBeVisible()
    await expect(page.locator('text=Povečan povr. račun')).toBeVisible()
    await expect(page.locator('text=Povratni gostje')).toBeVisible()
    await expect(page.locator('text=Prihranek časa')).toBeVisible()
  })
})

test.describe('Video Demo Modal', () => {
  test('modal se odpre ob kliku', async ({ page }) => {
    await page.goto('/')

    // Klikni "Oglej si demo"
    await page.locator('button:has-text("Oglej si demo")').click()
    await page.waitForTimeout(1000)

    // Modal je odprt
    await expect(page.locator('text=Demo predstavitev')).toBeVisible()
    await expect(page.locator('text=Real-time sync demo')).toBeVisible()
  })

  test('modal se zapre ob kliku na ozadje', async ({ page }) => {
    await page.goto('/')

    await page.locator('button:has-text("Oglej si demo")').click()
    await page.waitForTimeout(500)

    // Klikni na ozadje (overlay)
    await page.locator('.fixed.inset-0').click()
    await page.waitForTimeout(500)

    // Modal je zaprt
    await expect(page.locator('text=Demo predstavitev')).not.toBeVisible()
  })
})
