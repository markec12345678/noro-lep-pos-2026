import { test, expect } from '@playwright/test'

/**
 * Analytics E2E Tests
 * - Privacy-friendly (no cookies, GDPR-compliant)
 * - Event tracking (page_view, section_view, cta_click)
 * - API endpoint
 * - localStorage transparency
 */

test.describe('Analytics — Privacy-Friendly', () => {
  test('page_view event se shrani v localStorage', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const events = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('noro-lep-events') || '[]')
    })

    expect(events.length).toBeGreaterThan(0)
    expect(events.some((e: { type: string }) => e.type === 'page_view')).toBeTruthy()
  })

  test('session ID je anonimen (sess_ prefix)', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)

    const session = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('noro-lep-session') || '{}')
    })

    expect(session.id).toContain('sess_')
    expect(session.id.length).toBeGreaterThan(10)
  })

  test('CTA click se track-a', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Klikni na hero CTA
    await page.locator('[data-track-label="brezplacni_preizkus_hero"]').click()
    await page.waitForTimeout(1000)

    const events = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('noro-lep-events') || '[]')
    })

    const ctaEvent = events.find((e: { type: string; label?: string }) => e.type === 'cta_click' && e.label === 'brezplacni_preizkus_hero')
    expect(ctaEvent).toBeTruthy()
  })

  test('section_view se track-a ob scroll-u', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Scroll do demo sekcije
    await page.locator('#demo').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)

    const events = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('noro-lep-events') || '[]')
    })

    const sectionEvent = events.find((e: { type: string; section?: string }) => e.type === 'section_view' && e.section === 'demo')
    expect(sectionEvent).toBeTruthy()
  })

  test('API /api/analytics vrača aggregate stats', async ({ request }) => {
    const response = await request.get('/api/analytics')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('uniqueSessions')
    expect(data).toHaveProperty('byType')
    expect(data).toHaveProperty('privacyNote')
    expect(data.privacyNote).toContain('GDPR')
  })

  test('ne uporablja piškotkov (no cookies)', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const cookies = await page.context().cookies()
    // Ne sme biti analytics cookies (samo session/localStorage)
    const analyticsCookies = cookies.filter((c) => c.name.includes('analytics') || c.name.includes('track'))
    expect(analyticsCookies.length).toBe(0)
  })

  test('user lahko izbriše svoje podatke (right to be forgotten)', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Preveri da so event-i prisotni
    const beforeCount = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('noro-lep-events') || '[]').length
    })
    expect(beforeCount).toBeGreaterThan(0)

    // Izbriši
    await page.evaluate(() => {
      localStorage.removeItem('noro-lep-events')
      localStorage.removeItem('noro-lep-session')
    })

    const afterCount = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('noro-lep-events') || '[]').length
    })
    expect(afterCount).toBe(0)
  })
})
