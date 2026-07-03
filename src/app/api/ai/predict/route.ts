import { NextResponse } from 'next/server'
import { generateMockSalesData, generatePredictions } from '@/lib/ai-prediction'
export async function GET() {
  const salesData = generateMockSalesData()
  const predictions = generatePredictions(salesData)
  const reorderItems = predictions.filter(p => p.reorderNeeded).sort((a, b) => { const o = { critical: 0, high: 1, medium: 2, low: 3, none: 4 }; return o[a.reorderUrgency] - o[b.reorderUrgency] })
  return NextResponse.json({ predictions, reorderList: { items: reorderItems, totalCost: reorderItems.reduce((s, i) => s + i.estimatedCost, 0), criticalCount: reorderItems.filter(i => i.reorderUrgency === 'critical').length }, stats: { totalItems: predictions.length, criticalCount: predictions.filter(p => p.reorderUrgency === 'critical').length, avgConfidence: Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length), totalReorderCost: reorderItems.reduce((s, i) => s + i.estimatedCost, 0) } })
}
