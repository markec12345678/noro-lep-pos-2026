import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { auditLog } from '@/lib/audit'
import crypto from 'crypto'

/**
 * Auth Library — PIN-based authentication za restaurant POS
 *
 * Standard POS auth: staff vpiše 4-digit PIN na terminalu.
 * Sistem generira JWT token z role + permissions.
 *
 * RBAC (Role-Based Access Control):
 *   manager:    full access (vse permissions)
 *   server:     orders, tables, reservations, customers, payments
 *   cook:       kds, inventory (read)
 *   bartender:  orders, tables, payments
 *   dishwasher: kds (read only)
 *   sommelier:  orders, tables, customers, inventory (wine)
 */

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'noro-lep-pos-dev-secret-2026'
const TOKEN_EXPIRY = '12h' // 12 ur (celoten delovnik)

// ===== PERMISSIONS PER ROLE =====
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  manager: [
    '*.*', // full access
  ],
  server: [
    'orders.view', 'orders.create', 'orders.update',
    'tables.view', 'tables.update',
    'reservations.view', 'reservations.create', 'reservations.update', 'reservations.delete',
    'customers.view', 'customers.create', 'customers.update',
    'payments.view', 'payments.create',
    'waitlist.view', 'waitlist.create', 'waitlist.update',
    'menu.view',
    'kds.view',
    'tips.view',
  ],
  cook: [
    'kds.view', 'kds.update',
    'orders.view',
    'inventory.view',
    'menu.view',
  ],
  bartender: [
    'orders.view', 'orders.create', 'orders.update',
    'tables.view', 'tables.update',
    'payments.view', 'payments.create',
    'menu.view',
    'kds.view', 'kds.update',
  ],
  dishwasher: [
    'kds.view',
    'orders.view',
  ],
  sommelier: [
    'orders.view', 'orders.create', 'orders.update',
    'tables.view', 'tables.update',
    'customers.view', 'customers.create', 'customers.update',
    'inventory.view',
    'menu.view',
  ],
}

// ===== HASH PIN (simple SHA-256, production should use bcrypt) =====
export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin + JWT_SECRET).digest('hex')
}

export function verifyPin(pin: string, hashedPin: string): boolean {
  return hashPin(pin) === hashedPin
}

// ===== GENERATE JWT =====
export interface TokenPayload {
  staffId: string
  staffName: string
  role: string
  permissions: string[]
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

// ===== LOGIN (PIN-based) =====
export async function loginWithPin(pin: string, device?: string, ipAddress?: string, userAgent?: string): Promise<{ ok: boolean; token?: string; staff?: Record<string, unknown>; error?: string }> {
  try {
    const hashedPin = hashPin(pin)

    // Poišči staff z tem PIN-om
    const staff = await db.staff.findFirst({
      where: { pin: hashedPin, active: true },
    })

    if (!staff) {
      return { ok: false, error: 'Napačen PIN ali nedejavno osebje' }
    }

    // Get permissions
    const permissions = staff.permissions
      ? JSON.parse(staff.permissions)
      : ROLE_PERMISSIONS[staff.role] || []

    // Generate token
    const tokenPayload: TokenPayload = {
      staffId: staff.id,
      staffName: `${staff.firstName} ${staff.lastName}`,
      role: staff.role,
      permissions,
    }
    const token = generateToken(tokenPayload)

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 12)

    // Create session log
    await db.sessionLog.create({
      data: {
        staffId: staff.id,
        token,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        device: device || null,
        status: 'active',
        expiresAt,
      },
    })

    // Update lastLogin
    await db.staff.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() },
    })

    // Audit log
    await auditLog({
      entityType: 'staff',
      entityId: staff.id,
      entityName: `${staff.firstName} ${staff.lastName}`,
      action: 'login',
      performedBy: `${staff.firstName} ${staff.lastName}`,
      staffId: staff.id,
      metadata: { device, ipAddress, role: staff.role },
    })

    return {
      ok: true,
      token,
      staff: {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        role: staff.role,
        permissions,
      },
    }
  } catch (error) {
    console.error('[auth] loginWithPin napaka:', error instanceof Error ? error.message : error)
    return { ok: false, error: 'Internal server error' }
  }
}

// ===== LOGOUT =====
export async function logout(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await db.sessionLog.findUnique({ where: { token } })
    if (!session) return { ok: false, error: 'Seja ni najdena' }

    await db.sessionLog.update({
      where: { id: session.id },
      data: { status: 'logged_out', loggedOutAt: new Date() },
    })

    // Audit log
    await auditLog({
      entityType: 'staff',
      entityId: session.staffId,
      action: 'logout',
      performedBy: 'system',
      staffId: session.staffId,
    })

    return { ok: true }
  } catch (error) {
    console.error('[auth] logout napaka:', error instanceof Error ? error.message : error)
    return { ok: false, error: 'Internal server error' }
  }
}

// ===== VERIFY REQUEST (extract + verify token from header) =====
export function verifyRequest(request: Request): { valid: boolean; payload?: TokenPayload; error?: string } {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { valid: false, error: 'Manjka Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = verifyToken(token)

  if (!payload) {
    return { valid: false, error: 'Neveljaven ali potekel token' }
  }

  return { valid: true, payload }
}

// ===== CHECK PERMISSION =====
export function hasPermission(payload: TokenPayload, permission: string): boolean {
  // Manager ima full access
  if (payload.permissions.includes('*.*')) return true
  // Direct match
  if (payload.permissions.includes(permission)) return true
  // Wildcard match (npr. "orders.*" matches "orders.view")
  const parts = permission.split('.')
  if (parts.length >= 2) {
    const wildcard = `${parts[0]}.*`
    if (payload.permissions.includes(wildcard)) return true
  }
  return false
}

// ===== SET PIN (za staff setup) =====
export async function setStaffPin(staffId: string, pin: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!/^\d{4}$/.test(pin)) {
      return { ok: false, error: 'PIN mora biti 4 številke' }
    }

    const hashedPin = hashPin(pin)
    await db.staff.update({
      where: { id: staffId },
      data: { pin: hashedPin },
    })

    return { ok: true }
  } catch (error) {
    console.error('[auth] setStaffPin napaka:', error instanceof Error ? error.message : error)
    return { ok: false, error: 'Internal server error' }
  }
}
