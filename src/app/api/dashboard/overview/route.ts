import { NextResponse } from 'next/server'
import { generatePredictions, generateMockSalesData } from '@/lib/ai-prediction'
import { generateInitialOrders, calculateDeliveryStats } from '@/lib/delivery'
export async function GET() {
  const predictions = generatePredictions(generateMockSalesData())
  const delivery = calculateDeliveryStats(generateInitialOrders(5))
  return NextResponse.json({
    pos: { revenueToday: 10270, ordersToday: 633, avgCheck: 16.22, hourlyTrend: [120, 280, 890, 1240, 680, 320, 410, 720, 1380, 1680, 1420, 890, 420], peakHour: '19h', revenueChange: '+18%' },
    kds: { newOrders: 3, preparing: 2, ready: 1, avgPrepTime: 8.4, longestWaiting: 14 },
    tables: { total: 12, occupied: 6, free: 3, reserved: 2, payment: 1, occupancyRate: 58, avgTableTime: 42 },
    delivery,
    ai: { criticalAlerts: predictions.filter(p => p.reorderUrgency === 'critical').length, avgConfidence: Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length) },
    payments: { totalToday: 10270, byMethod: [{ method: 'card', label: 'Kartica', amount: 4622, color: '#3b82f6' }, { method: 'apple_pay', label: 'Apple Pay', amount: 2054, color: '#000000' }, { method: 'cash', label: 'Gotovina', amount: 1232, color: '#f59e0b' }] },
    inventory: { totalItems: 232, lowStock: 232, categories: 19 },
    systemHealth: { score: 87, activeModules: 7, uptime: '99.9%', alerts: predictions.filter(p => p.reorderUrgency === 'critical').length },
  })
}
