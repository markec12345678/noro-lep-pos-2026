import { NextResponse } from 'next/server'
import { generatePredictions, generateMockSalesData } from '@/lib/ai-prediction'
import { generateInitialOrders, calculateDeliveryStats } from '@/lib/delivery'

/**
 * GET /api/dashboard/overview
 * Unified Command Center — agregira vse 7 sisteme v en overview
 *
 * Sistemi:
 * 1. POS — današnji promet, št. računov, povr. račun
 * 2. KDS — naročila po statusu (nova, v pripravi, pripravljena)
 * 3. Mize — zasedenost, prostih, rezerviranih
 * 4. Dostava — aktivna naročila, bruto/neto
 * 5. AI — kritična opozorila, predikcije
 * 6. Plačila — promet po metodah
 * 7. Zaloge — nizka zaloga, vrednost
 */
export async function GET() {
  // 1. POS stats (mock za demo)
  const posStats = {
    revenueToday: 10270 + Math.floor(Math.random() * 500),
    ordersToday: 633 + Math.floor(Math.random() * 10),
    avgCheck: 16.22,
    hourlyTrend: [120, 280, 890, 1240, 680, 320, 410, 720, 1380, 1680, 1420, 890, 420],
    peakHour: '19h',
    revenueChange: '+18%',
  }

  // 2. KDS stats
  const kdsStats = {
    newOrders: 3,
    preparing: 2,
    ready: 1,
    avgPrepTime: 8.4,
    longestWaiting: 14, // minutes
  }

  // 3. Tables stats
  const tablesStats = {
    total: 12,
    occupied: 6,
    free: 3,
    reserved: 2,
    payment: 1,
    occupancyRate: 58, // %
    avgTableTime: 42, // minutes
  }

  // 4. Delivery stats
  const deliveryOrders = generateInitialOrders(5)
  const deliveryStats = calculateDeliveryStats(deliveryOrders)

  // 5. AI stats
  const salesData = generateMockSalesData()
  const predictions = generatePredictions(salesData)
  const aiStats = {
    criticalAlerts: predictions.filter(p => p.reorderUrgency === 'critical').length,
    highAlerts: predictions.filter(p => p.reorderUrgency === 'high').length,
    avgConfidence: Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length),
    topReorder: predictions
      .filter(p => p.reorderNeeded)
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
      .slice(0, 3)
      .map(p => ({ name: p.itemName, quantity: p.reorderQuantity, cost: p.estimatedCost, urgency: p.reorderUrgency })),
  }

  // 6. Payment stats (mock)
  const paymentStats = {
    totalToday: posStats.revenueToday,
    byMethod: [
      { method: 'card', label: 'Kartica', amount: Math.round(posStats.revenueToday * 0.45), count: Math.round(posStats.ordersToday * 0.45), color: '#3b82f6' },
      { method: 'apple_pay', label: 'Apple Pay', amount: Math.round(posStats.revenueToday * 0.20), count: Math.round(posStats.ordersToday * 0.20), color: '#000000' },
      { method: 'google_pay', label: 'Google Pay', amount: Math.round(posStats.revenueToday * 0.15), count: Math.round(posStats.ordersToday * 0.15), color: '#4285f4' },
      { method: 'cash', label: 'Gotovina', amount: Math.round(posStats.revenueToday * 0.12), count: Math.round(posStats.ordersToday * 0.12), color: '#f59e0b' },
      { method: 'contactless', label: 'NFC', amount: Math.round(posStats.revenueToday * 0.08), count: Math.round(posStats.ordersToday * 0.08), color: '#10b981' },
    ],
  }

  // 7. Inventory stats
  const inventoryStats = {
    totalItems: 232,
    lowStock: 232, // vsi z zalogo 0 v demo
    totalValue: 0,
    categories: 19,
  }

  // Overall system health
  const systemHealth = {
    score: 87, // 0-100
    status: 'healthy',
    activeModules: 7,
    uptime: '99.9%',
    lastSync: Date.now(),
    alerts: aiStats.criticalAlerts + deliveryStats.newCount,
  }

  return NextResponse.json({
    pos: posStats,
    kds: kdsStats,
    tables: tablesStats,
    delivery: deliveryStats,
    ai: aiStats,
    payments: paymentStats,
    inventory: inventoryStats,
    systemHealth,
    timestamp: Date.now(),
    note: 'Unified Command Center — vsi 7 sistemi v realnem času na enem zaslonu.',
  })
}
