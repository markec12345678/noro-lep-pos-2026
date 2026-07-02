import { NextResponse } from 'next/server'

interface StoredEvent {
  type: string
  section?: string
  label?: string
  value?: number | string
  timestamp: number
  sessionId: string
}

const eventStore: StoredEvent[] = []
const MAX_EVENTS = 10000

export async function POST(request: Request) {
  try {
    const body = await request.json() as StoredEvent
    if (!body.type || typeof body.type !== 'string') {
      return NextResponse.json({ error: 'Missing event type' }, { status: 400 })
    }
    const sanitized: StoredEvent = {
      type: String(body.type).substring(0, 50),
      section: body.section ? String(body.section).substring(0, 50) : undefined,
      label: body.label ? String(body.label).substring(0, 100) : undefined,
      value: body.value,
      timestamp: body.timestamp || Date.now(),
      sessionId: String(body.sessionId || 'unknown').substring(0, 30),
    }
    eventStore.push(sanitized)
    if (eventStore.length > MAX_EVENTS) eventStore.splice(0, eventStore.length - MAX_EVENTS)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export async function GET() {
  const total = eventStore.length
  const byType: Record<string, number> = {}
  const bySection: Record<string, number> = {}
  const uniqueSessions = new Set(eventStore.map((e) => e.sessionId)).size
  for (const event of eventStore) {
    byType[event.type] = (byType[event.type] || 0) + 1
    if (event.section) bySection[event.section] = (bySection[event.section] || 0) + 1
  }
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const recent = eventStore.filter((e) => e.timestamp > dayAgo).length
  return NextResponse.json({
    total, recent24h: recent, uniqueSessions, byType, bySection,
    privacyNote: 'GDPR-compliant · no cookies · no PII · anonymous sessions only',
  })
}
