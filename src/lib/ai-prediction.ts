/**
 * AI Prediction Engine — predikcija povpraševanja in samodejne dobavnice
 *
 * Algoritem:
 * 1. Analiza zgodovine prodaje (mock data za demo)
 * 2. Trend detection (rast/padec/sezona)
 * 3. Predikcija za naslednji teden
 * 4. Reorder suggestions (kdaj in koliko naročiti)
 *
 * V produkciji: zamenjaj z realnimi podatki iz baze + ML model (TensorFlow.js)
 */

export interface SalesRecord {
  itemId: string
  itemName: string
  category: string
  dailySales: number[] // zadnjih 7 dni
  currentStock: number
  minStock: number
  unit: string
  supplier?: string | null
  purchasePrice: number
}

export interface Prediction {
  itemId: string
  itemName: string
  category: string
  predictedDemand: number // predvidena prodaja naslednji teden
  confidence: number // 0-100%
  trend: 'rising' | 'falling' | 'stable' | 'seasonal'
  trendPercent: number
  currentStock: number
  daysUntilStockout: number
  reorderNeeded: boolean
  reorderQuantity: number
  reorderUrgency: 'critical' | 'high' | 'medium' | 'low' | 'none'
  estimatedCost: number
  supplier: string | null
  reasoning: string
}

/**
 * Mock prodajni podatki za demo (v produkciji: iz baze)
 */
export function generateMockSalesData(): SalesRecord[] {
  const items = [
    { id: '1', name: 'Pizza Margherita', category: 'Pice', sales: [42, 38, 45, 52, 48, 65, 58], stock: 15, minStock: 20, unit: 'kos', supplier: 'Metro', price: 2.5 },
    { id: '2', name: 'Čevapi s kajmakom', category: 'Mesne jedi', sales: [35, 32, 40, 38, 42, 55, 48], stock: 8, minStock: 15, unit: 'kos', supplier: 'Jata', price: 4.0 },
    { id: '3', name: 'Laško Zlatorog (0.5l)', category: 'Pivo', sales: [88, 75, 92, 105, 98, 145, 128], stock: 24, minStock: 48, unit: 'kos', supplier: 'Laško', price: 1.0 },
    { id: '4', name: 'Coca Cola (0.33l)', category: 'Brezalkoholne', sales: [65, 58, 72, 68, 75, 95, 82], stock: 48, minStock: 48, unit: 'kos', supplier: 'Coca-Cola', price: 0.8 },
    { id: '5', name: 'Espresso', category: 'Tople pijače', sales: [120, 115, 135, 142, 128, 165, 148], stock: 100, minStock: 100, unit: 'kos', supplier: 'Barcaffe', price: 0.3 },
    { id: '6', name: 'Tiramisu', category: 'Sladice', sales: [18, 15, 22, 20, 25, 32, 28], stock: 5, minStock: 10, unit: 'kos', supplier: 'Metro', price: 2.0 },
    { id: '7', name: 'Becka kava', category: 'Tople pijače', sales: [85, 78, 92, 88, 95, 120, 105], stock: 100, minStock: 100, unit: 'kos', supplier: 'Barcaffe', price: 0.5 },
    { id: '8', name: 'Burger Noro Lep', category: 'Mesne jedi', sales: [28, 25, 32, 30, 35, 48, 42], stock: 3, minStock: 10, unit: 'kos', supplier: 'Jata', price: 3.5 },
    { id: '9', name: 'Rižota s sadeži', category: 'Testenine', sales: [12, 10, 15, 14, 18, 22, 19], stock: 8, minStock: 5, unit: 'kos', supplier: 'Metro', price: 4.0 },
    { id: '10', name: 'Voda Radenska (0.5l)', category: 'Brezalkoholne', sales: [55, 48, 62, 58, 65, 82, 72], stock: 36, minStock: 48, unit: 'kos', supplier: 'Radenska', price: 0.4 },
  ]

  return items.map(i => ({
    itemId: i.id,
    itemName: i.name,
    category: i.category,
    dailySales: i.sales,
    currentStock: i.stock,
    minStock: i.minStock,
    unit: i.unit,
    supplier: i.supplier,
    purchasePrice: i.price,
  }))
}

/**
 * Izračunaj trend (rast/padec/stabilen/sezonski)
 */
function detectTrend(sales: number[]): { trend: Prediction['trend']; percent: number } {
  const avgFirst3 = (sales[0] + sales[1] + sales[2]) / 3
  const avgLast3 = (sales[4] + sales[5] + sales[6]) / 3
  const percent = ((avgLast3 - avgFirst3) / avgFirst3) * 100

  // Vikend spike (petek=4, sobota=5, nedelja=6)
  const weekday = (sales[0] + sales[1] + sales[2] + sales[3]) / 4
  const weekend = (sales[4] + sales[5] + sales[6]) / 3
  const weekendSpike = ((weekend - weekday) / weekday) * 100

  if (weekendSpike > 25) return { trend: 'seasonal', percent: weekendSpike }
  if (percent > 10) return { trend: 'rising', percent }
  if (percent < -10) return { trend: 'falling', percent }
  return { trend: 'stable', percent }
}

/**
 * Predvidi povpraševanje za naslednji teden
 * Preprost model: povprečje + trend + sezonskost
 */
function predictDemand(sales: number[], trend: Prediction['trend']): { demand: number; confidence: number } {
  const avg = sales.reduce((a, b) => a + b, 0) / sales.length
  const weekday = (sales[0] + sales[1] + sales[2] + sales[3]) / 4
  const weekend = (sales[4] + sales[5] + sales[6]) / 3

  let predictedWeek: number[]

  if (trend === 'seasonal') {
    // Sezonski: pon-čet = weekday avg, pet-ned = weekend avg
    predictedWeek = [weekday, weekday, weekday, weekday, weekend, weekend, weekend]
  } else if (trend === 'rising') {
    // Rast: +5% na dan
    predictedWeek = sales.map((_, i) => Math.round(avg * (1 + 0.05 * (i + 1) / 7)))
  } else if (trend === 'falling') {
    // Padec: -5% na dan
    predictedWeek = sales.map((_, i) => Math.round(avg * (1 - 0.05 * (i + 1) / 7)))
  } else {
    // Stabilen: povprečje + variacija
    predictedWeek = sales.map(s => Math.round(avg * 0.7 + s * 0.3))
  }

  const demand = predictedWeek.reduce((a, b) => a + b, 0)

  // Zaupanje: višja variansa = nižje zaupanje
  const variance = sales.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / sales.length
  const cv = Math.sqrt(variance) / avg // coefficient of variation
  const confidence = Math.max(50, Math.min(95, 100 - cv * 100))

  return { demand: Math.round(demand), confidence: Math.round(confidence) }
}

/**
 * Glavna funkcija — generiraj predikcije za vse artikle
 */
export function generatePredictions(salesData: SalesRecord[]): Prediction[] {
  return salesData.map(item => {
    const { trend, percent } = detectTrend(item.dailySales)
    const { demand, confidence } = predictDemand(item.dailySales, trend)

    const dailyAvg = demand / 7
    const daysUntilStockout = item.currentStock > 0 ? Math.floor(item.currentStock / dailyAvg) : 0

    // Reorder needed?
    const reorderNeeded = item.currentStock <= item.minStock || daysUntilStockout <= 3

    // Reorder quantity: pokrij naslednji teden + varnostna zaloga (30%)
    const safetyStock = Math.round(demand * 0.3)
    const reorderQuantity = reorderNeeded ? Math.max(demand + safetyStock - item.currentStock, item.minStock) : 0

    // Urgency
    let urgency: Prediction['reorderUrgency'] = 'none'
    if (daysUntilStockout === 0) urgency = 'critical'
    else if (daysUntilStockout <= 1) urgency = 'critical'
    else if (daysUntilStockout <= 2) urgency = 'high'
    else if (daysUntilStockout <= 3) urgency = 'medium'
    else if (reorderNeeded) urgency = 'low'

    // Reasoning
    let reasoning = ''
    if (urgency === 'critical') {
      reasoning = `⚠️ Zaloga bo izčrpana v ${daysUntilStockout} dneh! Trenutna zaloga ${item.currentStock} ${item.unit} ne zadošča za predvideno povpraševanje ${demand} ${item.unit}/teden. Naroči ${reorderQuantity} ${item.unit} pri ${item.supplier || 'dobavitelju'}.`
    } else if (urgency === 'high') {
      reasoning = `Zaloga bo izčrpana v ${daysUntilStockout} dneh. Priporočamo naročilo ${reorderQuantity} ${item.unit} v naslednjih 24 urah.`
    } else if (urgency === 'medium') {
      reasoning = `Zaloga bo izčrpana v ${daysUntilStockout} dneh. Načrtuj naročilo ${reorderQuantity} ${item.unit} teden dni.`
    } else if (trend === 'rising') {
      reasoning = `📈 Prodaja raste (+${percent.toFixed(0)}%). Predvideno povpraševanje: ${demand} ${item.unit}/teden. Zaloga zadostuje še ${daysUntilStockout} dni.`
    } else if (trend === 'seasonal') {
      reasoning = `🎯 Sezonski vzorec: vikend +${percent.toFixed(0)}% nad delavniki. Predvideno povpraševanje: ${demand} ${item.unit}/teden.`
    } else if (trend === 'falling') {
      reasoning = `📉 Prodaja pada (${percent.toFixed(0)}%). Predvideno povpraševanje: ${demand} ${item.unit}/teden. Zaloga zadostuje ${daysUntilStockout} dni.`
    } else {
      reasoning = `Stabilna prodaja. Predvideno povpraševanje: ${demand} ${item.unit}/teden. Zaloga zadostuje ${daysUntilStockout} dni.`
    }

    return {
      itemId: item.itemId,
      itemName: item.itemName,
      category: item.category,
      predictedDemand: demand,
      confidence,
      trend,
      trendPercent: percent,
      currentStock: item.currentStock,
      daysUntilStockout,
      reorderNeeded,
      reorderQuantity,
      reorderUrgency: urgency,
      estimatedCost: reorderQuantity * item.purchasePrice,
      supplier: item.supplier || null,
      reasoning,
    }
  })
}

/**
 * Generiraj samodejno dobavnico (reorder list)
 */
export function generateReorderList(predictions: Prediction[]): {
  items: Prediction[]
  totalCost: number
  criticalCount: number
  highCount: number
} {
  const reorderItems = predictions
    .filter(p => p.reorderNeeded)
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 }
      return urgencyOrder[a.reorderUrgency] - urgencyOrder[b.reorderUrgency]
    })

  const totalCost = reorderItems.reduce((sum, i) => sum + i.estimatedCost, 0)
  const criticalCount = reorderItems.filter(i => i.reorderUrgency === 'critical').length
  const highCount = reorderItems.filter(i => i.reorderUrgency === 'high').length

  return { items: reorderItems, totalCost, criticalCount, highCount }
}
