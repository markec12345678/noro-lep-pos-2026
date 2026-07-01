import { NextResponse } from 'next/server'
import { generateMockSalesData, generatePredictions, generateReorderList } from '@/lib/ai-prediction'

/**
 * GET /api/ai/predict
 * Vrne AI predikcije za vse artikle + samodejno dobavnico
 *
 * V produkciji: zamenjaj generateMockSalesData z realnimi podatki iz baze
 */
export async function GET() {
  const salesData = generateMockSalesData()
  const predictions = generatePredictions(salesData)
  const reorderList = generateReorderList(predictions)

  // Statistika
  const totalItems = predictions.length
  const criticalCount = predictions.filter(p => p.reorderUrgency === 'critical').length
  const highCount = predictions.filter(p => p.reorderUrgency === 'high').length
  const risingCount = predictions.filter(p => p.trend === 'rising').length
  const seasonalCount = predictions.filter(p => p.trend === 'seasonal').length
  const avgConfidence = Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)

  return NextResponse.json({
    predictions,
    reorderList,
    stats: {
      totalItems,
      criticalCount,
      highCount,
      risingCount,
      seasonalCount,
      avgConfidence,
      totalReorderCost: reorderList.totalCost,
      reorderItemsCount: reorderList.items.length,
    },
    aiNote: 'AI predikcija temelji na analizi 7-dnevne prodaje, trend detection in sezonskem modelu. V produkciji: TensorFlow.js z realnimi podatki.',
  })
}
