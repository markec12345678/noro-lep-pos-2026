'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Trash2, Plus, Minus, Receipt, ChefHat, CheckCircle2,
  Clock, Flame, Snowflake, Wine, Cake, ShoppingCart, Wifi, WifiOff,
  Utensils, Zap, Printer, CreditCard, Euro, Percent, Loader2,
  Bell, ArrowRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { io, type Socket } from 'socket.io-client'

/* ============================================================
   TYPES
   ============================================================ */
interface MenuItemData {
  id: string
  name: string
  description: string | null
  price: number
  taxRate: number
  emoji: string | null
  vegan: boolean
  vegetarian: boolean
  spicy: boolean
  glutenFree: boolean
  allergens: string[]
  popular: boolean
  category: { id: string; name: string; slug: string; icon: string | null; color: string | null }
}

interface CartLine {
  item: MenuItemData
  qty: number
}

interface KdsTicket {
  id: string
  orderNumber: string
  tableNumber: string
  items: { name: string; qty: number; station: string }[]
  status: 'new' | 'preparing' | 'ready' | 'served'
  createdAt: number
}

type Station = 'hot' | 'cold' | 'bar' | 'dessert'

const ALLERGEN_LABELS: Record<string, string> = {
  G: 'Gluten', M: 'Mleko', J: 'Jajca', R: 'Raki', F: 'Ribe',
  SE: 'Sezam', ME: 'Mehkužci', N: 'Oreški', P: 'Arašidi',
  S: 'Soja', C: 'Zeler', MU: 'Gorčica', SU: 'Žvepleni', L: 'Volčji',
}

function detectStation(name: string): Station {
  const n = name.toLowerCase()
  if (n.match(/pivo|vino|spritz|cocktail|limonad|sok|cola|kava|espresso|cappuccino|whiskey|vodka|gin|rakija|pijač|wasser|beer|wine/)) return 'bar'
  if (n.match(/tort|sladica|tiramisu|panna|cheesecake|ice|sladoled|pudding|creme|čokolad|štrudel|strudel/)) return 'dessert'
  if (n.match(/solat|predjed|pršut|brusket|carpaccio|tartar|sushi|kozice/)) return 'cold'
  return 'hot'
}

const STATION_META: Record<Station, { label: string; icon: typeof Flame; color: string; bg: string }> = {
  hot: { label: 'Vroče', icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  cold: { label: 'Hladno', icon: Snowflake, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
  bar: { label: 'Bar', icon: Wine, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  dessert: { label: 'Sladice', icon: Cake, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
}

const TABLES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export function LivePosDemo() {
  // --- DATA ---
  const [menu, setMenu] = useState<MenuItemData[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; icon: string | null; color: string | null }[]>([])
  const [activeCat, setActiveCat] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // --- POS STATE ---
  const [selectedTable, setSelectedTable] = useState('5')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [sending, setSending] = useState(false)
  const [lastOrder, setLastOrder] = useState<{ number: string; total: number } | null>(null)

  // --- KDS STATE ---
  const [kdsTickets, setKdsTickets] = useState<KdsTicket[]>([])
  const [connected, setConnected] = useState(false)

  const socketRef = useRef<Socket | null>(null)

  /* ---- FETCH MENU ---- */
  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          const allItems: MenuItemData[] = []
          for (const cat of data.categories) {
            for (const item of cat.items) {
              allItems.push({ ...item, category: cat })
            }
          }
          setMenu(allItems)
          setCategories(data.categories.map((c: { id: string; name: string; slug: string; icon: string | null; color: string | null }) => ({
            id: c.id, name: c.name, slug: c.slug, icon: c.icon, color: c.color,
          })))
          if (data.categories.length > 0) setActiveCat(data.categories[0].slug)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  /* ---- WEBSOCKET CONNECTION ---- */
  useEffect(() => {
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('identify', { role: 'pos', username: 'demo-visitor' })
      socket.emit('identify', { role: 'kitchen', station: 'all', username: 'demo-kds' })
    })

    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    // Note: We don't listen for kds:new_order because socket.io doesn't echo
    // broadcasts back to the sender. Tickets are added locally in sendToKitchen().

    return () => {
      socket.disconnect()
    }
  }, [])

  /* ---- CART OPERATIONS ---- */
  const addToCart = useCallback((id: string) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCart(c => {
      const next = { ...c }
      if (next[id] > 1) next[id]--
      else delete next[id]
      return next
    })
  }, [])

  const clearCart = useCallback(() => setCart({}), [])

  /* ---- DERIVED VALUES ---- */
  const filteredItems = menu.filter(i => i.category.slug === activeCat)
  const cartLines: CartLine[] = Object.entries(cart).map(([id, qty]) => {
    const item = menu.find(i => i.id === id)
    return item ? { item, qty } : null
  }).filter(Boolean) as CartLine[]

  // DDV breakdown
  const subtotal = cartLines.reduce((s, { item, qty }) => s + item.price * qty, 0)
  const tax22Base = cartLines.filter(l => l.item.taxRate === 22).reduce((s, l) => s + l.item.price * l.qty, 0)
  const tax95Base = cartLines.filter(l => l.item.taxRate === 9.5).reduce((s, l) => s + l.item.price * l.qty, 0)
  const tax22 = tax22Base * 0.22
  const tax95 = tax95Base * 0.095
  const totalTax = tax22 + tax95
  const total = subtotal + totalTax

  /* ---- SEND TO KITCHEN ---- */
  const sendToKitchen = async () => {
    if (cartLines.length === 0) return
    setSending(true)

    try {
      // 1. Create real order via API
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: parseInt(selectedTable, 10),
          channel: 'dine_in',
          serverName: 'Demo obiskovalec',
          items: cartLines.map(({ item, qty }) => ({
            itemName: item.name,
            itemId: item.id,
            qty,
            unitPrice: item.price,
            taxRate: item.taxRate,
          })),
        }),
      })
      const data = await res.json()

      if (!data.ok) throw new Error(data.error || 'Napaka')

      const order = data.order

      // 2. Build KDS ticket locally (always — socket.io doesn't echo back to sender)
      const ticket: KdsTicket = {
        id: order.id,
        orderNumber: order.orderNumber,
        tableNumber: selectedTable,
        items: cartLines.map(({ item, qty }) => ({
          name: item.name, qty, station: detectStation(item.name),
        })),
        status: 'new',
        createdAt: Date.now(),
      }
      setKdsTickets(prev => [ticket, ...prev].slice(0, 8))

      // 3. Also emit via WebSocket for other KDS clients
      if (socketRef.current?.connected) {
        socketRef.current.emit('kds:new_order', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          table: `Miza ${selectedTable}`,
          items: ticket.items,
          channel: 'dine_in',
          serverName: 'Demo obiskovalec',
        })
      }

      setLastOrder({ number: order.orderNumber, total })
      setCart({})
    } catch (err) {
      console.error('[live-pos] send error:', err)
    } finally {
      setSending(false)
    }
  }

  /* ---- ADVANCE KDS TICKET ---- */
  const advanceTicket = (ticketId: string) => {
    setKdsTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t
      const next = t.status === 'new' ? 'preparing' : t.status === 'preparing' ? 'ready' : 'served'
      return { ...t, status: next }
    }))
  }

  /* ---- TIME AGO ---- */
  const [now, setNow] = useState(0)
  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const timeAgo = (ts: number) => {
    if (now === 0) return '0s'
    const sec = Math.floor((now - ts) / 1000)
    if (sec < 0) return '0s'
    if (sec < 60) return `${sec}s`
    return `${Math.floor(sec / 60)}m ${sec % 60}s`
  }

  /* ============================================================
     RENDER
     ============================================================ */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-slate-500">Nalagam meni iz baze...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Connection status bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
            {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {connected ? 'WebSocket povezan' : 'WebSocket nepovezan'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium">{menu.length} artiklov iz baze</span>
          </div>
          <div className="text-xs text-slate-400">·</div>
          <div className="text-xs text-slate-300">port 3003 · pos-realtime</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Receipt className="h-3.5 w-3.5" />
          <span>Klikni artikel → dodaj v račun → pošlji v kuhinjo</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* ============ LEFT: POS TERMINAL (3 cols) ============ */}
        <div className="lg:col-span-3 space-y-4">
          {/* Device frame */}
          <Card className="overflow-hidden border-slate-200 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-medium ml-2 text-slate-300">
                  Noro Lep POS · Miza {selectedTable}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-slate-700 text-white text-xs rounded-lg px-2 py-1 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {TABLES.map(t => (
                    <option key={t} value={t}>Miza {t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.slug)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeCat === cat.slug
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="p-3 bg-white max-h-[400px] overflow-y-auto custom-scroll">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">Ni artiklov v tej kategoriji</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filteredItems.map((item, idx) => {
                    const cartQty = cart[item.id] || 0
                    return (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item.id)}
                        className={`group relative p-2.5 rounded-lg border-2 transition-all text-left active:scale-95 overflow-hidden ${
                          cartQty > 0
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                        }`}
                      >
                        {/* Color bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${item.category.color || 'bg-slate-400'}`} />
                        {/* Shortcut badge */}
                        <span className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[8px] font-mono font-bold text-slate-400 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          F{idx + 1}
                        </span>
                        {item.popular && (
                          <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[8px] font-bold shadow-sm flex items-center gap-0.5">
                            <Sparkles className="h-2 w-2 fill-white" />TOP
                          </span>
                        )}
                        {cartQty > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-in zoom-in">
                            {cartQty}
                          </span>
                        )}
                        <div className="text-xl mb-1 mt-1.5">{item.emoji}</div>
                        <div className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">{item.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-sm font-bold text-emerald-600 tabular-nums">{item.price.toFixed(2)}€</span>
                          {item.vegan && <span className="text-[8px] px-1 rounded bg-green-100 text-green-700 font-bold">V</span>}
                          {item.vegetarian && <span className="text-[8px] px-1 rounded bg-lime-100 text-lime-700 font-bold">VEG</span>}
                          {item.allergens.length > 0 && (
                            <span className="text-[8px] px-1 rounded bg-orange-100 text-orange-700 font-bold" title={item.allergens.map(a => ALLERGEN_LABELS[a] || a).join(', ')}>
                              {item.allergens.length}A
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Cart / Receipt panel */}
          <Card className="border-slate-200 shadow-xl">
            <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-bold">Račun · Miza {selectedTable}</span>
                {cartLines.length > 0 && (
                  <Badge className="bg-emerald-500 text-white">{cartLines.reduce((s, l) => s + l.qty, 0)}</Badge>
                )}
              </div>
              {cartLines.length > 0 && (
                <button onClick={clearCart} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                  <Trash2 className="h-3 w-3" /> Počisti
                </button>
              )}
            </div>

            <div className="p-3 max-h-[280px] overflow-y-auto custom-scroll">
              {cartLines.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Račun je prazen</p>
                  <p className="text-xs text-slate-300 mt-1">Klikni artikel zgoraj za dodajanje</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {cartLines.map(({ item, qty }) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-lg">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {item.price.toFixed(2)}€ × {qty} · DDV {item.taxRate}%
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-200 hover:border-red-400 hover:text-red-500 flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold tabular-nums">{qty}</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-500 flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="w-16 text-right text-sm font-bold text-slate-900 tabular-nums">
                          {(item.price * qty).toFixed(2)}€
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Totals + actions */}
            {cartLines.length > 0 && (
              <div className="border-t border-slate-200 p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Osnova (brez DDV)</span>
                  <span className="tabular-nums">{subtotal.toFixed(2)}€</span>
                </div>
                {tax22Base > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>DDV 22% (osnova {tax22Base.toFixed(2)}€)</span>
                    <span className="tabular-nums">{tax22.toFixed(2)}€</span>
                  </div>
                )}
                {tax95Base > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>DDV 9.5% (osnova {tax95Base.toFixed(2)}€)</span>
                    <span className="tabular-nums">{tax95.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-slate-200">
                  <span className="text-sm font-bold text-slate-900">SKUPAJ</span>
                  <span className="text-xl font-bold text-emerald-600 tabular-nums">{total.toFixed(2)}€</span>
                </div>

                <Button
                  onClick={sendToKitchen}
                  disabled={sending || cartLines.length === 0}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Pošiljam v kuhinjo...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Pošlji v kuhinjo · {total.toFixed(2)}€
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* ============ RIGHT: KDS DISPLAY (2 cols) ============ */}
        <div className="lg:col-span-2">
          <Card className="border-slate-800 bg-slate-950 text-white shadow-2xl h-full flex flex-col">
            {/* KDS header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <ChefHat className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-bold">Kuhinja (KDS)</div>
                  <div className="text-[10px] text-slate-400">Real-time WebSocket · port 3003</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {kdsTickets.length > 0 && (
                  <Badge className="bg-rose-500 text-white animate-pulse">
                    <Bell className="h-3 w-3 mr-1" />
                    {kdsTickets.filter(t => t.status === 'new').length}
                  </Badge>
                )}
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
            </div>

            {/* Station summary */}
            <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800 grid grid-cols-4 gap-1.5">
              {(Object.keys(STATION_META) as Station[]).map(s => {
                const count = kdsTickets.flatMap(t => t.items).filter(i => i.station === s).length
                const meta = STATION_META[s]
                const Icon = meta.icon
                return (
                  <div key={s} className={`rounded-lg border p-1.5 text-center ${meta.bg}`}>
                    <Icon className={`h-3 w-3 mx-auto ${meta.color}`} />
                    <div className={`text-[9px] font-bold mt-0.5 ${meta.color}`}>{meta.label}</div>
                    <div className="text-xs font-bold text-slate-700 tabular-nums">{count}</div>
                  </div>
                )
              })}
            </div>

            {/* KDS tickets */}
            <div className="flex-1 p-3 overflow-y-auto custom-scroll max-h-[500px]">
              {kdsTickets.length === 0 ? (
                <div className="text-center py-10">
                  <ChefHat className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Kuhinja čaka</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Pošlji naročilo iz POS terminala ←
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-900 px-2.5 py-1 rounded-full">
                    <Zap className="h-3 w-3 text-amber-400" />
                    WebSocket event <code className="text-emerald-400">kds:new_order</code>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {kdsTickets.map((ticket) => {
                      const statusMeta = {
                        new: { label: 'NOVO', color: 'bg-rose-500', text: 'text-rose-300', border: 'border-rose-500/30' },
                        preparing: { label: 'V PRIPRAVI', color: 'bg-amber-500', text: 'text-amber-300', border: 'border-amber-500/30' },
                        ready: { label: 'PRIPRAVLJENO', color: 'bg-emerald-500', text: 'text-emerald-300', border: 'border-emerald-500/30' },
                        served: { label: 'POSTREŽENO', color: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-700' },
                      }[ticket.status]

                      return (
                        <motion.div
                          key={ticket.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`rounded-xl border ${statusMeta.border} bg-slate-900 overflow-hidden`}
                        >
                          {/* Ticket header */}
                          <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusMeta.color} text-white`}>
                                {statusMeta.label}
                              </span>
                              <span className="text-xs font-bold text-white">{ticket.orderNumber}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3" />
                              {timeAgo(ticket.createdAt)}
                            </div>
                          </div>

                          {/* Table */}
                          <div className="px-3 py-1.5 bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Utensils className="h-3 w-3 text-emerald-400" />
                              <span className="text-xs font-bold text-white">Miza {ticket.tableNumber}</span>
                            </div>
                            <span className="text-[9px] text-slate-500">Demo obiskovalec</span>
                          </div>

                          {/* Items */}
                          <div className="p-2 space-y-1">
                            {ticket.items.map((item, idx) => {
                              const meta = STATION_META[item.station as Station] || STATION_META.hot
                              const Icon = meta.icon
                              return (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <span className={`w-5 h-5 rounded flex items-center justify-center ${meta.bg} border ${meta.border}`}>
                                    <Icon className={`h-3 w-3 ${meta.color}`} />
                                  </span>
                                  <span className="font-bold text-slate-700">{item.qty}×</span>
                                  <span className="text-white flex-1 truncate">{item.name}</span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Action button */}
                          {ticket.status !== 'served' && (
                            <button
                              onClick={() => advanceTicket(ticket.id)}
                              className={`w-full py-1.5 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                                ticket.status === 'new'
                                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                  : ticket.status === 'preparing'
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                              }`}
                            >
                              {ticket.status === 'new' && <><Flame className="h-3 w-3" /> Začni pripravo</>}
                              {ticket.status === 'preparing' && <><CheckCircle2 className="h-3 w-3" /> Pripravljeno</>}
                              {ticket.status === 'ready' && <><CheckCircle2 className="h-3 w-3" /> Postreženo</>}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* KDS footer */}
            <div className="px-3 py-2 bg-slate-900/70 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Printer className="h-3 w-3" />
                <span>Auto-print: Vroče + Bar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" />
                <span>FURS EOR ready</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {lastOrder && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <Card className="p-4 bg-emerald-600 text-white border-0 shadow-2xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-sm">Naročilo poslano v kuhinjo!</div>
                  <div className="text-xs text-emerald-100 mt-1">
                    <span className="font-mono font-bold">{lastOrder.number}</span> · {lastOrder.total.toFixed(2)}€
                  </div>
                  <div className="text-[10px] text-emerald-200 mt-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    WebSocket event emitiran · KDS posodobljen v realnem času
                  </div>
                </div>
                <button
                  onClick={() => setLastOrder(null)}
                  className="text-emerald-200 hover:text-white transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
        {[
          { icon: Euro, label: 'DDV 22% + 9.5%', desc: 'Avto-razčlenitev', color: 'text-emerald-600' },
          { icon: Percent, label: '7 TOP artiklov', desc: 'Bestsellerji označeni', color: 'text-amber-600' },
          { icon: Printer, label: 'ESC/POS tisk', desc: 'Vroče + Bar postaje', color: 'text-rose-600' },
          { icon: Wifi, label: 'Socket.io 3003', desc: 'Real-time KDS sync', color: 'text-cyan-600' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200">
            <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{item.label}</div>
              <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
