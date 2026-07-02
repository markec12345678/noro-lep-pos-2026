const SESSION_KEY = 'noro-lep-session'
const EVENTS_KEY = 'noro-lep-events'

export interface AnalyticsEvent {
  type: string
  section?: string
  label?: string
  value?: number | string
  timestamp: number
  sessionId: string
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

export function getSession(): { id: string; createdAt: number; pageViews: number } {
  if (typeof window === 'undefined') return { id: 'ssr', createdAt: 0, pageViews: 0 }
  let session = localStorage.getItem(SESSION_KEY)
  if (!session) {
    const newSession = { id: generateSessionId(), createdAt: Date.now(), pageViews: 0 }
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
    session = JSON.stringify(newSession)
  }
  try { return JSON.parse(session) } catch { return { id: generateSessionId(), createdAt: Date.now(), pageViews: 0 } }
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('noro-lep-consent') !== 'false'
}

export function track(event: { type: string; section?: string; label?: string; value?: number | string }): void {
  if (typeof window === 'undefined' || !hasConsent()) return
  const session = getSession()
  const analyticsEvent: AnalyticsEvent = { ...event, timestamp: Date.now(), sessionId: session.id }
  try {
    const existing = localStorage.getItem(EVENTS_KEY)
    const events: AnalyticsEvent[] = existing ? JSON.parse(existing) : []
    events.push(analyticsEvent)
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-100)))
  } catch { /* ignore */ }
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([JSON.stringify(analyticsEvent)], { type: 'application/json' }))
  }
}

export function getMyEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') } catch { return [] }
}

export function clearAnalytics(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(EVENTS_KEY)
}
