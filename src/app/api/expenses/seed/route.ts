import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Expense Categories Seed — ustvari standardne kategorije
 * POST /api/expenses/seed
 */
export async function POST() {
  try {
    const existing = await db.expenseCategory.count()
    if (existing > 0) {
      return NextResponse.json({ ok: true, message: `Kategorije že obstajajo (${existing})`, count: existing })
    }

    const categories = [
      { name: 'Najemnina', type: 'fixed', icon: '🏠', color: 'bg-slate-500', sortOrder: 1 },
      { name: 'Komunalne (elektrika, voda, plin)', type: 'variable', icon: '⚡', color: 'bg-amber-500', sortOrder: 2 },
      { name: 'Telefon in internet', type: 'fixed', icon: '📱', color: 'bg-cyan-500', sortOrder: 3 },
      { name: 'Plače in prispevki', type: 'semi_variable', icon: '👥', color: 'bg-emerald-500', sortOrder: 4 },
      { name: 'Dobavne blago (COGS)', type: 'variable', icon: '📦', color: 'bg-orange-500', sortOrder: 5 },
      { name: 'Marketing in oglaševanje', type: 'variable', icon: '📢', color: 'bg-purple-500', sortOrder: 6 },
      { name: 'Vzdrževanje opreme', type: 'variable', icon: '🔧', color: 'bg-blue-500', sortOrder: 7 },
      { name: 'Čistila in higiena', type: 'variable', icon: '🧽', color: 'bg-teal-500', sortOrder: 8 },
      { name: 'Zavarovanje', type: 'fixed', icon: '🛡️', color: 'bg-indigo-500', sortOrder: 9 },
      { name: 'Bančne provizije', type: 'variable', icon: '🏦', color: 'bg-rose-500', sortOrder: 10 },
      { name: 'Strokovne storitve (računovodja)', type: 'fixed', icon: '💼', color: 'bg-violet-500', sortOrder: 11 },
      { name: 'Dostavne provizije', type: 'variable', icon: '🛵', color: 'bg-pink-500', sortOrder: 12 },
      { name: 'Licence in dovoljenja', type: 'fixed', icon: '📜', color: 'bg-stone-500', sortOrder: 13 },
      { name: 'Izobraževanje in usposabljanje', type: 'variable', icon: '🎓', color: 'bg-lime-500', sortOrder: 14 },
      { name: 'Ostali stroški', type: 'variable', icon: '📋', color: 'bg-gray-500', sortOrder: 15 },
    ]

    const created = await db.expenseCategory.createMany({ data: categories })

    console.log(`[expenses/seed] ✓ ${created.count} kategorij ustvarjenih`)

    return NextResponse.json({
      ok: true,
      message: `${created.count} kategorij stroškov ustvarjenih`,
      count: created.count,
      categories,
    }, { status: 201 })
  } catch (error) {
    console.error('[expenses/seed] napaka:', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
