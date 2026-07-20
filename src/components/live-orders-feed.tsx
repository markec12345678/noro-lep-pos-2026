'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, Utensils, Euro, Clock, TrendingUp, Zap,
  ArrowUpRight, RefreshCw, ShoppingBag, Wine
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/* ============================================================
   TYPES
   ============================================================ */
interface OrderItem {
  id: string
  itemName: string
  qty: number
  unitPrice: number
  totalPrice: number
  status: string
}

interface Order {
  id: string
  orderNumber: string
  tableNumber: number | null
  channel: string
  status: string
  subtotal: number
  tax: number
  total: number
  serverName: string | null
  createdAt: string
  items: OrderItem[]
}

interface Stats {
  total: number
  todayCount: number
  todayRevenue: number
  avgCheck: number
}

/* ============================================================
   CHANNEL META
   ============================================================ */
const CHANNEL_META: Record<string, { label: string; icon: typeof Receipt; color: string; bg: string }> = {
  dine_in: { label: 'Dine-in', icon: Utensils, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  takeaway: { label: 'Takeaway', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
  delivery: { label: 'Dostava', icon: Wine, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  qr: { label: 'QR meni', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  open: { label: 'Odprt', color: 'text-slate-600 bg-slate-100', dot: 'bg-slate-400' },
  sent: { label: 'Poslan', color: 'text-cyan-700 bg-cyan-100', dot: 'bg-cyan-500' },
  preparing: { label: 'V pripravi', color: 'text-amber-700 bg-amber-100', dot: 'bg-amber-500' },
  ready: { label: 'Pripravljen', color: 'text-emerald-700 bg-emerald-100', dot: 'bg-emerald-500' },
  served: { label: 'Postrežen', color: 'text-blue-700 bg-blue-100', dot: 'bg-blue-500' },
  paid: { label: 'Plačan', color: 'text-emerald-700 bg-emerald-100', dot: 'bg-emerald-600' },
  canceled: { label: 'Preklican', color: 'text-red-700 bg-red-100', dot: 'bg-red-500' },
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export function LiveOrdersFeed() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, todayCount: 0, todayRevenue: 0, avgCheck: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [now, setNow] = useState(0)

  /* ---- FETCH ORDERS ---- */
  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const res = await fetch('/api/orders?limit=10')
      const data = await res.json()

      if (data.ok && data.orders) {
        const newOrders = data.orders as Order[]
        const prevIds = new Set(orders.map(o => o.id))
        const freshIds = new Set<string>()

        // Detect new orders
        for (const o of newOrders) {
          if (!prevIds.has(o.id)) {
            freshIds.add(o.id)
          }
        }

        setOrders(newOrders)

        // Flash new orders for 3 seconds
        if (freshIds.size > 0) {
          setNewOrderIds(freshIds)
          setTimeout(() => setNewOrderIds(new Set()), 3000)
        }

        // Calculate stats
        const today = new Date().toDateString()
        const todayOrders = newOrders.filter(o => new Date(o.createdAt).toDateString() === today)
        const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)

        setStats({
          total: data.count || newOrders.length,
          todayCount: todayOrders.length,
          todayRevenue,
          avgCheck: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
        })
      }
      setLastUpdate(new Date())
      setLoading(false)
      if (isRefresh) {
        setTimeout(() => setRefreshing(false), 500)
      }
    } catch {
      setLoading(false)
      if (isRefresh) setRefreshing(false)
    }
  }, [orders])

  /* ---- INITIAL FETCH + AUTO REFRESH ---- */
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(() => fetchOrders(true), 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- TIME UPDATER ---- */
  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  /* ---- TIME AGO ---- */
  const timeAgo = (iso: string) => {
    if (now === 0) return ''
    const diff = Math.floor((now - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `pred ${diff}s`
    if (diff < 3600) return `pred ${Math.floor(diff / 60)}min`
    return `pred ${Math.floor(diff / 3600)}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-sm text-slate-500">Nalagam naročila...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-3 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <Euro className="h-4 w-4 opacity-80" />
            <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">Danes</span>
          </div>
          <div className="text-xl font-bold tabular-nums">
            €{stats.todayRevenue.toFixed(2)}
          </div>
          <div className="text-[10px] opacity-80">promet danes</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Danes</span>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">{stats.todayCount}</div>
          <div className="text-[10px] text-slate-500">naročil</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Povprečno</span>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            €{stats.avgCheck.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500">povp. račun</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Skupno</span>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">{stats.total}</div>
          <div className="text-[10px] text-slate-500">vseh naročil</div>
        </div>
      </div>

      {/* Live indicator + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-slate-700">Live order feed</span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[10px] text-slate-500">
            Auto-refresh vsakih 5s
            {lastUpdate && (
              <span className="ml-1">· zadnjič {lastUpdate.toLocaleTimeString('sl-SI')}</span>
            )}
          </span>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-600 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          Osveži
        </button>
      </div>

      {/* Orders list */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm max-h-[500px] overflow-y-auto custom-scroll">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Ni naročil</p>
            <p className="text-xs text-slate-300 mt-1">Pošlji order iz POS terminala zgoraj</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <AnimatePresence mode="popLayout">
              {orders.map((order, idx) => {
                const channel = CHANNEL_META[order.channel] || CHANNEL_META.dine_in
                const status = STATUS_META[order.status] || STATUS_META.open
                const isNew = newOrderIds.has(order.id)
                const ChannelIcon = channel.icon

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={isNew ? { opacity: 0, x: -30, backgroundColor: 'rgb(167 243 208)' } : false}
                    animate={{ opacity: 1, x: 0, backgroundColor: 'rgb(255 255 255)' }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4 }}
                    className={`p-3 hover:bg-slate-50 transition-colors ${isNew ? 'ring-2 ring-emerald-400 ring-inset' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Order number + rank */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-8 h-8 rounded-lg ${channel.bg} flex items-center justify-center`}>
                          <ChannelIcon className={`h-4 w-4 ${channel.color}`} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-mono">{order.orderNumber}</div>
                          <div className="text-[9px] text-slate-400">#{idx + 1}</div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.tableNumber && (
                            <span className="text-xs font-medium text-slate-600">
                              Miza {order.tableNumber}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${status.color}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot} mr-1`} />
                            {status.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {order.items.length} {order.items.length === 1 ? 'artikel' : 'artiklov'}
                          </span>
                          {order.serverName && (
                            <span className="text-[10px] text-slate-400">· {order.serverName}</span>
                          )}
                        </div>
                        {/* Item preview */}
                        {order.items.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {order.items.slice(0, 3).map(i => `${i.qty}× ${i.itemName}`).join(', ')}
                            {order.items.length > 3 && ` +${order.items.length - 3}`}
                          </div>
                        )}
                      </div>

                      {/* Total + time */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-emerald-600 tabular-nums">
                          €{order.total.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center gap-0.5 justify-end">
                          <Clock className="h-2.5 w-2.5" />
                          {timeAgo(order.createdAt)}
                        </div>
                      </div>

                      {/* New badge */}
                      {isNew && (
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="shrink-0"
                        >
                          <Badge className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5">
                            <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                            NOVO
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-amber-500" />
          <span>GET /api/orders?limit=10 · auto-refresh 5s</span>
        </div>
        <div>
          {orders.length} od {stats.total} naročil prikazanih
        </div>
      </div>
    </div>
  )
}
