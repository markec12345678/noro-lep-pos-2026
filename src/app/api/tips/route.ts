import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Tips API — napojnine, tip pooling, distribution
 *
 * GET   /api/tips                — list distributions (filter by date, staffId, status)
 * GET   /api/tips?summary=true   — daily tip summary (total tips, by staff, by role)
 * POST  /api/tips                — distribute tips for a date (auto from orders + staff hours)
 * PATCH /api/tips                — approve / pay distributions
 *
 * Pool types:
 *   individual: vsak natakar obdrži svoje tips
 *   shared: front-of-house (servers, bartenders) delijo med seboj
 *   pooled: vsi delavci delijo glede na ure delo
 */

// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const summary = searchParams.get('summary') === 'true'

    // Daily summary
    if (summary && date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')

      // Tips from orders that day
      const orders = await db.order.findMany({
        where: { paidAt: { gte: start, lte: end }, status: 'paid' },
        select: { tip: true, serverName: true, tipMethod: true, total: true },
      })

      const totalTips = orders.reduce((s, o) => s + o.tip, 0)
      const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
      const tipPct = totalRevenue > 0 ? Math.round((totalTips / totalRevenue) * 10000) / 100 : 0

      // By server
      const byServer: Record<string, { tips: number; orders: number }> = {}
      for (const o of orders) {
        const name = o.serverName || 'Unknown'
        if (!byServer[name]) byServer[name] = { tips: 0, orders: 0 }
        byServer[name].tips += o.tip
        byServer[name].orders++
      }

      // Existing distributions
      const distributions = await db.tipDistribution.findMany({
        where: { date: { gte: start, lte: end } },
      })

      return NextResponse.json({
        ok: true,
        summary: {
          date,
          totalTips: Math.round(totalTips * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          tipPct,
          ordersWithTips: orders.filter(o => o.tip > 0).length,
          totalOrders: orders.length,
          byServer: Object.entries(byServer).map(([name, v]) => ({
            name,
            tips: Math.round(v.tips * 100) / 100,
            orders: v.orders,
          })),
          distributions: distributions.length,
          distributed: Math.round(distributions.reduce((s, d) => s + d.totalTips, 0) * 100) / 100,
          pending: distributions.filter(d => d.status === 'pending').length,
          approved: distributions.filter(d => d.status === 'approved').length,
          paid: distributions.filter(d => d.status === 'paid').length,
        },
      })
    }

    const where: Record<string, unknown> = {}
    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')
      where.date = { gte: start, lte: end }
    }
    if (staffId) where.staffId = staffId
    if (status) where.status = status

    const distributions = await db.tipDistribution.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    const stats = {
      total: distributions.length,
      pending: distributions.filter(d => d.status === 'pending').length,
      approved: distributions.filter(d => d.status === 'approved').length,
      paid: distributions.filter(d => d.status === 'paid').length,
      totalAmount: Math.round(distributions.reduce((s, d) => s + d.totalTips, 0) * 100) / 100,
      byRole: distributions.reduce((acc, d) => {
        if (!acc[d.role]) acc[d.role] = { count: 0, tips: 0 }
        acc[d.role].count++
        acc[d.role].tips += d.totalTips
        return acc
      }, {} as Record<string, { count: number; tips: number }>),
    }

    return NextResponse.json({ ok: true, count: distributions.length, stats, distributions })
  } catch (error) {
    console.error('[tips] GET napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST — distribute tips for a date
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, poolType = 'individual' } = body

    if (!date) return NextResponse.json({ ok: false, error: 'date je obvezen' }, { status: 400 })

    const start = new Date(date + 'T00:00:00')
    const end = new Date(date + 'T23:59:59')

    // Preveri če že obstajajo distribucije
    const existing = await db.tipDistribution.findFirst({
      where: { date: { gte: start, lte: end } },
    })
    if (existing) {
      return NextResponse.json({
        ok: false,
        error: `Tips za ${date} so že distribuirani. Uporabi PATCH za approval.`,
      }, { status: 409 })
    }

    // Pridobi vse paid orders z tips za ta dan
    const orders = await db.order.findMany({
      where: { paidAt: { gte: start, lte: end }, status: 'paid', tip: { gt: 0 } },
      select: { tip: true, serverName: true, total: true },
    })

    const totalTips = orders.reduce((s, o) => s + o.tip, 0)
    if (totalTips <= 0) {
      return NextResponse.json({ ok: false, error: `Ni tips za ${date}` }, { status: 400 })
    }

    // Pridobi aktivno osebje z shifts za ta dan (completed ali active)
    const shifts = await db.shift.findMany({
      where: { date: { gte: start, lte: end }, status: { in: ['completed', 'active'] } },
      include: { staff: true },
    })

    if (shifts.length === 0) {
      return NextResponse.json({ ok: false, error: `Ni aktivnih izmen za ${date}` }, { status: 400 })
    }

    // Calculate hours per staff
    const staffHours: Record<string, { staffId: string; name: string; role: string; hours: number; rate: number }> = {}
    for (const shift of shifts) {
      const endTime = shift.endTime || new Date() // fallback za active shifts
      const hours = (endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
      const netHours = Math.max(0, hours - shift.breakMinutes / 60)
      const key = shift.staffId
      if (!staffHours[key]) {
        staffHours[key] = {
          staffId: shift.staffId,
          name: `${shift.staff.firstName} ${shift.staff.lastName}`,
          role: shift.staff.role,
          hours: 0,
          rate: shift.staff.hourlyRate,
        }
      }
      staffHours[key].hours += netHours
    }

    const staffList = Object.values(staffHours)
    const totalHours = staffList.reduce((s, st) => s + st.hours, 0)

    // Tips by server (za individual pool)
    const tipsByServer: Record<string, number> = {}
    for (const o of orders) {
      const name = o.serverName || ''
      if (!tipsByServer[name]) tipsByServer[name] = 0
      tipsByServer[name] += o.tip
    }

    const distributions: { staffId: string; staffName: string; role: string; tipsFromOrders: number; tipsFromPool: number; totalTips: number; poolType: string; poolShare: number; hoursWorked: number; date: Date; status: string }[] = []

    for (const st of staffList) {
      let tipsFromOrders = 0
      let tipsFromPool = 0
      let poolShare = 0

      if (poolType === 'individual') {
        // Vsak obdrži svoje tips (flexible matching: full name, firstName, ali partial)
        const fullName = st.name
        const firstName = fullName.split(' ')[0]
        // Try exact match, then firstName match, then partial
        tipsFromOrders = tipsByServer[fullName] || 0
        if (tipsFromOrders === 0) {
          // Try matching by firstName (npr. "Maja K." → "Maja")
          for (const [serverName, tips] of Object.entries(tipsByServer)) {
            if (serverName.startsWith(firstName) || firstName.startsWith(serverName.split(' ')[0])) {
              tipsFromOrders = tips
              break
            }
          }
        }
        poolShare = 0
      }

      if (poolType === 'shared') {
        // Samo front-of-house (servers, bartenders) delijo
        const isFOH = st.role === 'server' || st.role === 'bartender'
        if (isFOH) {
          // Razdeli glede na ure
          const fohHours = staffList.filter(s => s.role === 'server' || s.role === 'bartender').reduce((s, x) => s + x.hours, 0)
          poolShare = fohHours > 0 ? Math.round((st.hours / fohHours) * 10000) / 100 : 0
          tipsFromPool = fohHours > 0 ? (totalTips * st.hours) / fohHours : 0
        }
        tipsFromOrders = 0
      }

      if (poolType === 'pooled') {
        // Vsi delijo glede na ure
        poolShare = totalHours > 0 ? Math.round((st.hours / totalHours) * 10000) / 100 : 0
        tipsFromPool = totalHours > 0 ? (totalTips * st.hours) / totalHours : 0
        tipsFromOrders = 0
      }

      const total = tipsFromOrders + tipsFromPool
      if (total > 0) {
        distributions.push({
          staffId: st.staffId,
          staffName: st.name,
          role: st.role,
          tipsFromOrders: Math.round(tipsFromOrders * 100) / 100,
          tipsFromPool: Math.round(tipsFromPool * 100) / 100,
          totalTips: Math.round(total * 100) / 100,
          poolType,
          poolShare,
          hoursWorked: Math.round(st.hours * 10) / 10,
          date: start,
          status: 'pending',
        })
      }
    }

    // Ustvari vse distribucije
    const created = await db.tipDistribution.createMany({
      data: distributions,
    })

    console.log(`[tips] ✓ ${date} | poolType=${poolType} | total=€${totalTips.toFixed(2)} | ${created.count} distributions | ${distributions.reduce((s, d) => s + d.totalTips, 0).toFixed(2)} distributed`)

    return NextResponse.json({
      ok: true,
      message: `Tips za ${date} distribuirani (${poolType})`,
      poolType,
      totalTips: Math.round(totalTips * 100) / 100,
      distributed: created.count,
      distributions,
    }, { status: 201 })
  } catch (error) {
    console.error('[tips] POST napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — approve / pay
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, approvedBy } = body

    if (!id || !action) return NextResponse.json({ ok: false, error: 'id in action sta obvezna' }, { status: 400 })

    const validActions = ['approve', 'pay', 'reject']
    if (!validActions.includes(action)) {
      return NextResponse.json({ ok: false, error: `Neveljven action. Dovoljeni: ${validActions.join(', ')}` }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (action === 'approve') {
      updateData.status = 'approved'
      updateData.approvedBy = approvedBy || null
      updateData.approvedAt = new Date()
    }
    if (action === 'pay') {
      updateData.status = 'paid'
      updateData.paidAt = new Date()
    }
    if (action === 'reject') {
      updateData.status = 'pending'
      updateData.approvedBy = null
      updateData.approvedAt = null
    }

    const dist = await db.tipDistribution.update({
      where: { id },
      data: updateData,
    })

    console.log(`[tips] ✓ ${dist.staffName} | action=${action} | €${dist.totalTips}`)

    return NextResponse.json({
      ok: true,
      message: `Tip ${action}d`,
      distribution: dist,
    })
  } catch (error) {
    console.error('[tips] PATCH napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
