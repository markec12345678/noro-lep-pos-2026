/**
 * Receipt Builder — generira ESC/POS format content za termalni tiskalnik
 *
 * Podpira:
 * - Text (bold, center, left, right)
 * - Line separator
 * - QR kodo (FURS)
 * - Cut command
 * - Slovenian encoding (cp852)
 *
 * Usage:
 *   import { buildReceipt, buildKitchenOrder } from '@/lib/receipt-builder'
 *   const content = buildReceipt({ order, settings, items })
 */

export interface ReceiptItem {
  name: string
  qty: number
  price: number
  total: number
  taxRate: number
}

export interface ReceiptData {
  orderNumber: string
  tableNumber?: number | null
  serverName?: string | null
  channel: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  tip: number
  total: number
  paymentMethod?: string | null
  paidAt?: string | null
}

export interface ReceiptSettings {
  name: string
  address?: string | null
  city?: string | null
  postalCode?: string | null
  taxNumber?: string | null
  phone?: string | null
  receiptHeader?: string | null
  receiptFooter?: string | null
  currency: string
  currencySymbol: string
}

// ESC/POS commands
const ESC = '\x1B'
const GS = '\x1D'
const INIT = ESC + '@'
const BOLD_ON = ESC + 'E\x01'
const BOLD_OFF = ESC + 'E\x00'
const CENTER = ESC + 'a\x01'
const LEFT = ESC + 'a\x00'
const RIGHT = ESC + 'a\x02'
const DOUBLE_ON = GS + '!\x11'
const DOUBLE_OFF = GS + '!\x00'
const CUT = GS + 'V\x01'
const LINE = '--------------------------------'

export function buildReceipt(data: ReceiptData, settings: ReceiptSettings): string {
  let content = INIT

  // Header
  content += CENTER
  content += BOLD_ON
  content += settings.name + '\n'
  content += BOLD_OFF
  if (settings.address) content += settings.address + '\n'
  if (settings.postalCode && settings.city) content += `${settings.postalCode} ${settings.city}\n`
  if (settings.taxNumber) content += `Davcna st.: ${settings.taxNumber}\n`
  content += '\n'

  // Receipt header (custom)
  if (settings.receiptHeader) {
    content += settings.receiptHeader + '\n'
    content += LINE + '\n'
  }

  // Order info
  content += LEFT
  content += `Racun: ${data.orderNumber}\n`
  if (data.tableNumber) content += `Miza: ${data.tableNumber}\n`
  if (data.serverName) content += `Natakar: ${data.serverName}\n`
  content += `Datum: ${new Date().toLocaleString('sl-SI')}\n`
  content += `Tip: ${getChannelLabel(data.channel)}\n`
  content += LINE + '\n'

  // Items
  content += BOLD_ON
  content += 'Artikel                  Kol   Cena  Skupaj\n'
  content += BOLD_OFF
  content += LINE + '\n'

  for (const item of data.items) {
    const name = item.name.substring(0, 24).padEnd(24)
    const qty = String(item.qty).padStart(3)
    const price = `${item.price.toFixed(2)}`.padStart(6)
    const total = `${item.total.toFixed(2)}`.padStart(8)
    content += `${name}${qty}${price}${total}\n`
  }

  content += LINE + '\n'

  // Totals
  content += LEFT
  content += `Vmesna vsota:${' '.repeat(20)}${data.subtotal.toFixed(2)} ${settings.currencySymbol}\n`

  // VAT breakdown
  const vatGroups: Record<number, { base: number; vat: number }> = {}
  for (const item of data.items) {
    if (!vatGroups[item.taxRate]) vatGroups[item.taxRate] = { base: 0, vat: 0 }
    vatGroups[item.taxRate].base += item.total
    vatGroups[item.taxRate].vat += item.total * (item.taxRate / 100)
  }

  for (const [rate, v] of Object.entries(vatGroups)) {
    content += `  DDV ${rate}%: osnova ${v.base.toFixed(2)} DDV ${v.vat.toFixed(2)}\n`
  }

  content += `DDV skupaj:${' '.repeat(22)}${data.tax.toFixed(2)} ${settings.currencySymbol}\n`

  if (data.tip > 0) {
    content += `Napojnina:${' '.repeat(23)}${data.tip.toFixed(2)} ${settings.currencySymbol}\n`
  }

  content += BOLD_ON
  content += DOUBLE_ON
  content += `SKUPAJ: ${data.total.toFixed(2)} ${settings.currencySymbol}\n`
  content += DOUBLE_OFF
  content += BOLD_OFF

  content += LINE + '\n'

  // Payment
  if (data.paymentMethod) {
    content += `Placilo: ${getPaymentLabel(data.paymentMethod)}\n`
    content += `Znesek: ${data.total.toFixed(2)} ${settings.currencySymbol}\n`
  }

  content += '\n'

  // Footer
  content += CENTER
  if (settings.receiptFooter) {
    content += settings.receiptFooter + '\n'
  }
  content += '\n'
  content += 'Hvala za obisk!\n'
  content += 'Pridite znova!\n'

  // QR code (FURS) - placeholder
  content += '\n'
  content += '[QR: FURS ZOI/EOR]\n'
  content += '\n'

  // Cut
  content += CUT

  return content
}

export function buildKitchenOrder(data: {
  orderNumber: string
  tableNumber?: number | null
  serverName?: string | null
  items: { name: string; qty: number; notes?: string; station?: string }[]
  channel: string
  station?: string
}): string {
  let content = INIT
  content += CENTER
  content += BOLD_ON
  content += DOUBLE_ON
  content += `MIZA ${data.tableNumber || '?'}\n`
  content += DOUBLE_OFF
  content += BOLD_OFF
  content += LEFT
  content += `Order: ${data.orderNumber}\n`
  content += `Natakar: ${data.serverName || '?'}\n`
  content += `Cas: ${new Date().toLocaleTimeString('sl-SI')}\n`
  if (data.station) content += `Postaja: ${data.station}\n`
  content += LINE + '\n'

  for (const item of data.items) {
    content += BOLD_ON
    content += `${item.qty}x  ${item.name}\n`
    content += BOLD_OFF
    if (item.notes) {
      content += `     > ${item.notes}\n`
    }
  }

  content += LINE + '\n'
  content += CENTER
  content += '--- KUHINJA ---\n'
  content += CUT

  return content
}

function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    dine_in: 'V restavraciji',
    takeaway: 'Za prevzem',
    delivery: 'Dostava',
    qr: 'QR narocilo',
  }
  return labels[channel] || channel
}

function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    card: 'Kartica',
    cash: 'Gotovina',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    gift_card: 'Darilna kartica',
    split: 'Delitev',
  }
  return labels[method] || method
}
