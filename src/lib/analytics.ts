/**
 * Privacy-Friendly Analytics — GDPR-compliant, no cookies, no PII
 *
 * Načela:
 * - NO cookies (samo localStorage za session ID)
 * - NO personally identifiable information (PII)
 * - NO fingerprinting (random session ID, ne hash naprav)
 * - Anonymous aggregate events only
 * - User can view/clear their own data
 * - No external services (vse self-hosted)
 */

const SESSION_KEY = 'noro-lep-session'
const EVENTS_KEY = 'noro-lep-events'
const CONSENT_KEY = 'noro-lep-consent'

export interface AnalyticsEvent {
  type: string
  section?: string
  label?: string
  value?: number | string
  timestamp: number
  sessionId: string
}

interface SessionInfo {
  id: string
  createdAt: number
  pageViews: number
}

/**
 * Generate anonymous session ID (random, not fingerprinted)
 */
function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

/**
 * Get or create anonymous session
 */
export function getSession(): SessionInfo {
  if (typeof window === 'undefined') return { id: 'ssr', createdAt: 0, pageViews: 0 }

  let session = localStorage.getItem(SESSION_KEY)
  if (!session) {
    const newSession: SessionInfo = {
      id: generateSessionId(),
      createdAt: Date.now(),
      pageViews: 0,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
    session = JSON.stringify(newSession)
  }

  try {
    const parsed: SessionInfo = JSON.parse(session)
    return parsed
  } catch {
    const newSession: SessionInfo = {
      id: generateSessionId(),
      createdAt: Date.now(),
      pageViews: 0,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
    return newSession
  }
}

/**
 * Check if user has given analytics consent (default: true za anonymne)
 */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false
  const consent = localStorage.getItem(CONSENT_KEY)
  // Default: true (samo anonymni podatki, GDPR-compliant)
  return consent === null ? true : consent === 'true'
}

/**
 * Set analytics consent (user can opt-out)
 */
export function setConsent(consent: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONSENT_KEY, String(consent))
  if (!consent) {
    clearAnalytics()
  }
}

/**
 * Track an event — GDPR-compliant, anonymous
 */
export function track(event: {
  type: string
  section?: string
  label?: string
  value?: number | string
}): void {
  if (typeof window === 'undefined') return
  if (!hasConsent()) return

  const session = getSession()
  const analyticsEvent: AnalyticsEvent = {
    type: event.type,
    section: event.section,
    label: event.label,
    value: event.value,
    timestamp: Date.now(),
    sessionId: session.id,
  }

  // Shranjuj v localStorage (batch)
  try {
    const existing = localStorage.getItem(EVENTS_KEY)
    const events: AnalyticsEvent[] = existing ? JSON.parse(existing) : []
    events.push(analyticsEvent)

    // Omeji na zadnjih 100 eventov (privacy: ne hranimo preveč)
    const trimmed = events.slice(-100)
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore storage errors
  }

  // Pošlji na API (fire-and-forget, ne blokiraj UI)
  sendToApi(analyticsEvent).catch(() => {
    // Silent fail — analytics ne sme break-at UI
  })
}

/**
 * Send event to API endpoint (batch, fire-and-forget)
 */
async function sendToApi(event: AnalyticsEvent): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
    // Fallback na fetch
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true,
      })
    } catch {
      // Silent fail
    }
    return
  }

  // sendBeacon je boljši za performance (ne blokira UI)
  const blob = new Blob([JSON.stringify(event)], { type: 'application/json' })
  navigator.sendBeacon('/api/analytics', blob)
}

/**
 * Get user's own events (za transparency)
 */
export function getMyEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const existing = localStorage.getItem(EVENTS_KEY)
    return existing ? JSON.parse(existing) : []
  } catch {
    return []
  }
}

/**
 * Clear all analytics data (right to be forgotten)
 */
export function clearAnalytics(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(EVENTS_KEY)
}

/**
 * Get aggregated stats (za dashboard)
 */
export function getMyStats() {
  const events = getMyEvents()
  const ctaClicks = events.filter((e) => e.type === 'cta_click').length
  const languageChanges = events.filter((e) => e.type === 'language_change').length
  const roiCalcs = events.filter((e) => e.type === 'roi_calculate').length
  const videoOpens = events.filter((e) => e.type === 'video_open').length
  const sectionViews = events.filter((e) => e.type === 'section_view')
  const uniqueSections = new Set(sectionViews.map((e) => e.section)).size

  return {
    totalEvents: events.length,
    ctaClicks,
    languageChanges,
    roiCalcs,
    videoOpens,
    uniqueSections,
    sessionAge: Date.now() - (getSession().createdAt || Date.now()),
  }
}
