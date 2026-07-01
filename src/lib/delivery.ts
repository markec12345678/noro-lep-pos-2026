/**
 * Delivery Integration — Wolt, Uber Eats, Glovo, Lastmin
 *
 * Simulira prejemanje naročil iz dostavnih platform.
 * V produkciji: poveži z realnimi API-ji (Wolt Partner API, Uber Eats API).
 */

export interface DeliveryOrder {
  id: string
  platform: 'wolt' | 'uber_eats' | 'glovo' | 'lastmin' | 'qr_direct'
  platformLabel: string
  platformColor: string
  platformIcon: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  items: { name: string; qty: number; price: number }[]
  subtotal: number
  deliveryFee: number
  commission: number // provizija platforme
  total: number
  status: 'new' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'rejected'
  estimatedPrepTime: number // minute
  estimatedDeliveryTime: number // minute
  receivedAt: number
  notes?: string
}

export const PLATFORMS = {
  wolt: { label: 'Wolt', color: 'bg-cyan-500', icon: '🟦', commission: 0.12 },
  uber_eats: { label: 'Uber Eats', color: 'bg-black', icon: '🚗', commission: 0.15 },
  glovo: { label: 'Glovo', color: 'bg-yellow-500', icon: '🟡', commission: 0.10 },
  lastmin: { label: 'Lastmin', color: 'bg-emerald-500', icon: '⏱️', commission: 0.08 },
  qr_direct: { label: 'QR Naročilo', color: 'bg-purple-500', icon: '📱', commission: 0.0 },
} as const

const MENU_PRICES: Record<string, number> = {
  'Pizza Margherita': 11.0,
  'Pizza Capricciosa': 13.0,
  'Čevapi s kajmakom': 14.5,
  'Burger Noro Lep': 15.0,
  'Rižota s sadeži': 16.0,
  'Coca Cola (0.33l)': 2.5,
  'Laško Zlatorog (0.5l)': 3.0,
  'Tiramisu': 6.5,
  'Becka kava': 2.0,
  'Trški pršut': 8.5,
}

const ADDRESSES = [
  'Trubarjeva cesta 12, Ljubljana',
  'Slovenska cesta 45, Ljubljana',
  'Cankarjeva cesta 3, Ljubljana',
  'Trg republike 1, Ljubljana',
  'Kongresni trg 8, Ljubljana',
  'Miklošičeva cesta 20, Ljubljana',
  'Wolfova ulica 9, Ljubljana',
  'Čopova ulica 5, Ljubljana',
  'Vodnikov trg 2, Ljubljana',
  'Zoisova cesta 15, Ljubljana',
]

const CUSTOMER_NAMES = [
  'Marko K.', 'Ana Z.', 'Tomaž H.', 'Maja P.', 'Luka B.',
  'Eva M.', 'Jan K.', 'Nina R.', 'Nejc S.', 'Tina V.',
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomItems(): { name: string; qty: number; price: number }[] {
  const menuItems = Object.keys(MENU_PRICES)
  const count = Math.floor(Math.random() * 3) + 1
  const items: { name: string; qty: number; price: number }[] = []
  const used = new Set<string>()

  for (let i = 0; i < count; i++) {
    let name = randomItem(menuItems)
    while (used.has(name)) name = randomItem(menuItems)
    used.add(name)
    const qty = Math.floor(Math.random() * 3) + 1
    items.push({ name, qty, price: MENU_PRICES[name] })
  }

  return items
}

/**
 * Generiraj novo dostavno naročilo iz naključne platforme
 */
export function generateDeliveryOrder(): DeliveryOrder {
  const platformKeys = Object.keys(PLATFORMS) as Array<keyof typeof PLATFORMS>
  const platformKey = randomItem(platformKeys)
  const platform = PLATFORMS[platformKey]

  const items = randomItems()
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const deliveryFee = 1.5 + Math.random() * 2.5
  const commission = subtotal * platform.commission
  const total = subtotal + deliveryFee

  return {
    id: 'DEL-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
    platform: platformKey,
    platformLabel: platform.label,
    platformColor: platform.color,
    platformIcon: platform.icon,
    customerName: randomItem(CUSTOMER_NAMES),
    customerPhone: '+386 ' + Math.floor(30 + Math.random() * 40) + ' ' + Math.floor(100000 + Math.random() * 899999),
    deliveryAddress: randomItem(ADDRESSES),
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    total: Math.round(total * 100) / 100,
    status: 'new',
    estimatedPrepTime: 10 + Math.floor(Math.random() * 15),
    estimatedDeliveryTime: 20 + Math.floor(Math.random() * 20),
    receivedAt: Date.now(),
    notes: Math.random() > 0.7 ? randomItem(['Brez čebule', 'Pikantno', 'Klic na prihod', 'Pustite pred vrati']) : undefined,
  }
}

/**
 * Generiraj začetna naročila za demo
 */
export function generateInitialOrders(count = 5): DeliveryOrder[] {
  const orders: DeliveryOrder[] = []
  for (let i = 0; i < count; i++) {
    const order = generateDeliveryOrder()
    order.receivedAt = Date.now() - (i + 1) * 60000 // vsako minuto nazaj
    // Nekatera že v pripravi
    if (i >= 3) order.status = 'preparing'
    if (i >= 4) order.status = 'ready'
    orders.push(order)
  }
  return orders.reverse() // najnovejša najprej
}

/**
 * Statistika za dashboard
 */
export function calculateDeliveryStats(orders: DeliveryOrder[]) {
  const total = orders.length
  const newCount = orders.filter(o => o.status === 'new').length
  const preparing = orders.filter(o => o.status === 'preparing').length
  const ready = orders.filter(o => o.status === 'ready').length
  const delivered = orders.filter(o => o.status === 'delivered').length
  const totalRevenue = orders.filter(o => o.status !== 'rejected').reduce((sum, o) => sum + o.subtotal, 0)
  const totalCommission = orders.filter(o => o.status !== 'rejected').reduce((sum, o) => sum + o.commission, 0)
  const netRevenue = totalRevenue - totalCommission

  const byPlatform: Record<string, number> = {}
  for (const o of orders) {
    byPlatform[o.platformLabel] = (byPlatform[o.platformLabel] || 0) + 1
  }

  return {
    total,
    newCount,
    preparing,
    ready,
    delivered,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    byPlatform,
  }
}
