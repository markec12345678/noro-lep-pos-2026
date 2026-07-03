import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Customer & Loyalty API — CRM + točkovanje + tierji
 *
 * GET    /api/customers              — list (filter by tier, phone, active)
 * GET    /api/customers?id=X         — single customer z loyalty history + reservations
 * POST   /api/customers              — create new customer
 * PATCH  /api/customers              — update profile / earn points / redeem points
 *
 * Tier sistem:
 *   bronze:  0-499 točk    → 5% popust ob RD
 *   silver:  500-1499      → 10% popust + pijača vsak 5. obisk
 *   gold:    1500+         → 15% popust + prioriteta + sladica
 */

const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 499, perk: '5% popust ob rojstnem dnevu' },
  silver: { min: 500, max: 1499, perk: '10% popust + brezplačna pijača vsak 5. obisk' },
  gold: { min: 1500, max: Infinity, perk: '15% popust + prioriteta rezervacij + sladica' },
}

function calculateTier(points: number): string {
  if (points >= 1500) return 'gold'
  if (points >= 500) return 'silver'
  return 'bronze'
}

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const tier = searchParams.get('tier')
    const phone = searchParams.get('phone')
    const active = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (id) {
      const customer = await db.customer.findUnique({
        where: { id },
        include: {
          loyaltyTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
          reservations: { orderBy: { date: 'desc' }, take: 10 },
        },
      })
      if (!customer) return NextResponse.json({ ok: false, error: 'Gost ni najden' }, { status: 404 })

      const tierInfo = TIER_THRESHOLDS[customer.tier as keyof typeof TIER_THRESHOLDS]
      return NextResponse.json({
        ok: true,
        customer: { ...customer, tierInfo },
      })
    }

    const where: Record<string, unknown> = {}
    if (tier) where.tier = tier
    if (phone) where.phone = { contains: phone }
    if (active !== null) where.active = active !== 'false'

    const customers = await db.customer.findMany({
      where,
      orderBy: [{ active: 'desc' }, { totalSpent: 'desc' }],
      take: limit,
    })

    const stats = {
      total: customers.length,
      active: customers.filter(c => c.active).length,
      byTier: {
        bronze: customers.filter(c => c.tier === 'bronze').length,
        silver: customers.filter(c => c.tier === 'silver').length,
        gold: customers.filter(c => c.tier === 'gold').length,
      },
      totalPoints: customers.reduce((s, c) => s + c.points, 0),
      totalSpent: Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) * 100) / 100,
      totalVisits: customers.reduce((s, c) => s + c.totalVisits, 0),
      avgPointsPerCustomer: customers.length > 0
        ? Math.round(customers.reduce((s, c) => s + c.points, 0) / customers.length)
        : 0,
    }

    return NextResponse.json({ ok: true, count: customers.length, stats, customers })
  } catch (error) {
    console.error('[customers] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create new customer
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, birthday, allergens, vegan = false, vegetarian = false, consent = true, notes } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ ok: false, error: 'firstName in lastName sta obvezna' }, { status: 400 })
    }

    // Email unique check
    if (email) {
      const existing = await db.customer.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ ok: false, error: 'Gost s tem emailom že obstaja' }, { status: 409 })
      }
    }

    // Phone unique check
    if (phone) {
      const existing = await db.customer.findUnique({ where: { phone } })
      if (existing) {
        return NextResponse.json({ ok: false, error: 'Gost s to telefonsko številko že obstaja' }, { status: 409 })
      }
    }

    const customer = await db.customer.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        birthday: birthday ? new Date(birthday) : null,
        allergens: allergens ? JSON.stringify(allergens) : null,
        vegan: Boolean(vegan),
        vegetarian: Boolean(vegetarian),
        consent: Boolean(consent),
        notes: notes || null,
      },
    })

    console.log(`[customers] ✓ Nov gost: ${firstName} ${lastName} | tier=${customer.tier} | points=${customer.points}`)

    return NextResponse.json({
      ok: true,
      message: 'Gost dodan v CRM',
      customer,
    }, { status: 201 })
  } catch (error) {
    console.error('[customers] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update customer / earn points / redeem points
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id) return NextResponse.json({ ok: false, error: 'ID je obvezen' }, { status: 400 })

    // ===== EARN POINTS (ob order payment) =====
    if (action === 'earn') {
      const { orderId, amount } = body
      if (!amount) return NextResponse.json({ ok: false, error: 'amount je obvezen za earn' }, { status: 400 })

      // 1 točka za vsak evro
      const points = Math.floor(amount)
      const customer = await db.customer.findUnique({ where: { id } })
      if (!customer) return NextResponse.json({ ok: false, error: 'Gost ni najden' }, { status: 404 })

      const newPoints = customer.points + points
      const newTier = calculateTier(newPoints)
      const tierUpgraded = newTier !== customer.tier

      const updated = await db.customer.update({
        where: { id },
        data: {
          points: newPoints,
          totalVisits: customer.totalVisits + 1,
          totalSpent: Math.round((customer.totalSpent + amount) * 100) / 100,
          lastVisit: new Date(),
          tier: newTier,
        },
      })

      // Ustvari loyalty transaction
      await db.loyaltyTransaction.create({
        data: {
          customerId: id,
          type: 'earn',
          points,
          reason: orderId ? `order ${orderId}` : `nakup €${amount}`,
          orderId: orderId || null,
          balanceAfter: newPoints,
        },
      })

      // Bonus točke ob tier upgrade
      if (tierUpgraded) {
        const bonusPoints = newTier === 'gold' ? 100 : newTier === 'silver' ? 50 : 0
        if (bonusPoints > 0) {
          await db.loyaltyTransaction.create({
            data: {
              customerId: id,
              type: 'bonus',
              points: bonusPoints,
              reason: `Tier upgrade: ${customer.tier} → ${newTier}`,
              balanceAfter: newPoints + bonusPoints,
            },
          })
          await db.customer.update({
            where: { id },
            data: { points: newPoints + bonusPoints },
          })
        }
      }

      console.log(`[customers] ✓ ${updated.firstName} +${points} točk (€${amount}) | total=${newPoints} | tier=${newTier}${tierUpgraded ? ' ↑UPGRADED' : ''}`)

      return NextResponse.json({
        ok: true,
        message: `+${points} točk pridobljenih`,
        customer: updated,
        tierUpgraded,
        newTier: tierUpgraded ? newTier : undefined,
      })
    }

    // ===== REDEEM POINTS =====
    if (action === 'redeem') {
      const { points: pts, reason } = body
      if (!pts) return NextResponse.json({ ok: false, error: 'points je obvezen za redeem' }, { status: 400 })

      const customer = await db.customer.findUnique({ where: { id } })
      if (!customer) return NextResponse.json({ ok: false, error: 'Gost ni najden' }, { status: 404 })

      const redeemPoints = parseInt(pts)
      if (customer.points < redeemPoints) {
        return NextResponse.json({
          ok: false,
          error: `Premalo točk. Na voljo: ${customer.points}, zahtevano: ${redeemPoints}`,
        }, { status: 400 })
      }

      const newPoints = customer.points - redeemPoints
      const newTier = calculateTier(newPoints)
      const tierDowngraded = newTier !== customer.tier

      const updated = await db.customer.update({
        where: { id },
        data: { points: newPoints, tier: newTier },
      })

      await db.loyaltyTransaction.create({
        data: {
          customerId: id,
          type: 'redeem',
          points: -redeemPoints,
          reason: reason || 'prevzem nagrade',
          balanceAfter: newPoints,
        },
      })

      console.log(`[customers] ✓ ${updated.firstName} -${redeemPoints} točk | total=${newPoints} | tier=${newTier}${tierDowngraded ? ' ↓DOWNGRADED' : ''}`)

      return NextResponse.json({
        ok: true,
        message: `${redeemPoints} točk unovčenih`,
        customer: updated,
        tierDowngraded,
      })
    }

    // ===== UPDATE PROFILE =====
    if (action === 'update' || !action) {
      const { firstName, lastName, email, phone, birthday, favoriteItem, allergens, vegan, vegetarian, consent, notes, active } = body

      const updateData: Record<string, unknown> = {}
      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (email !== undefined) updateData.email = email
      if (phone !== undefined) updateData.phone = phone
      if (birthday !== undefined) updateData.birthday = birthday ? new Date(birthday) : null
      if (favoriteItem !== undefined) updateData.favoriteItem = favoriteItem
      if (allergens !== undefined) updateData.allergens = allergens ? JSON.stringify(allergens) : null
      if (vegan !== undefined) updateData.vegan = Boolean(vegan)
      if (vegetarian !== undefined) updateData.vegetarian = Boolean(vegetarian)
      if (consent !== undefined) updateData.consent = Boolean(consent)
      if (notes !== undefined) updateData.notes = notes
      if (active !== undefined) updateData.active = Boolean(active)

      const updated = await db.customer.update({
        where: { id },
        data: updateData,
      })

      console.log(`[customers] ✓ ${updated.firstName} ${updated.lastName} profil posodobljen`)

      return NextResponse.json({ ok: true, message: 'Profil posodobljen', customer: updated })
    }

    // ===== BIRTHDAY BONUS =====
    if (action === 'birthday_bonus') {
      const customer = await db.customer.findUnique({ where: { id } })
      if (!customer) return NextResponse.json({ ok: false, error: 'Gost ni najden' }, { status: 404 })

      const bonusPoints = 50
      const newPoints = customer.points + bonusPoints

      const updated = await db.customer.update({
        where: { id },
        data: { points: newPoints },
      })

      await db.loyaltyTransaction.create({
        data: {
          customerId: id,
          type: 'bonus',
          points: bonusPoints,
          reason: 'Rojsdani bonus',
          balanceAfter: newPoints,
        },
      })

      return NextResponse.json({
        ok: true,
        message: `+${bonusPoints} rojstni dan bonus`,
        customer: updated,
      })
    }

    return NextResponse.json({ ok: false, error: 'Neveljaven action. Dovoljeni: earn, redeem, update, birthday_bonus' }, { status: 400 })
  } catch (error) {
    console.error('[customers] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
