export interface SalesRecord { itemId: string; itemName: string; category: string; dailySales: number[]; currentStock: number; minStock: number; unit: string; supplier?: string | null; purchasePrice: number }
export interface Prediction { itemId: string; itemName: string; category: string; predictedDemand: number; confidence: number; trend: 'rising' | 'falling' | 'stable' | 'seasonal'; trendPercent: number; currentStock: number; daysUntilStockout: number; reorderNeeded: boolean; reorderQuantity: number; reorderUrgency: 'critical' | 'high' | 'medium' | 'low' | 'none'; estimatedCost: number; supplier: string | null; reasoning: string }

export function generateMockSalesData(): SalesRecord[] {
  return [
    { id: '1', name: 'Pizza Margherita', category: 'Pice', dailySales: [42, 38, 45, 52, 48, 65, 58], stock: 15, minStock: 20, unit: 'kos', supplier: 'Metro', price: 2.5 },
    { id: '2', name: 'Čevapi s kajmakom', category: 'Mesne jedi', dailySales: [35, 32, 40, 38, 42, 55, 48], stock: 8, minStock: 15, unit: 'kos', supplier: 'Jata', price: 4.0 },
    { id: '3', name: 'Laško Zlatorog', category: 'Pivo', dailySales: [88, 75, 92, 105, 98, 145, 128], stock: 24, minStock: 48, unit: 'kos', supplier: 'Laško', price: 1.0 },
    { id: '4', name: 'Coca Cola', category: 'Brezalkoholne', dailySales: [65, 58, 72, 68, 75, 95, 82], stock: 48, minStock: 48, unit: 'kos', supplier: 'Coca-Cola', price: 0.8 },
    { id: '5', name: 'Espresso', category: 'Tople pijače', dailySales: [120, 115, 135, 142, 128, 165, 148], stock: 100, minStock: 100, unit: 'kos', supplier: 'Barcaffe', price: 0.3 },
    { id: '6', name: 'Tiramisu', category: 'Sladice', dailySales: [18, 15, 22, 20, 25, 32, 28], stock: 5, minStock: 10, unit: 'kos', supplier: 'Metro', price: 2.0 },
    { id: '7', name: 'Burger Noro Lep', category: 'Mesne jedi', dailySales: [28, 25, 32, 30, 35, 48, 42], stock: 3, minStock: 10, unit: 'kos', supplier: 'Jata', price: 3.5 },
    { id: '8', name: 'Becka kava', category: 'Tople pijače', dailySales: [85, 78, 92, 88, 95, 120, 105], stock: 100, minStock: 100, unit: 'kos', supplier: 'Barcaffe', price: 0.5 },
    { id: '9', name: 'Rižota s sadeži', category: 'Testenine', dailySales: [12, 10, 15, 14, 18, 22, 19], stock: 8, minStock: 5, unit: 'kos', supplier: 'Metro', price: 4.0 },
    { id: '10', name: 'Voda Radenska', category: 'Brezalkoholne', dailySales: [55, 48, 62, 58, 65, 82, 72], stock: 36, minStock: 48, unit: 'kos', supplier: 'Radenska', price: 0.4 },
  ].map(i => ({ itemId: i.id, itemName: i.name, category: i.category, dailySales: i.dailySales, currentStock: i.stock, minStock: i.minStock, unit: i.unit, supplier: i.supplier, purchasePrice: i.price }))
}

export function generatePredictions(salesData: SalesRecord[]): Prediction[] {
  return salesData.map(item => {
    const avgFirst3 = (item.dailySales[0] + item.dailySales[1] + item.dailySales[2]) / 3
    const avgLast3 = (item.dailySales[4] + item.dailySales[5] + item.dailySales[6]) / 3
    const weekday = (item.dailySales[0] + item.dailySales[1] + item.dailySales[2] + item.dailySales[3]) / 4
    const weekend = (item.dailySales[4] + item.dailySales[5] + item.dailySales[6]) / 3
    const weekendSpike = ((weekend - weekday) / weekday) * 100
    const percent = ((avgLast3 - avgFirst3) / avgFirst3) * 100
    const trend = weekendSpike > 25 ? 'seasonal' : percent > 10 ? 'rising' : percent < -10 ? 'falling' : 'stable'
    const avg = item.dailySales.reduce((a, b) => a + b, 0) / 7
    const demand = Math.round(trend === 'seasonal' ? (weekday * 4 + weekend * 3) : avg * 7)
    const dailyAvg = demand / 7
    const daysUntilStockout = item.currentStock > 0 ? Math.floor(item.currentStock / dailyAvg) : 0
    const reorderNeeded = item.currentStock <= item.minStock || daysUntilStockout <= 3
    const reorderQuantity = reorderNeeded ? Math.max(Math.round(demand * 1.3 - item.currentStock), item.minStock) : 0
    const urgency = daysUntilStockout <= 1 ? 'critical' : daysUntilStockout <= 2 ? 'high' : daysUntilStockout <= 3 ? 'medium' : reorderNeeded ? 'low' : 'none'
    const cv = Math.sqrt(item.dailySales.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / 7) / avg
    const confidence = Math.max(50, Math.min(95, Math.round(100 - cv * 100)))
    return { itemId: item.itemId, itemName: item.itemName, category: item.category, predictedDemand: demand, confidence, trend, trendPercent: weekendSpike > 25 ? weekendSpike : percent, currentStock: item.currentStock, daysUntilStockout, reorderNeeded, reorderQuantity, reorderUrgency: urgency, estimatedCost: reorderQuantity * item.purchasePrice, supplier: item.supplier || null, reasoning: urgency === 'critical' ? `Zaloga bo izčrpana v ${daysUntilStockout} dneh! Naroči ${reorderQuantity} ${item.unit}.` : trend === 'seasonal' ? `Sezonski vzorec: vikend +${weekendSpike.toFixed(0)}%. Predvideno: ${demand} ${item.unit}/teden.` : `Stabilna prodaja. Predvideno: ${demand} ${item.unit}/teden. Zaloga ${daysUntilStockout} dni.` }
  })
}
