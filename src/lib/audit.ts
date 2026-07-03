import { db } from '@/lib/db'

/**
 * Audit Log Helper — kliči iz kateregakoli API route-ja
 * za beleženje sprememb (FURS compliance + security)
 *
 * Usage:
 *   import { auditLog } from '@/lib/audit'
 *   await auditLog({
 *     entityType: 'order',
 *     entityId: order.id,
 *     entityName: order.orderNumber,
 *     action: 'status_change',
 *     performedBy: 'Maja K.',
 *     changes: { status: { before: 'sent', after: 'paid' } },
 *     metadata: { amount: 77.16, paymentMethod: 'card' },
 *     severity: 'info',
 *   })
 */

export interface AuditLogEntry {
  entityType: string
  entityId?: string
  entityName?: string
  action: string
  performedBy?: string
  staffId?: string
  changes?: Record<string, { before: unknown; after: unknown }>
  metadata?: Record<string, unknown>
  severity?: 'info' | 'warning' | 'critical'
}

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId || null,
        entityName: entry.entityName || null,
        action: entry.action,
        performedBy: entry.performedBy || null,
        staffId: entry.staffId || null,
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        severity: entry.severity || 'info',
      },
    })
  } catch (error) {
    // Audit log failure ne sme ustaviti glavne operacije
    console.error('[audit] Napaka pri beleženju:', error instanceof Error ? error.message : error)
  }
}

// Helper za masovno logiranje (npr. batch operations)
export async function auditLogBatch(entries: AuditLogEntry[]): Promise<void> {
  try {
    await db.auditLog.createMany({
      data: entries.map(entry => ({
        entityType: entry.entityType,
        entityId: entry.entityId || null,
        entityName: entry.entityName || null,
        action: entry.action,
        performedBy: entry.performedBy || null,
        staffId: entry.staffId || null,
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        severity: entry.severity || 'info',
      })),
    })
  } catch (error) {
    console.error('[audit] Batch napaka:', error instanceof Error ? error.message : error)
  }
}
