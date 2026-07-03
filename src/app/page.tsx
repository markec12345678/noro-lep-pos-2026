'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Eye,
  Globe,
  Heart,
  LayoutGrid,
  Loader2,
  Minus,
  Package,
  Plus,
  QrCode,
  Monitor,
  Receipt,
  ScanLine,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Utensils,
  Users,
  Wifi,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValue, useSpring, animate } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAnalytics } from '@/hooks/use-analytics'

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */
function AnimatedCounter({
  value,
  suffix = '',
  decimals = 0,
}: {
  value: number
  suffix?: string
  decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value])

  return (
    <span ref={ref}>
      {display.toLocaleString('sl-SI', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

/* ============================================================
   MENU DATA — Slovenian restaurant menu
   ============================================================ */
const MENU_CATEGORIES = [
  { id: 'predjedi', label: 'Predjedi', color: 'bg-amber-500' },
  { id: 'glavne', label: 'Glavne jedi', color: 'bg-emerald-500' },
  { id: 'pice', label: 'Pice', color: 'bg-rose-500' },
  { id: 'sladice', label: 'Sladice', color: 'bg-purple-500' },
  { id: 'pijace', label: 'Pijače', color: 'bg-sky-500' },
] as const

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  image?: string
  desc?: string
  popular?: boolean
}

const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Trški pršut', price: 8.5, category: 'predjedi', image: '/pos-demo/cevapi.png', desc: 'Pršut z melono in rožmarinom', popular: true },
  { id: '2', name: 'Brusketa s paradižnikom', price: 5.5, category: 'predjedi' },
  { id: '3', name: 'Kozice na žaru', price: 12.0, category: 'predjedi' },
  { id: '4', name: 'Mešana solata', price: 4.5, category: 'predjedi' },
  { id: '5', name: 'Štruklji', price: 6.0, category: 'predjedi' },
  { id: '6', name: 'Šampinjoni na žaru', price: 5.0, category: 'predjedi' },
  { id: '7', name: 'Čevapi s kajmakom', price: 14.5, category: 'glavne', image: '/pos-demo/cevapi.png', desc: 'Čevapi, kajmak, čebula, kruh', popular: true },
  { id: '8', name: 'Rižota s morskimi sadeži', price: 16.0, category: 'glavne', image: '/pos-demo/rizota.png', desc: 'Rižota s kozicami, školjkami', popular: true },
  { id: '9', name: 'Teleči ražnjiči', price: 18.0, category: 'glavne' },
  { id: '10', name: 'Burger Noro Lep', price: 15.0, category: 'glavne', image: '/pos-demo/burger.png', desc: '180g goveji burger, sir, pomfrit' },
  { id: '11', name: 'Zrezek na žaru', price: 19.5, category: 'glavne' },
  { id: '12', name: 'Pizza Margherita', price: 11.0, category: 'pice', image: '/pos-demo/pizza.png', desc: 'Paradižnik, mozzarella, bazilika', popular: true },
  { id: '13', name: 'Pizza Capricciosa', price: 13.0, category: 'pice' },
  { id: '14', name: 'Pizza Quattro Formaggi', price: 14.0, category: 'pice' },
  { id: '15', name: 'Pizza Prosciutto', price: 13.5, category: 'pice' },
  { id: '16', name: 'Tiramisu', price: 6.5, category: 'sladice', image: '/pos-demo/tiramisu.png', desc: 'Klasična italijanska sladica' },
  { id: '17', name: 'Panna Cotta', price: 5.5, category: 'sladice' },
  { id: '18', name: 'Čokoladna torta', price: 6.0, category: 'sladice' },
  { id: '19', name: 'Becka kava', price: 2.0, category: 'pijace', image: '/pos-demo/kava.png', desc: 'Cappuccino z latte art' },
  { id: '20', name: 'Espresso', price: 1.5, category: 'pijace' },
  { id: '21', name: 'Pivo Laško', price: 3.0, category: 'pijace' },
  { id: '22', name: 'Rdeče vino (0.2l)', price: 4.0, category: 'pijace' },
  { id: '23', name: 'Coca Cola', price: 2.5, category: 'pijace' },
  { id: '24', name: 'Voda Radenska', price: 2.0, category: 'pijace' },
]

/* ============================================================
   FEATURES
   ============================================================ */
const FEATURES = [
  { icon: ScanLine, title: 'Hitra blagajna', desc: 'Račun izstavljen v 8 sekundah z avtomatskim FURS ZOI/EOR.', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { icon: LayoutGrid, title: 'Upravljanje miz', desc: 'Vizualni tloris z barvno kodiranimi statusi in rezervacijami.', iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
  { icon: Utensils, title: 'Kuhinjski KDS', desc: 'Kanban prikaz naročil za kuharje v realnem času.', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { icon: Package, title: 'Zaloge & dobave', desc: 'Sledenje zalog, avtomatski opozorili, upravljanje dobaviteljev.', iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  { icon: ShieldCheck, title: 'FURS skladnost', desc: 'ZOI, EOR, QR koda na računu. Popolna skladnost z ZDavPR.', iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
  { icon: BarChart3, title: 'AI analitika', desc: 'Dnevna poročila, menu engineering, predikcija prometa z AI.', iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
  { icon: Smartphone, title: 'QR naročanje', desc: 'Gosti naročajo preko QR kode s slikami artiklov.', iconBg: 'bg-pink-50', iconColor: 'text-pink-600' },
  { icon: Users, title: 'Vernostni program', desc: 'Točkovanje gostov, nagrade, CRM z zgodovino obiskov.', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  { icon: Receipt, title: 'Računi & davki', desc: 'Avtomatski DDV, skupinski računi, delitev računa.', iconBg: 'bg-lime-50', iconColor: 'text-lime-600' },
]

const STATS = [
  { value: 542, suffix: '+', label: 'Restavracij zaupa nam', icon: Utensils, color: 'text-emerald-600' },
  { value: 2.4, suffix: 'M€', label: 'Mesečni promet gostov', decimals: 1, icon: TrendingUp, color: 'text-teal-600' },
  { value: 30, suffix: '%', label: 'Manj časa na račun', icon: Clock, color: 'text-amber-600' },
  { value: 4.9, suffix: '/5', label: 'Povprečna ocena', decimals: 1, icon: Star, color: 'text-rose-600' },
]

const TESTIMONIALS = [
  {
    quote: 'Po prehodu na Noro Lep POS smo skrajšali čas izdaje računa za 40%. FURS dela avtomatsko, kuharji končno vidijo vsa naročila.',
    name: 'Marko Kovač',
    role: 'Lastnik, Gostilna Pri Lovru',
    location: 'Ljubljana',
    avatar: 'MK',
    avatarBg: 'bg-emerald-500',
  },
  {
    quote: 'AI predikcija prometa je zaklad. Zdaj vemo, koliko zaloge naročiti za vikend, brez ugibanja. Prihranili smo 15% na odpadu.',
    name: 'Ana Zupan',
    role: 'Direktorica, Restavracija Mariana',
    location: 'Bled',
    avatar: 'AZ',
    avatarBg: 'bg-teal-500',
  },
  {
    quote: 'QR naročanje za goste z slikami jedi je dvignilo povprečni račun za 22%. Gosti vidijo jed, želijo več.',
    name: 'Tomaž Horvat',
    role: 'Upravljalec, Pizza Factory',
    location: 'Maribor',
    avatar: 'TH',
    avatarBg: 'bg-amber-500',
  },
]

const FAQ = [
  { q: 'Ali POS vmesnik uporablja slike ali tekst?', a: 'POS vmesnik za natakarje uporablja TEXT labele (kot Toast in Lightspeed) za maksimalno hitrost — 20-30 artiklov na zaslon. Slike artiklov se prikažejo v online ordering za goste, customer-facing display in na računu.' },
  { q: 'Kako hitro lahko začnem uporabljati Noro Lep POS?', a: 'Registracija traja 2 minuti. Po namestitvi vneseš meni (ali uvoziš iz Excela), aktiviraš FURS podatke in si pripravljen za prvi račun v 15 minutah.' },
  { q: 'Ali sistem deluje brez internetne povezave?', a: 'Da. Vsi naročila in računi se shranjujejo lokalno in se samodejno sinhronizirajo s FURS takoj, ko je povezava spet na voljo.' },
  { q: 'Kakšna je FURS skladnost?', a: 'Noro Lep je polno skladen z ZDavPR. Avtomatsko generira ZOI in pridobiva EOR od FURS v realnem času. QR koda na računu je vključena.' },
  { q: 'Katero strojno opremo potrebujem?', a: 'Noro Lep deluje na kateremkoli Android tabletu, iPad-u, Windows ali Mac-u. Podpira vse pogoste tiskalnike in QR scannerje.' },
  { q: 'Ali lahko uporabljam sistem v več lokacijah?', a: 'Da. Paket Professional podpira do 3 lokacije z enotnim upravljanjem menija, cen in poročil.' },
]

/* ============================================================
   KDS DATA — Kitchen orders
   ============================================================ */
interface KitchenOrder {
  id: string
  table: string
  items: { name: string; qty: number; note?: string }[]
  status: 'nova' | 'v-pripravi' | 'pripravljena'
  minutes: number
  server: string
}

const KITCHEN_ORDERS: KitchenOrder[] = [
  { id: 'K-014', table: 'Miza 5', status: 'nova', minutes: 1, server: 'Maja', items: [{ name: 'Pizza Margherita', qty: 1, note: 'brez gljiv' }, { name: 'Čevapi', qty: 2 }, { name: 'Becka kava', qty: 1 }] },
  { id: 'K-015', table: 'Miza 12', status: 'nova', minutes: 3, server: 'Tomaž', items: [{ name: 'Rižota s morskimi sadeži', qty: 1 }, { name: 'Trški pršut', qty: 1 }] },
  { id: 'K-011', table: 'Miza 3', status: 'v-pripravi', minutes: 7, server: 'Maja', items: [{ name: 'Burger Noro Lep', qty: 2, note: 'medium' }, { name: 'Pizza Capricciosa', qty: 1 }] },
  { id: 'K-012', table: 'Miza 8', status: 'v-pripravi', minutes: 9, server: 'Luka', items: [{ name: 'Šampinjoni na žaru', qty: 1 }, { name: 'Teleči ražnjiči', qty: 2 }] },
  { id: 'K-009', table: 'Miza 2', status: 'pripravljena', minutes: 12, server: 'Tomaž', items: [{ name: 'Štruklji', qty: 2 }, { name: 'Tiramisu', qty: 1 }, { name: 'Coca Cola', qty: 2 }] },
  { id: 'K-010', table: 'Miza 7', status: 'pripravljena', minutes: 14, server: 'Luka', items: [{ name: 'Pizza Quattro Formaggi', qty: 1 }, { name: 'Panna Cotta', qty: 1 }] },
]

/* ============================================================
   TABLES DATA — Restaurant floor plan
   ============================================================ */
interface TableInfo {
  id: string
  label: string
  seats: number
  status: 'prosta' | 'zasedena' | 'rezervirana' | 'plačilo'
  server?: string
  minutes?: number
  total?: number
}

const TABLES: TableInfo[] = [
  { id: 't1', label: '1', seats: 2, status: 'zasedena', server: 'Maja', minutes: 35, total: 42.5 },
  { id: 't2', label: '2', seats: 4, status: 'plačilo', server: 'Tomaž', minutes: 78, total: 89.0 },
  { id: 't3', label: '3', seats: 4, status: 'zasedena', server: 'Maja', minutes: 12, total: 31.0 },
  { id: 't4', label: '4', seats: 2, status: 'prosta' },
  { id: 't5', label: '5', seats: 6, status: 'zasedena', server: 'Maja', minutes: 5, total: 18.5 },
  { id: 't6', label: '6', seats: 2, status: 'rezervirana', server: '—', minutes: 20 },
  { id: 't7', label: '7', seats: 4, status: 'zasedena', server: 'Luka', minutes: 45, total: 67.0 },
  { id: 't8', label: '8', seats: 4, status: 'zasedena', server: 'Luka', minutes: 9, total: 22.0 },
  { id: 't9', label: '9', seats: 8, status: 'rezervirana', server: '—', minutes: 60 },
  { id: 't10', label: '10', seats: 2, status: 'prosta' },
  { id: 't11', label: '11', seats: 4, status: 'prosta' },
  { id: 't12', label: '12', seats: 4, status: 'zasedena', server: 'Tomaž', minutes: 3, total: 0 },
]

/* ============================================================
   INTERACTIVE POS DEMO — Toggle between Natakar (TEXT) and Gost (IMAGE)
   ============================================================ */
function PosDemo({ onCheckout, selectedTable }: { onCheckout: (cartItems: { item: MenuItem; qty: number }[], total: number) => void; selectedTable: string }) {
  const [view, setView] = useState<'natakar' | 'gost'>('natakar')
  const [activeCat, setActiveCat] = useState<string>('predjedi')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [checkedOut, setCheckedOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const filteredItems = MENU_ITEMS.filter((i) => i.category === activeCat)

  const addToCart = (id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
  }
  const removeFromCart = (id: string) => {
    setCart((c) => {
      const next = { ...c }
      if (next[id] > 1) next[id]--
      else delete next[id]
      return next
    })
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    item: MENU_ITEMS.find((i) => i.id === id)!,
    qty,
  }))
  const cartTotal = cartItems.reduce((sum, { item, qty }) => sum + item.price * qty, 0)

  return (
    <div className="relative">
      {/* View toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView('natakar')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'natakar'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="h-4 w-4 inline mr-2" />
            Natakar (TEXT)
          </button>
          <button
            onClick={() => setView('gost')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              view === 'gost'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShoppingBag className="h-4 w-4 inline mr-2" />
            Gost (SLIKE)
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* POS / Ordering interface */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-slate-200 shadow-xl">
            {/* Device frame header */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-medium ml-2 text-slate-300">
                  {view === 'natakar' ? 'Noro Lep POS · Miza 12 · 2 osebi' : 'Noro Lep Online · Meni'}
                </span>
              </div>
              <span className="text-xs text-slate-400">{mounted ? new Date().toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 p-3 bg-slate-50 border-b border-slate-100 overflow-x-auto">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeCat === cat.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="p-4 bg-white" style={{ minHeight: '420px' }}>
              {view === 'natakar' ? (
                <motion.div
                  key="natakar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Modular sections — color-coded like Toast */}
                  <div className="mb-3 flex items-center gap-2">
                    <div className={`h-1.5 w-8 rounded-full ${MENU_CATEGORIES.find(c => c.id === activeCat)?.color}`} />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {MENU_CATEGORIES.find(c => c.id === activeCat)?.label}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {filteredItems.length} artiklov · F1-F{Math.min(9, filteredItems.length)} bližnjice
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {filteredItems.map((item, idx) => {
                      const catColor = MENU_CATEGORIES.find(c => c.id === item.category)?.color || 'bg-slate-400'
                      return (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item.id)}
                          className="group relative p-2.5 rounded-lg border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left active:scale-95 overflow-hidden"
                        >
                          {/* Color bar top — Toast-style modular sections */}
                          <div className={`absolute top-0 left-0 right-0 h-1 ${catColor}`} />
                          {/* Shortcut badge */}
                          <span className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded text-[8px] font-mono font-bold text-slate-400 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            F{idx + 1}
                          </span>
                          {item.popular && (
                            <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[8px] font-bold shadow-sm flex items-center gap-0.5">
                              <Star className="h-2 w-2 fill-white" />
                              TOP
                            </span>
                          )}
                          <div className="text-xs font-bold text-slate-900 leading-tight line-clamp-2 mt-1.5">
                            {item.name}
                          </div>
                          <div className="text-sm font-bold text-emerald-600 mt-1 tabular-nums">
                            {item.price.toFixed(2)} €
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {/* Quick actions bar — Toast-style */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px]">
                    <span className="text-slate-400">Bližnjice:</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">Enter</kbd>
                    <span className="text-slate-400">= plačaj</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">Esc</kbd>
                    <span className="text-slate-400">= prekliči</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">F2</kbd>
                    <span className="text-slate-400">= modifikatorji</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="gost"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Promo tile banner — Shopify-style */}
                  <div className="mb-3 p-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-bold">Danes -20% na vse pice 🍕</span>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">koda: PIZZA20</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item.id)}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left active:scale-95"
                      >
                        {/* Popular ribbon — Shopify-style */}
                        {item.popular && (
                          <div className="absolute top-0 left-0 z-10 px-2 py-1 bg-amber-400 text-white text-[9px] font-bold rounded-br-lg flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-white" />
                            POPULARNO
                          </div>
                        )}
                        <div className="aspect-square bg-slate-100 overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Utensils className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <div className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">
                            {item.name}
                          </div>
                          {item.desc && (
                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {item.desc}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-baseline gap-1">
                              {item.popular && (
                                <span className="text-[10px] text-slate-400 line-through tabular-nums">
                                  {(item.price * 1.2).toFixed(2)} €
                                </span>
                              )}
                              <span className="text-sm font-bold text-emerald-600 tabular-nums">
                                {item.price.toFixed(2)} €
                              </span>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-emerald-50 group-hover:bg-emerald-600 flex items-center justify-center transition-colors">
                              <Plus className="h-3.5 w-3.5 text-emerald-600 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </Card>

          {/* Info badge below device */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
            {view === 'natakar' ? (
              <>
                <Zap className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong className="text-slate-700">Modularni TEXT</strong> — color-coded sekcije + F1-F9 bližnjice + quick actions. Kot Toast, a boljše.</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong className="text-slate-700">SLIKE + promo</strong> — promo tiles + popular ribbons + strike-through cene. Upselling +22%.</span>
              </>
            )}
          </div>
        </div>

        {/* Cart / Order summary */}
        <div>
          <Card className="border-slate-200 shadow-xl sticky top-4">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                <span className="font-bold text-sm">Naročilo</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                {cartItems.reduce((s, i) => s + i.qty, 0)} artiklov
              </Badge>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 space-y-2">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Klikni artikel za dodajanje</p>
                </div>
              ) : (
                cartItems.map(({ item, qty }) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.price.toFixed(2)} €</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
                      >
                        <Minus className="h-3 w-3 text-slate-600" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center tabular-nums">{qty}</span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition"
                      >
                        <Plus className="h-3 w-3 text-emerald-600" />
                      </button>
                    </div>
                    <div className="text-xs font-bold text-slate-900 w-14 text-right tabular-nums">
                      {(item.price * qty).toFixed(2)} €
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>DDV (22%)</span>
                  <span className="tabular-nums">{(cartTotal * 0.22 / 1.22).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Skupaj</span>
                  <span className="text-2xl font-bold text-emerald-600 tabular-nums">{cartTotal.toFixed(2)} €</span>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => {
                    onCheckout(cartItems, cartTotal)
                    setCart({})
                    setCheckedOut(true)
                    setTimeout(() => setCheckedOut(false), 3000)
                  }}
                >
                  {checkedOut ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Poslano v kuhinjo!
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Izdaj račun · FURS
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  ZOI · EOR · QR koda · sync v {selectedTable ? `Mizo ${selectedTable}` : 'kuhinjo'}
                </div>
                {checkedOut && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 rounded-lg py-2"
                  >
                    <Zap className="h-3 w-3" />
                    Real-time sync: KDS + Mize + Analitika posodobljeni
                  </motion.div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   KDS VIEW — Kitchen Display System kanban
   ============================================================ */
function KdsView({ orders, onAdvance }: { orders: KitchenOrder[]; onAdvance: (id: string) => void }) {
  const columns: { key: KitchenOrder['status']; label: string; color: string; bgColor: string; action: string }[] = [
    { key: 'nova', label: 'Nova naročila', color: 'text-amber-600', bgColor: 'bg-amber-50', action: 'Začni pripravo' },
    { key: 'v-pripravi', label: 'V pripravi', color: 'text-sky-600', bgColor: 'bg-sky-50', action: 'Označi pripravljeno' },
    { key: 'pripravljena', label: 'Pripravljena', color: 'text-emerald-600', bgColor: 'bg-emerald-50', action: 'Čaka odnos' },
  ]

  return (
    <div>
      {/* KDS header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-900 rounded-xl text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Utensils className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold">Kuhinjski zaslon · KDS</div>
            <div className="text-[10px] text-slate-400">{orders.length} aktivnih naročil · 2 kuharja</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">V živo</span>
          </span>
          <span className="text-slate-400">Povp. čas: <strong className="text-white">8.4 min</strong></span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key)
          return (
            <div key={col.key} className={`${col.bgColor} rounded-xl p-3 min-h-[400px]`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`text-xs font-bold ${col.color} uppercase tracking-wide flex items-center gap-1.5`}>
                  <span className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                  {col.label}
                </div>
                <span className={`px-2 py-0.5 rounded-full bg-white ${col.color} text-xs font-bold`}>
                  {colOrders.length}
                </span>
              </div>
              <div className="space-y-2">
                {colOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg p-3 shadow-sm border-l-4"
                    style={{
                      borderLeftColor:
                        order.status === 'nova' ? '#f59e0b' : order.status === 'v-pripravi' ? '#0ea5e9' : '#10b981',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{order.table}</div>
                        <div className="text-[10px] text-slate-400">#{order.id} · {order.server}</div>
                      </div>
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${order.minutes > 10 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {order.minutes} min
                      </div>
                    </div>
                    <div className="space-y-1 mb-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="font-bold text-emerald-600 tabular-nums shrink-0">{item.qty}×</span>
                          <span className="flex-1">{item.name}</span>
                          {item.note && (
                            <span className="text-[9px] text-amber-600 italic bg-amber-50 px-1 rounded shrink-0">{item.note}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {order.status !== 'pripravljena' && (
                      <button
                        onClick={() => onAdvance(order.id)}
                        className="w-full mt-2 px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {col.action}
                      </button>
                    )}
                    {order.status === 'pripravljena' && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 rounded-lg py-1.5">
                        <Bell className="h-3 w-3" />
                        Natakar obveščen
                      </div>
                    )}
                  </motion.div>
                ))}
                {colOrders.length === 0 && (
                  <div className="text-center py-8 text-[10px] text-slate-400 italic">Ni naročil</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================================
   TABLES VIEW — Restaurant floor plan
   ============================================================ */
function TablesView({ tables }: { tables: TableInfo[] }) {
  const statusConfig = {
    prosta: { label: 'Prosta', bgColor: 'bg-white', borderColor: 'border-slate-300', textColor: 'text-slate-500', dot: 'bg-slate-300' },
    zasedena: { label: 'Zasedena', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-400', textColor: 'text-emerald-700', dot: 'bg-emerald-500' },
    rezervirana: { label: 'Rezervirana', bgColor: 'bg-amber-50', borderColor: 'border-amber-400', textColor: 'text-amber-700', dot: 'bg-amber-500' },
    plačilo: { label: 'Plačilo', bgColor: 'bg-sky-50', borderColor: 'border-sky-400', textColor: 'text-sky-700', dot: 'bg-sky-500' },
  }

  const stats = {
    prosta: tables.filter((t) => t.status === 'prosta').length,
    zasedena: tables.filter((t) => t.status === 'zasedena').length,
    rezervirana: tables.filter((t) => t.status === 'rezervirana').length,
    plačilo: tables.filter((t) => t.status === 'plačilo').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-900 rounded-xl text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <LayoutGrid className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold">Tloris restavracije</div>
            <div className="text-[10px] text-slate-400">12 miz · 8 zasedenih · 4 natakarji</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusConfig[key].dot}`} />
              <span className="text-slate-300">{statusConfig[key].label} ({stats[key]})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Floor plan grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-slate-50 rounded-xl min-h-[400px]">
        {tables.map((table) => {
          const cfg = statusConfig[table.status]
          return (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className={`${cfg.bgColor} ${cfg.borderColor} border-2 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">Miza {table.label}</span>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              </div>
              <div className="text-[10px] text-slate-500 mb-2">{table.seats} oseb</div>
              {table.status !== 'prosta' && (
                <>
                  <div className={`text-[10px] ${cfg.textColor} font-semibold mb-0.5`}>
                    {table.status === 'rezervirana' ? 'Rezervirana' : table.server}
                  </div>
                  {table.minutes !== undefined && (
                    <div className="text-[9px] text-slate-400">
                      {table.status === 'rezervirana' ? `čez ${table.minutes} min` : `${table.minutes} min`}
                    </div>
                  )}
                  {table.total !== undefined && table.total > 0 && (
                    <div className="text-xs font-bold text-slate-900 mt-1 tabular-nums">
                      {table.total.toFixed(2)} €
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => (
          <div key={key} className={`${statusConfig[key].bgColor} border ${statusConfig[key].borderColor} rounded-lg p-2.5 text-center`}>
            <div className={`text-2xl font-bold ${statusConfig[key].textColor} tabular-nums`}>{stats[key]}</div>
            <div className="text-[10px] text-slate-500">{statusConfig[key].label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   ANALYTICS VIEW — Dashboard z graf-i
   ============================================================ */
const HOURLY_DATA = [
  { hour: '10h', promet: 120, naročila: 8 },
  { hour: '11h', promet: 280, naročila: 18 },
  { hour: '12h', promet: 890, naročila: 52 },
  { hour: '13h', promet: 1240, naročila: 78 },
  { hour: '14h', promet: 680, naročila: 41 },
  { hour: '15h', promet: 320, naročila: 22 },
  { hour: '16h', promet: 410, naročila: 28 },
  { hour: '17h', promet: 720, naročila: 45 },
  { hour: '18h', promet: 1380, naročila: 82 },
  { hour: '19h', promet: 1680, naročila: 95 },
  { hour: '20h', promet: 1420, naročila: 84 },
  { hour: '21h', promet: 890, naročila: 56 },
  { hour: '22h', promet: 420, naročila: 24 },
]

const TOP_ITEMS = [
  { name: 'Pizza Margherita', količina: 48, promet: 528 },
  { name: 'Čevapi', količina: 42, promet: 609 },
  { name: 'Burger Noro Lep', količina: 35, promet: 525 },
  { name: 'Rižota s sadeži', količina: 28, promet: 448 },
  { name: 'Pizza Capricciosa', količina: 24, promet: 312 },
]

const CATEGORY_SPLIT = [
  { name: 'Glavne jedi', value: 38, color: '#10b981' },
  { name: 'Pice', value: 28, color: '#f43f5e' },
  { name: 'Pijače', value: 18, color: '#0ea5e9' },
  { name: 'Predjedi', value: 10, color: '#f59e0b' },
  { name: 'Sladice', value: 6, color: '#a855f7' },
]

function AnalyticsView({ promet, narocila }: { promet: number; narocila: number }) {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  const povrRacun = narocila > 0 ? promet / narocila : 0
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-900 rounded-xl text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold">Analitika · Danes <span className="text-emerald-400 text-[10px] ml-1">· live</span></div>
            <div className="text-[10px] text-slate-400">{mounted ? new Date().toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-400 tabular-nums">€{promet.toLocaleString('sl-SI', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="text-[10px] text-slate-400">+18% vs včeraj</div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Promet', value: `€${promet.toLocaleString('sl-SI', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, change: '+18%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Naročila', value: String(narocila), change: '+12%', icon: Receipt, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Povr. račun', value: `€${povrRacun.toFixed(2)}`, change: '+5%', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Zasedenost', value: '78%', change: '+8%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((kpi, i) => (
          <Card key={i} className="p-3 border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">{kpi.change}</span>
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">{kpi.value}</div>
            <div className="text-[10px] text-slate-500">{kpi.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Hourly revenue chart */}
        <Card className="lg:col-span-2 p-4 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Promet po urah</div>
              <div className="text-[10px] text-slate-500">Dnevni trend z AI predikcijo za 22h</div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[10px]">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              AI predikcija
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={HOURLY_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPromet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="promet" stroke="#10b981" strokeWidth={2} fill="url(#colorPromet)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category pie */}
        <Card className="p-4 border-slate-200">
          <div className="text-sm font-bold text-slate-900 mb-1">Razdelitev po kategorijah</div>
          <div className="text-[10px] text-slate-500 mb-2">Delež prometa</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={CATEGORY_SPLIT}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
              >
                {CATEGORY_SPLIT.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {CATEGORY_SPLIT.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-600">{cat.name}</span>
                </span>
                <span className="font-bold text-slate-900 tabular-nums">{cat.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top items */}
      <Card className="mt-4 p-4 border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-slate-900">Top 5 jedi (menu engineering)</div>
            <div className="text-[10px] text-slate-500">Najbolj donosni artikli danes</div>
          </div>
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-[10px]">
            <Star className="h-2.5 w-2.5 mr-1 fill-amber-500" />
            Zmagovalci
          </Badge>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={TOP_ITEMS} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="promet" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

/* ============================================================
   PRODUCT TOUR — 4-view interactive showcase z REAL-TIME SYNC
   ============================================================ */
interface TourState {
  kitchenOrders: KitchenOrder[]
  tables: TableInfo[]
  promet: number
  narocila: number
  selectedTable: string
  lastSync: string | null
}

function ProductTour() {
  const [activeView, setActiveView] = useState<'pos' | 'kds' | 'tables' | 'analytics'>('pos')
  const [state, setState] = useState<TourState>({
    kitchenOrders: [...KITCHEN_ORDERS],
    tables: [...TABLES],
    promet: 10270,
    narocila: 633,
    selectedTable: '12',
    lastSync: null,
  })
  const [syncPulse, setSyncPulse] = useState(false)

  // Trigger sync pulse animation
  const triggerSync = (msg: string) => {
    setState((s) => ({ ...s, lastSync: msg }))
    setSyncPulse(true)
    setTimeout(() => setSyncPulse(false), 2500)
  }

  // POS checkout → creates KDS order + updates table + analytics
  const handleCheckout = (cartItems: { item: MenuItem; qty: number }[], total: number) => {
    const orderId = `K-${String(100 + state.kitchenOrders.length + 1).padStart(3, '0')}`
    const newOrder: KitchenOrder = {
      id: orderId,
      table: `Miza ${state.selectedTable}`,
      status: 'nova',
      minutes: 0,
      server: 'Ti (demo)',
      items: cartItems.map(({ item, qty }) => ({
        name: item.name,
        qty,
        note: item.desc,
      })),
    }

    setState((s) => ({
      ...s,
      kitchenOrders: [newOrder, ...s.kitchenOrders],
      tables: s.tables.map((t) =>
        t.label === s.selectedTable
          ? { ...t, status: 'zasedena', server: 'Ti (demo)', minutes: 0, total: 0 }
          : t
      ),
      promet: s.promet + total,
      narocila: s.narocila + 1,
    }))
    triggerSync(`Naročilo ${orderId} poslano v kuhinjo · Miza ${state.selectedTable} zasedena · +${total.toFixed(2)}€ v analitiko`)
  }

  // KDS advance order to next status
  const handleAdvanceOrder = (orderId: string) => {
    setState((s) => ({
      ...s,
      kitchenOrders: s.kitchenOrders.map((o) => {
        if (o.id !== orderId) return o
        const next = o.status === 'nova' ? 'v-pripravi' : 'pripravljena'
        return { ...o, status: next }
      }),
    }))
    const order = state.kitchenOrders.find((o) => o.id === orderId)
    if (order) {
      const nextStatus = order.status === 'nova' ? 'v pripravi' : 'pripravljena'
      triggerSync(`${order.id} (${order.table}) → ${nextStatus}${order.status === 'v-pripravi' ? ' · miza obveščena' : ''}`)
    }
  }

  const views = [
    { key: 'pos' as const, label: 'POS Blagajna', icon: Receipt, desc: 'Natakar + Gost' },
    { key: 'kds' as const, label: 'Kuhinja (KDS)', icon: Utensils, desc: 'Kanban naročil' },
    { key: 'tables' as const, label: 'Mize', icon: LayoutGrid, desc: 'Tloris restavracije' },
    { key: 'analytics' as const, label: 'Analitika', icon: BarChart3, desc: 'AI dashboard' },
  ]

  return (
    <div>
      {/* Live sync status bar */}
      <motion.div
        animate={{ opacity: syncPulse ? 1 : 0.7, scale: syncPulse ? 1.02 : 1 }}
        transition={{ duration: 0.3 }}
        className={`mb-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
          syncPulse ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          {syncPulse && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${syncPulse ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
        </span>
        <span className="font-bold">Real-time sync aktivna</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500">
          {state.lastSync || '4 moduli sinhronizirani v živo — spremembe se takoj prikažejo v vseh pogledih'}
        </span>
      </motion.div>

      {/* View selector tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1 flex-wrap justify-center">
          {views.map((v) => {
            const badge =
              v.key === 'kds' ? state.kitchenOrders.filter((o) => o.status === 'nova').length
              : v.key === 'tables' ? state.tables.filter((t) => t.status === 'zasedena' || t.status === 'plačilo').length
              : 0
            return (
              <button
                key={v.key}
                onClick={() => setActiveView(v.key)}
                className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeView === v.key
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <v.icon className="h-4 w-4" />
                <span>{v.label}</span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">· {v.desc}</span>
                {badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold tabular-nums">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active view */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === 'pos' && <PosDemo onCheckout={handleCheckout} selectedTable={state.selectedTable} />}
        {activeView === 'kds' && <KdsView orders={state.kitchenOrders} onAdvance={handleAdvanceOrder} />}
        {activeView === 'tables' && <TablesView tables={state.tables} />}
        {activeView === 'analytics' && <AnalyticsView promet={state.promet} narocila={state.narocila} />}
      </motion.div>
    </div>
  )
}

/* ============================================================
   CASE STUDIES — konkretne pred/po metrike (conversion proof)
   ============================================================ */
const CASE_STUDIES = [
  {
    venue: 'Gostilna Pri Lovru',
    type: 'Tradicionalna gostilna',
    city: 'Ljubljana',
    duration: '4 meseci',
    avatar: 'ML',
    avatarBg: 'bg-emerald-500',
    metrics: [
      { label: 'Čas na račun', before: '3,2 min', after: '1,9 min', delta: '−41%', better: true },
      { label: 'Dnevni promet', before: '2.180 €', after: '2.640 €', delta: '+21%', better: true },
      { label: 'Odpadki hrane', before: '14%', after: '6%', delta: '−57%', better: true },
    ],
    quote: 'AI predikcija zalog je zmanjšala odpadke za več kot polovico. FURS dela sam.',
    author: 'Marko Kovač, lastnik',
  },
  {
    venue: 'Pizzeria Bellavista',
    type: 'Picerija z dostavo',
    city: 'Bled',
    duration: '6 mesecev',
    avatar: 'AN',
    avatarBg: 'bg-rose-500',
    metrics: [
      { label: 'Dostavni kanali', before: '1', after: '4', delta: '+300%', better: true },
      { label: 'Povp. račun dostave', before: '14,20 €', after: '18,90 €', delta: '+33%', better: true },
      { label: 'Čas priprave', before: '12 min', after: '8 min', delta: '−33%', better: true },
    ],
    quote: 'Wolt, Glovo in Uber Eats na enem zaslonu. KDS pospeši kuhinjo, QR pa dviguje račun.',
    author: 'Ana Novak, lastnica',
  },
  {
    venue: 'Restavracija Stara ulica',
    type: 'À la carte restavracija',
    city: 'Maribor',
    duration: '5 mesecev',
    avatar: 'TP',
    avatarBg: 'bg-amber-500',
    metrics: [
      { label: 'Zasedenost miz', before: '52%', after: '71%', delta: '+37%', better: true },
      { label: 'Stol na mizo', before: '2,1', after: '2,8', delta: '+33%', better: true },
      { label: 'Osebje na izmeno', before: '7', after: '5', delta: '−29%', better: true },
    ],
    quote: 'Rezervacije in mize na enem mestu. Manj osebja, več gostov, večji promet.',
    author: 'Tomaž Petek, direktor',
  },
] as const

function CaseStudiesSection() {
  return (
    <section id="case-studies" className="py-20 lg:py-28 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge className="mb-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Študije primerov
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Realne restavracije.{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">Realni rezultati.</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Pred in po metrikami iz treh slovenskih restavracij — po 4 do 6 mesecih uporabe Noro Lep POS.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {CASE_STUDIES.map((cs, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="p-6 h-full border-slate-200/70 shadow-sm hover:shadow-lg transition-shadow flex flex-col card-tilt">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className={`w-11 h-11 rounded-full ${cs.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {cs.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{cs.venue}</div>
                    <div className="text-xs text-slate-500">{cs.type} · {cs.city}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{cs.duration}</Badge>
                </div>

                {/* Metrics pred/po */}
                <div className="space-y-2.5 mb-4">
                  {cs.metrics.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50/70">
                      <span className="text-xs text-slate-600 font-medium flex-1 min-w-0">{m.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">{m.before}</span>
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        <span className="text-xs font-bold text-slate-900 tabular-nums">{m.after}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.better ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {m.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-700 italic leading-relaxed mb-2">&ldquo;{cs.quote}&rdquo;</p>
                  <div className="text-xs text-slate-500 font-medium">{cs.author}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Aggregate stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 tabular-nums">+24%</div>
            <div className="text-xs text-slate-600 mt-0.5">povprečni promet</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 tabular-nums">−38%</div>
            <div className="text-xs text-slate-600 mt-0.5">čas na račun</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 tabular-nums">−52%</div>
            <div className="text-xs text-slate-600 mt-0.5">odpadki hrane</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 tabular-nums">15 min</div>
            <div className="text-xs text-slate-600 mt-0.5">do prvega računa</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   ROI CALCULATOR — Interaktivni izračun prihranka
   ============================================================ */
function RoiCalculator() {
  const [mize, setMize] = useState(12)
  const [gostje, setGostje] = useState(80)
  const [racun, setRacun] = useState(16)

  // Izračuni (na podlagi raziskave: -30% čas, +18% povr. račun, +22% povratni)
  const letniPromet = mize * gostje * racun * 312 // 312 delovnih dni
  const povracunLetni = letniPromet * 0.18 // +18% povprečni račun
  const prihranekCas = mize * gostje * 0.5 * 312 // 0.5 min prihranka na račun
  const prihranekUre = Math.round(prihranekCas / 60)
  const prihranekDnev = prihranekUre * 12 // 12€/uro
  const dodatniPrometPovratni = letniPromet * 0.22 * 0.15 // 22% več povratnih, 15% od tega novi promet
  const skupajPrihranek = Math.round(povracunLetni + prihranekDnev + dodatniPrometPovratni)
  const roi = Math.round((skupajPrihranek / (49 * 12)) * 100)

  const inputs = [
    { label: 'Število miz', value: mize, set: setMize, min: 4, max: 50, step: 1, unit: 'miz', icon: LayoutGrid },
    { label: 'Dnevnih gostov', value: gostje, set: setGostje, min: 10, max: 300, step: 5, unit: 'gostov', icon: Users },
    { label: 'Povprečni račun', value: racun, set: setRacun, min: 5, max: 50, step: 1, unit: '€', icon: CreditCard },
  ]

  const results = [
    { label: 'Letni promet (trenutno)', value: `${(letniPromet / 1000).toFixed(0)}k €`, icon: TrendingUp, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: '+ Povečan povr. račun (18%)', value: `+${(povracunLetni / 1000).toFixed(1)}k €`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '+ Povratni gostje (22%)', value: `+${(dodatniPrometPovratni / 1000).toFixed(1)}k €`, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: '+ Prihranek časa', value: `${prihranekUre} ur/leto`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
      {/* Inputs */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-2"
      >
        <Card className="p-6 lg:p-8 border-slate-200 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Tvoja restavracija</h3>
              <p className="text-xs text-slate-500">Prestavi drsnike za izračun</p>
            </div>
          </div>

          <div className="space-y-6">
            {inputs.map((input, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <input.icon className="h-4 w-4 text-slate-400" />
                    {input.label}
                  </label>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-emerald-600 tabular-nums">{input.value}</span>
                    <span className="text-xs text-slate-400">{input.unit}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={input.min}
                  max={input.max}
                  step={input.step}
                  value={input.value}
                  onChange={(e) => input.set(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((input.value - input.min) / (input.max - input.min)) * 100}%, #e2e8f0 ${((input.value - input.min) / (input.max - input.min)) * 100}%, #e2e8f0 100%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{input.min}</span>
                  <span>{input.max}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-2">Na podlagi raziskave 542 restavracij:</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-emerald-50">
                <div className="text-sm font-bold text-emerald-600">+18%</div>
                <div className="text-[9px] text-slate-500">povr. račun</div>
              </div>
              <div className="p-2 rounded-lg bg-rose-50">
                <div className="text-sm font-bold text-rose-600">+22%</div>
                <div className="text-[9px] text-slate-500">povratni</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50">
                <div className="text-sm font-bold text-amber-600">−30%</div>
                <div className="text-[9px] text-slate-500">čas</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="lg:col-span-3"
      >
        <Card className="p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-2xl overflow-hidden relative">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/20 blur-3xl rounded-full" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Projeciran letni prihranek</span>
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <motion.span
                key={skupajPrihranek}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent tabular-nums"
              >
                +{skupajPrihranek.toLocaleString('sl-SI')} €
              </motion.span>
              <span className="text-sm text-slate-400">/leto</span>
            </div>

            {/* ROI badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">
                ROI: {roi}x naložbe · povračilo v {Math.max(1, Math.ceil(365 / (roi * 12 / 30)))} dneh
              </span>
            </div>

            {/* Breakdown */}
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {results.map((r, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700"
                >
                  <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center shrink-0`}>
                    <r.icon className={`h-4 w-4 ${r.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 truncate">{r.label}</div>
                    <div className="text-lg font-bold text-white tabular-nums">{r.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-6 text-sm shadow-lg shadow-emerald-500/30" data-track="cta_click" data-track-label="roi_zacni_prihranjevati" data-track-section="roi">
                <Zap className="h-4 w-4 mr-2" />
                Začni prihranjevati
              </Button>
              <Button size="lg" variant="outline" className="h-11 px-6 text-sm bg-transparent border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white">
                Razgovor s svetovalcem
              </Button>
            </div>

            <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
              * Projektne vrednosti temeljijo na povprečju 542 slovenskih restavracij. Dejanski rezultati se razlikujejo glede na koncept, lokacijo in obseg poslovanja.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

/* ============================================================
   COMPETITION COMPARISON — Noro Lep vs slovenske blagajne
   ============================================================ */
const COMPETITORS = [
  {
    name: 'Noro Lep POS',
    tag: 'Naš izdelek',
    accent: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-600',
    highlight: true,
    features: {
      furs: true,
      ai: true,
      kds: true,
      qr: true,
      offline: true,
      sloLang: true,
      loyalty: true,
      price: '0€',
      setup: '15 min',
      realTimeSync: true,
      roiCalc: true,
    },
  },
  {
    name: 'TRONpos',
    tag: 'SLO',
    accent: 'from-orange-500 to-red-500',
    badge: 'bg-orange-500',
    highlight: false,
    features: {
      furs: true,
      ai: false,
      kds: 'Dodatek',
      qr: false,
      offline: 'Omejeno',
      sloLang: true,
      loyalty: false,
      price: 'Po povpraševanju',
      setup: '2-3 dni',
      realTimeSync: false,
      roiCalc: false,
    },
  },
  {
    name: 'SpletsisPOS',
    tag: 'SLO',
    accent: 'from-blue-500 to-indigo-500',
    badge: 'bg-blue-500',
    highlight: false,
    features: {
      furs: true,
      ai: false,
      kds: 'Dodatek',
      qr: false,
      offline: 'Omejeno',
      sloLang: true,
      loyalty: false,
      price: 'Po povpraševanju',
      setup: '1-2 dni',
      realTimeSync: false,
      roiCalc: false,
    },
  },
  {
    name: 'POS Elektronček',
    tag: 'SLO',
    accent: 'from-red-500 to-rose-500',
    badge: 'bg-red-500',
    highlight: false,
    features: {
      furs: true,
      ai: false,
      kds: 'Dodatek',
      qr: false,
      offline: 'Omejeno',
      sloLang: true,
      loyalty: false,
      price: 'Po povpraševanju',
      setup: '1-2 dni',
      realTimeSync: false,
      roiCalc: false,
    },
  },
  {
    name: 'Propos (ERPO)',
    tag: 'SLO',
    accent: 'from-purple-500 to-violet-500',
    badge: 'bg-purple-500',
    highlight: false,
    features: {
      furs: true,
      ai: false,
      kds: 'Dodatak',
      qr: false,
      offline: 'Omejeno',
      sloLang: true,
      loyalty: false,
      price: 'Po povpraševanju',
      setup: '2-3 dni',
      realTimeSync: false,
      roiCalc: false,
    },
  },
]

const COMPARISON_ROWS = [
  { key: 'furs', label: 'FURS ZOI/EOR (Slovenija)', type: 'bool' as const },
  { key: 'sloLang', label: 'Slovenski jezik', type: 'bool' as const },
  { key: 'ai', label: 'AI predikcija prometa', type: 'bool' as const },
  { key: 'kds', label: 'Kuhinjski zaslon (KDS)', type: 'mixed' as const },
  { key: 'qr', label: 'QR naročanje za goste', type: 'bool' as const },
  { key: 'offline', label: 'Offline način', type: 'mixed' as const },
  { key: 'loyalty', label: 'Vernostni program', type: 'bool' as const },
  { key: 'realTimeSync', label: 'Real-time sync (POS→KDS→Analitika)', type: 'bool' as const },
  { key: 'roiCalc', label: 'ROI kalkulator na strani', type: 'bool' as const },
  { key: 'setup', label: 'Čas do prvega računa', type: 'text' as const },
  { key: 'price', label: 'Cena (mesec)', type: 'text' as const },
]

function CompetitionComparison() {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-xl">
      {/* Header row */}
      <div className="grid grid-cols-6 sm:grid-cols-6 bg-slate-50 border-b border-slate-200">
        <div className="p-4 text-xs font-semibold text-slate-500 sticky left-0 bg-slate-50 z-10">
          Funkcija
        </div>
        {COMPETITORS.map((c) => (
          <div key={c.name} className={`p-4 text-center border-l border-slate-200 ${c.highlight ? 'bg-emerald-50' : ''}`}>
            <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1 ${c.badge}`}>
              {c.tag}
            </div>
            <div className={`text-xs sm:text-sm font-bold leading-tight ${c.highlight ? 'text-emerald-700' : 'text-slate-700'}`}>
              {c.name}
            </div>
          </div>
        ))}
      </div>

      {/* Feature rows */}
      {COMPARISON_ROWS.map((row, idx) => (
        <div
          key={row.key}
          className={`grid grid-cols-6 border-b border-slate-100 last:border-0 ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
        >
          <div className="p-3 text-xs sm:text-sm font-medium text-slate-700 sticky left-0 z-10 bg-inherit">
            {row.label}
          </div>
          {COMPETITORS.map((c) => {
            const value = c.features[row.key as keyof typeof c.features]
            const isOurs = c.highlight
            return (
              <div key={c.name} className={`p-3 flex items-center justify-center border-l border-slate-100 ${isOurs ? 'bg-emerald-50/40' : ''}`}>
                {row.type === 'bool' ? (
                  value === true ? (
                    <CheckCircle2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isOurs ? 'text-emerald-600' : 'text-slate-400'}`} />
                  ) : (
                    <Minus className="h-4 w-4 text-slate-300" />
                  )
                ) : row.type === 'text' ? (
                  <span className={`text-xs sm:text-sm font-bold ${isOurs ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {String(value)}
                  </span>
                ) : (
                  // mixed
                  value === true ? (
                    <CheckCircle2 className={`h-4 w-4 sm:h-5 sm:w-5 ${isOurs ? 'text-emerald-600' : 'text-slate-400'}`} />
                  ) : value === false ? (
                    <Minus className="h-4 w-4 text-slate-300" />
                  ) : (
                    <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{String(value)}</span>
                  )
                )}
              </div>
            )
          })}
        </div>
      ))}
    </Card>
  )
}

/* ============================================================
   INTERFACE COMPARISON — 4 vmesniki vs svetovni liderji
   ============================================================ */
const INTERFACE_COMPARISONS = [
  {
    title: 'Blagajniški vmesnik',
    subtitle: 'Natakar (TEXT gumbi)',
    ourScore: 6.3,
    competitorScore: 8.5,
    competitor: 'Toast POS',
    competitorCountry: '🇺🇸',
    winner: 'competitor' as const,
    ourImg: '/pos-interfaces/ours-pos-natakar.png',
    compImg: '/pos-ui-research/real/toast-2.png',
    ourStrengths: ['Clean minimal design', '24 artiklov na zaslon', 'Barvne kategorije'],
    compStrengths: ['Modularni layout', 'Color-coded sekcije', 'Split-screen order/payment', 'Enterprise polish'],
    verdict: 'Toast zmaga — a primerjamo naš demo z 10-letnim produktom. V produkcijski verziji bomo dohiteli z modulnim layoutom.',
    icon: Receipt,
  },
  {
    title: 'Kuhinjski zaslon (KDS)',
    subtitle: 'Kanban naročil v 3 stolpcih',
    ourScore: 9.0,
    competitorScore: 5.5,
    competitor: 'Lightspeed',
    competitorCountry: '🇨🇦',
    winner: 'ours' as const,
    ourImg: '/pos-interfaces/ours-kds.png',
    compImg: '/pos-ui-research/real/ls-1.png',
    ourStrengths: ['3-column kanban (Nova/V pripravi/Pripravljena)', 'Timers z alerti (>10min)', 'Opombe za kuharje (brez gljiv)', 'Advance gumbi za workflow'],
    compStrengths: ['POS-centric', 'Osnovni order view'],
    verdict: 'Naš KDS zmaga! Lightspeed je POS-centric, naš je kitchen-centric z jasnim workflow-om nova→priprava→pripravljeno.',
    icon: Utensils,
  },
  {
    title: 'Vmesnik za goste',
    subtitle: 'Online ordering s slikami',
    ourScore: 7.5,
    competitorScore: 8.5,
    competitor: 'Shopify POS',
    competitorCountry: '🇨🇦',
    winner: 'competitor' as const,
    ourImg: '/pos-interfaces/ours-pos-gost.png',
    compImg: '/pos-ui-research/real/sh-1.png',
    ourStrengths: ['AI-generirane slike jedi', 'Kategorije + opisi', 'Cart z DDV'],
    compStrengths: ['Vibrant teal brand', 'Integrated cart+checkout', 'Promo tiles (SUMMER23)', 'Poliran retail flow'],
    verdict: 'Shopify zmaga v conversion optimization — a je retail-focused. Za restaurant bomo dodali promo tiles in boljši checkout flow.',
    icon: ShoppingBag,
  },
  {
    title: 'Upravljanje miz',
    subtitle: 'Tloris restavracije',
    ourScore: 8.5,
    competitorScore: 6.0,
    competitor: 'TouchBistro',
    competitorCountry: '🇨🇦',
    winner: 'ours' as const,
    ourImg: '/pos-interfaces/ours-tables.png',
    compImg: '/pos-ui-research/real/tb-1.png',
    ourStrengths: ['12 miz v grid layout-u', '4 barvno kodirani statusi', 'Server + čas + znesek na kartici', 'At-a-glance overview'],
    compStrengths: ['Order-centric', 'Small table map'],
    verdict: 'Naš tloris zmaga! TouchBistro je order-focused, naš je floor-plan-focused — boljše za hostese in managerje.',
    icon: LayoutGrid,
  },
]

function InterfaceComparison() {
  const wins = INTERFACE_COMPARISONS.filter((i) => i.winner === 'ours').length
  const losses = INTERFACE_COMPARISONS.filter((i) => i.winner === 'competitor').length

  return (
    <div>
      {/* Score summary bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex items-center justify-center gap-4"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">{wins} zmage</span>
        </div>
        <span className="text-slate-400 text-sm">vs</span>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200">
          <Minus className="h-5 w-5 text-slate-400" />
          <span className="text-sm font-bold text-slate-600">{losses} poraza</span>
        </div>
      </motion.div>

      <div className="space-y-6">
        {INTERFACE_COMPARISONS.map((comp, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
          >
            <Card className={`overflow-hidden ${comp.winner === 'ours' ? 'border-emerald-300 shadow-lg' : 'border-slate-200 shadow-sm'}`}>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${comp.winner === 'ours' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <comp.icon className={`h-5 w-5 ${comp.winner === 'ours' ? 'text-emerald-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{comp.title}</h3>
                    <p className="text-xs text-slate-500">{comp.subtitle}</p>
                  </div>
                </div>
                <Badge className={comp.winner === 'ours' ? 'bg-emerald-600 text-white hover:bg-emerald-600 border-0' : 'bg-slate-400 text-white hover:bg-slate-400 border-0'}>
                  {comp.winner === 'ours' ? '🏆 Zmagovalca' : 'Konkurent vodi'}
                </Badge>
              </div>

              {/* Side-by-side screenshots */}
              <div className="grid md:grid-cols-2 gap-0">
                {/* Ours */}
                <div className="p-4 border-r border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
                        <Receipt className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">Noro Lep POS</span>
                    </div>
                    <div className={`text-2xl font-bold tabular-nums ${comp.winner === 'ours' ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {comp.ourScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 mb-3">
                    { }
                    <img src={comp.ourImg} alt="Noro Lep" loading="lazy" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="space-y-1">
                    {comp.ourStrengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitor */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{comp.competitorCountry}</span>
                      <span className="text-sm font-bold text-slate-700">{comp.competitor}</span>
                    </div>
                    <div className={`text-2xl font-bold tabular-nums ${comp.winner === 'competitor' ? 'text-amber-600' : 'text-slate-400'}`}>
                      {comp.competitorScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 mb-3">
                    { }
                    <img src={comp.compImg} alt={comp.competitor} loading="lazy" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="space-y-1">
                    {comp.compStrengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <Minus className="h-3 w-3 text-slate-300 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verdict */}
              <div className={`p-4 border-t ${comp.winner === 'ours' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-2">
                  <Scale className={`h-4 w-4 shrink-0 mt-0.5 ${comp.winner === 'ours' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <p className="text-xs text-slate-600 leading-relaxed italic">{comp.verdict}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Honest summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-8"
      >
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Scale className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Iskren zaključek</div>
                <div className="text-lg font-bold">2 zmage · 2 poraza</div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-200 leading-relaxed mb-4">
                <strong className="text-emerald-400">Zmagamo:</strong> KDS (9/10) in upravljanje miz (8.5/10) —
                ker smo <strong className="text-white">kitchen-centric in floor-plan-centric</strong>, kar je boljše za
                restavracije kot POS-centric pristop Lightspeed-a in TouchBistro-a.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-amber-400">Izgubimo:</strong> POS natakar (6.3 vs Toast 8.5) in Gost view (7.5 vs Shopify 8.5) —
                ker primerjamo <strong className="text-white">demo na landing page-u</strong> z 10-letnimi produktnimi POS-i.
                V produkcijski verziji bomo dodali modularni layout in promo tiles.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
                  ✓ KDS zmaga (9/10)
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
                  ✓ Tables zmaga (8.5/10)
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/20">
                  ⚠ POS natakar (6.3 vs 8.5)
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/20">
                  ⚠ Gost view (7.5 vs 8.5)
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

/* ============================================================
   LANGUAGE SWITCHER — SLO/EN/DE/IT
   ============================================================ */
function LanguageSwitcher() {
  const [lang, setLang] = useState<'SLO' | 'EN' | 'DE' | 'IT'>('SLO')
  const [open, setOpen] = useState(false)
  const langs: Array<{ code: 'SLO' | 'EN' | 'DE' | 'IT'; flag: string; name: string }> = [
    { code: 'SLO', flag: '🇸🇮', name: 'Slovenščina' },
    { code: 'EN', flag: '🇬🇧', name: 'English' },
    { code: 'DE', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'IT', flag: '🇮🇹', name: 'Italiano' },
  ]
  const current = langs.find((l) => l.code === lang)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.code}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50"
        >
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              data-track="language_change"
              data-track-label={l.code}
              data-track-section="header"
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition ${
                l.code === lang ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.name}</span>
              {l.code === lang && <CheckCircle2 className="h-3 w-3 ml-auto text-emerald-600" />}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}

/* ============================================================
   VIDEO DEMO MODAL
   ============================================================ */
function VideoDemoModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="lg"
        variant="outline"
        className="h-12 px-7 text-base border-slate-300 hover:bg-slate-50"
        onClick={() => setOpen(true)}
        data-track="video_open"
        data-track-label="oglej_si_demo"
        data-track-section="hero"
      >
        <span className="relative flex h-5 w-5 mr-2 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 animate-ping" />
          <span className="relative inline-flex h-5 w-5 rounded-full bg-emerald-500 items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="h-2.5 w-2.5 ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
        Oglej si demo (2 min)
      </Button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Noro Lep POS — Demo</div>
                  <div className="text-[10px] text-slate-500">2 min · 4 moduli v živo</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
                aria-label="Zapri"
              >
                <Minus className="h-4 w-4 rotate-45" />
              </button>
            </div>
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
              {/* Decorative grid */}
              <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />
              <div className="relative text-center text-white p-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="h-8 w-8 ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Demo predstavitev</h3>
                <p className="text-sm text-slate-300 mb-4 max-w-md">
                  Pregled vseh 4 modulov: POS blagajna, KDS, mize in analitika z real-time sync.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>2:14</span>
                  <span>·</span>
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span>Real-time sync demo</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between bg-slate-50">
              <p className="text-xs text-slate-500">Ali pa poskusi <strong>interaktivni demo</strong> spodaj — brez registracije.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <ScanLine className="h-3.5 w-3.5 mr-1.5" />
                Poskusi živo
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

/* ============================================================
   SCROLL PROGRESS BAR — emerald bar at top showing scroll
   ============================================================ */
function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[60] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/* ============================================================
   BACK TO TOP — floating button appears on scroll
   ============================================================ */
function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 group"
      aria-label="Nazaj na vrh"
    >
      <ArrowRight className="h-5 w-5 -rotate-90 group-hover:-translate-y-0.5 transition-transform" />
    </motion.button>
  )
}

/* ============================================================
   SECTION DOTS — vertikalni navigator za 28 sekcij
   ============================================================ */
const NAV_SECTIONS = [
  { id: 'demo', label: 'Demo' },
  { id: 'command-center', label: 'Dashboard' },
  { id: 'placila', label: 'Plačila' },
  { id: 'loyalty', label: 'Vernostni' },
  { id: 'inventar', label: 'Inventar' },
  { id: 'dostava', label: 'Dostava' },
  { id: 'qr-ordering', label: 'QR Naročanje' },
  { id: 'ai-prediction', label: 'AI Predikcija' },
  { id: 'menu-engineering', label: 'Menu Engineering' },
  { id: 'osebje', label: 'Osebje' },
  { id: 'rezervacije', label: 'Rezervacije' },
  { id: 'integracije', label: 'Integracije' },
  { id: 'onboarding', label: 'Hitri začetek' },
  { id: 'varnost', label: 'Varnost' },
  { id: 'verige', label: 'Verige' },
  { id: 'eko', label: 'Eko & stroški' },
  { id: 'mnenja', label: 'Mnenja' },
  { id: 'case-studies', label: 'Študije primerov' },
  { id: 'roi', label: 'ROI Kalkulator' },
  { id: 'cene', label: 'Cene' },
  { id: 'faq', label: 'FAQ' },
] as const

function SectionDots() {
  const [activeId, setActiveId] = useState<string>('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!visible) return null

  return (
    <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-1.5" aria-label="Hitra navigacija sekcij">
      {NAV_SECTIONS.map(({ id, label }) => {
        const isActive = activeId === id
        return (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className="group flex items-center justify-end gap-2"
            aria-label={`Pojdi na ${label}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all whitespace-nowrap ${
              isActive
                ? 'bg-emerald-600 text-white opacity-100'
                : 'bg-white/90 text-slate-700 opacity-0 group-hover:opacity-100 shadow-sm'
            }`}>
              {label}
            </span>
            <span className={`rounded-full transition-all ${
              isActive
                ? 'w-2.5 h-2.5 bg-emerald-600'
                : 'w-1.5 h-1.5 bg-slate-300 group-hover:bg-emerald-400'
            }`} />
          </button>
        )
      })}
    </nav>
  )
}

/* ============================================================
   TRUST BAR — certifications & compliance badges
   ============================================================ */
function TrustBar() {
  const badges = [
    { icon: ShieldCheck, label: 'FURS ZDavP-2P', sub: 'ZDavP-2P 2025 (UL 100/25)' },
    { icon: Shield, label: 'GDPR', sub: 'EU zaščita podatkov' },
    { icon: Globe, label: 'ISO 27001', sub: 'Info security' },
    { icon: Wifi, label: '99.9% SLA', sub: 'Garancija delovanja' },
    { icon: CreditCard, label: 'PCI DSS', sub: 'Varno plačevanje' },
    { icon: Sparkles, label: 'AI Certified', sub: 'Predikcija prometa' },
  ]

  return (
    <section className="py-6 border-b border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <badge.icon className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{badge.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{badge.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   SECURITY & COMPLIANCE — encryption, MFA, backup, offline, GDPR
   ============================================================ */
const SECURITY_FEATURES = [
  {
    icon: Shield,
    title: 'AES-256 šifriranje',
    desc: 'Vsi podatki šifrirani at-rest in in-transit (TLS 1.3). Banka-standard varnosti za tvoje poslovne podatke.',
    badge: '256-bit',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: ShieldCheck,
    title: 'MFA / 2FA avtentikacija',
    desc: 'Multi-factor avtentikacija za vse uporabnike. Passkey + hardware key podpora (ne samo SMS).',
    badge: 'Passkey',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    icon: Package,
    title: 'Avtomatski backup',
    desc: 'Vsakih 15 min. 30-dnevna zgodovina. Ransomware-resistant (immutable backups). Instant restore.',
    badge: '15 min',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Wifi,
    title: 'Offline-first arhitektura',
    desc: 'POS dela brez internetne povezave. Naročila in računi shranjeni lokalno, samodejno sync ko nazaj online.',
    badge: '24/7',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Users,
    title: 'Role-based dostop (RBAC)',
    desc: 'Skrbnik, lastnik, natakar, kuhar — vsak vidi samo svoje. Audit log za vsako akcijo. Data masking.',
    badge: '4 role',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    icon: Shield,
    title: 'GDPR + FURS compliance',
    desc: 'EU GDPR skladnost. FURS ZDavP-2P 2025 certifikat. Pravica do pozabe. Export/purge na zahtevo.',
    badge: 'GDPR',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
] as const

const SECURITY_STATS = [
  { value: '99.9%', label: 'SLA uptime', sub: 'garancija v pogodbi' },
  { value: 'AES-256', label: 'šifriranje', sub: 'banka-standard' },
  { value: '30 dni', label: 'backup zgodovina', sub: 'immutable' },
  { value: '0', label: 'breaches', sub: 'od lansiranja 2026' },
] as const

function SecuritySection() {
  return (
    <section id="varnost" className="py-16 lg:py-20 bg-slate-950 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50rem] h-[25rem] bg-emerald-500/10 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge className="mb-3 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Varnost & skladnost
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Tvoji podatki <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-text">varni</span>. Tvoja restavracija zaščitena.
          </h2>
          <p className="mt-2 text-base text-slate-400">Banka-standard šifriranje, MFA, avtomatski backup in offline-first arhitektura. GDPR + FURS ZDavP-2P compliant.</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {SECURITY_STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center"
            >
              <div className="text-2xl lg:text-3xl font-bold text-emerald-400 tabular-nums">{s.value}</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* 6 security features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECURITY_FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.bg} ${f.color}`}>{f.badge}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Compliance badges row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50"
        >
          <div className="text-center mb-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Certifikati & skladnost</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {[
              { label: 'GDPR', sub: 'EU 2016/679' },
              { label: 'FURS ZDavP-2P', sub: 'UL 100/25' },
              { label: 'PCI DSS', sub: 'Level 1' },
              { label: 'ISO 27001', sub: 'InfoSec' },
              { label: 'SOC 2', sub: 'Type II' },
            ].map((c) => (
              <div key={c.label} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-1.5">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">{c.label}</div>
                <div className="text-[9px] text-slate-500">{c.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>0 security breaches od lansiranja 2026 · 24/7 monitoring · &lt; 15min incident response</span>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   MULTI-LOCATION & MOBILE — chain management + owner app
   ============================================================ */
const CHAIN_LOCATIONS = [
  { name: 'Gostilna Pri Lovru', city: 'Ljubljana', revenue: 4280, orders: 247, status: 'open', staff: 6, color: 'bg-emerald-500', trend: '+18%' },
  { name: 'Pizzeria Bellavista', city: 'Bled', revenue: 3140, orders: 189, status: 'open', staff: 5, color: 'bg-cyan-500', trend: '+12%' },
  { name: 'Restavracija Stara ulica', city: 'Maribor', revenue: 2830, orders: 197, status: 'busy', staff: 7, color: 'bg-purple-500', trend: '+24%' },
] as const

const MOBILE_FEATURES = [
  { icon: TrendingUp, title: 'Live promet', desc: 'Spremljaj promet vseh lokacij v realnem času' },
  { icon: Bell, title: 'Push alerti', desc: 'Kritični dogodki na telefon — npr. zmanjkalo zalog' },
  { icon: Users, title: 'Osebje upravljanje', desc: 'Odobri izmene, spremljaj prisotnost' },
  { icon: Receipt, title: 'Računi vpogled', desc: 'Vsi računi vseh lokacij na dlani' },
] as const

function MultiLocationSection() {
  const [activeLoc, setActiveLoc] = useState(0)
  const totalRevenue = CHAIN_LOCATIONS.reduce((s, l) => s + l.revenue, 0)
  const totalOrders = CHAIN_LOCATIONS.reduce((s, l) => s + l.orders, 0)
  const totalStaff = CHAIN_LOCATIONS.reduce((s, l) => s + l.staff, 0)

  return (
    <section id="verige" className="py-16 lg:py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-purple-100 text-purple-800 hover:bg-purple-100">
            <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
            Verige & mobile
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Ena blagajna za <span className="bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent animate-gradient-text">vse lokacije</span>. Nadzor v žepu.
          </h2>
          <p className="mt-2 text-base text-slate-600">Centraliziran meni, poenotene cene, skupna poročila. Lastnik spremlja vse lokacije z mobilne aplikacije.</p>
        </div>

        {/* Chain overview stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-center">
            <div className="text-2xl font-bold text-purple-600 tabular-nums">{CHAIN_LOCATIONS.length}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">lokacij</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">€{totalRevenue.toLocaleString('sl-SI')}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">skupni dnevni promet</div>
          </div>
          <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100 text-center">
            <div className="text-2xl font-bold text-cyan-600 tabular-nums">{totalOrders}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">skupna naročila</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
            <div className="text-2xl font-bold text-amber-600 tabular-nums">{totalStaff}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">zaposlenih danes</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEVO: Lokacije list (3/5) */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Lokacije v verigi</span>
                <span className="text-[10px] text-slate-400">{CHAIN_LOCATIONS.length} aktivnih</span>
              </div>
              <div className="divide-y divide-slate-50">
                {CHAIN_LOCATIONS.map((loc, i) => {
                  const isActive = i === activeLoc
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveLoc(i)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-purple-50/60' : 'hover:bg-slate-50/60'}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${loc.color} ${loc.status === 'busy' ? 'animate-pulse' : ''} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">{loc.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${loc.status === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {loc.status === 'busy' ? 'PROMET' : 'ODPRTO'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{loc.city} · {loc.staff} delavcev</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-900 tabular-nums">€{loc.revenue.toLocaleString('sl-SI')}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold tabular-nums">{loc.trend}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Skupaj: <span className="font-bold text-slate-700">€{totalRevenue.toLocaleString('sl-SI')}</span></span>
                <button className="text-[11px] text-purple-600 font-semibold hover:text-purple-800">+ Dodaj lokacijo</button>
              </div>
            </Card>

            {/* Centralized menu sync */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-cyan-50 border border-purple-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Centraliziran meni sync</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Spremeni ceno za &ldquo;Čevapi s kajmakom&rdquo; na eni lokaciji → <span className="font-semibold text-purple-700">sinhronizirano v vseh 3 lokacijah v 2 sekundah</span>. Poenostavi modifierje, combo pakete, sezonske menije.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> En meni, več lokacij</span>
                <span>·</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> 2s sync</span>
                <span>·</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Rollback</span>
              </div>
            </motion.div>
          </div>

          {/* DESNO: Mobile owner app (2/5) */}
          <div className="lg:col-span-2">
            <Card className="p-5 border-slate-200/70 shadow-sm h-full">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 mb-2">
                  <Smartphone className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Lastnik app</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Nadzor v žepu</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">iOS + Android · brezplačno</p>
              </div>

              {/* Phone mockup */}
              <div className="mx-auto max-w-[180px] mb-4">
                <div className="rounded-2xl bg-slate-900 p-2 shadow-xl">
                  <div className="rounded-xl bg-white overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-600 to-cyan-600 p-3 text-white">
                      <div className="text-[9px] opacity-80 uppercase">Skupni promet</div>
                      <div className="text-xl font-bold tabular-nums">€{totalRevenue.toLocaleString('sl-SI')}</div>
                      <div className="text-[9px] opacity-90 mt-0.5">3 lokacije · live</div>
                    </div>
                    <div className="p-2 space-y-1.5">
                      {CHAIN_LOCATIONS.map((loc, i) => (
                        <div key={i} className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-600 truncate flex-1">{loc.name.split(' ')[0]}</span>
                          <span className="font-bold text-slate-900 tabular-nums">€{loc.revenue.toLocaleString('sl-SI')}</span>
                          <span className="text-emerald-600 ml-1">{loc.trend}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile features */}
              <div className="space-y-2">
                {MOBILE_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <f.icon className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900">{f.title}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* App store buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-center">
                  <div className="text-[8px] opacity-70">Prenesi na</div>
                  <div className="text-xs font-bold">App Store</div>
                </div>
                <div className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-center">
                  <div className="text-[8px] opacity-70">Prenesi na</div>
                  <div className="text-xs font-bold">Google Play</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   SUSTAINABILITY & COST CONTROL — eko + finančna optimizacija
   ============================================================ */
const SUSTAINABILITY_METRICS = [
  {
    icon: '🌱',
    value: '−55%',
    label: 'manj odpadkov hrane',
    desc: 'AI predikcija povpraševanja zmanjša prekomerno nabavo. Vsak saved kg = manj CO₂ + večji profit.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    trend: '−420 kg/mesec',
  },
  {
    icon: '⚡',
    value: '−18%',
    label: 'nižji stroški energije',
    desc: 'Pametno načrtovanje izmen (peak hours) + optimizacija delovanja opreme. Manj kWh, manj račun.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    trend: '€180/mesec prihranka',
  },
  {
    icon: '📊',
    value: '100%',
    label: 'avtomatski DDV export',
    desc: 'Samodejni export DDV obračuna v Pantheon/Minimax. Brez ročnega prepisovanja, brez napak.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    trend: '8h prihranka/mesec',
  },
  {
    icon: '💰',
    value: '+24%',
    label: 'višji neto profit',
    desc: 'Cost control dashboard: food cost %, labor %, prime costs. AI opozori ko margin pada.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    trend: 'real-time P&L',
  },
] as const

const ACCOUNTING_FEATURES = [
  { label: 'P&L izjava', desc: 'Avtomatski mesečni P&L — brez čakanja na računovodjo', icon: BarChart3 },
  { label: 'Food cost %', desc: 'Spremljaj food cost v realnem času, ne na koncu meseca', icon: Package },
  { label: 'Labor cost %', desc: 'Labor stroški vs promet — AI opozori če gre nad 30%', icon: Users },
  { label: 'DDV obračun', desc: '22% + 9.5% + 5% avtomatsko. Export v Pantheon/Minimax/Datec', icon: Receipt },
  { label: 'Payroll export', desc: 'Ure delavcev izmen → izplačilo. Import v Excel/PDF', icon: Clock },
  { label: 'Cash flow', desc: 'Dnevni/tedenski/mesečni cash flow. Predictive analytics', icon: TrendingUp },
] as const

function SustainabilitySection() {
  return (
    <section id="eko" className="py-16 lg:py-20 bg-gradient-to-b from-emerald-50/40 to-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Eko & stroški
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Manj odpadkov. <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-text">Več profit</span>. Boljši planet.
          </h2>
          <p className="mt-2 text-base text-slate-600">AI zmanjša odpadke za 55%, niža stroške energije in avtomatizira računovodstvo. Dobre prakse + nižji stroški = win-win.</p>
        </div>

        {/* 4 ključne metrike */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {SUSTAINABILITY_METRICS.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`p-4 rounded-2xl ${m.bg} border border-slate-200/70 card-tilt`}
            >
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className={`text-3xl font-bold tabular-nums ${m.color}`}>{m.value}</div>
              <div className="text-xs font-semibold text-slate-700 mt-0.5">{m.label}</div>
              <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{m.desc}</div>
              <div className={`text-[10px] font-bold mt-2 ${m.color}`}>{m.trend}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEVO: Accounting automation features */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Avtomatsko računovodstvo</h3>
            </div>
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="divide-y divide-slate-50">
                {ACCOUNTING_FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <f.icon className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{f.label}</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{f.desc}</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* DESNO: Food waste + CO2 tracking */}
          <div className="space-y-4">
            {/* Food waste tracker */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🌱</span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Sledenje CO₂ & odpadkov</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center p-2 rounded-lg bg-white/60">
                  <div className="text-xl font-bold text-emerald-700 tabular-nums">−420 kg</div>
                  <div className="text-[10px] text-slate-600">hrana rešena/mesec</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/60">
                  <div className="text-xl font-bold text-emerald-700 tabular-nums">−1.050 kg</div>
                  <div className="text-[10px] text-slate-600">CO₂ zmanjšano/mesec</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vsak rešen kg hrane = <span className="font-semibold text-emerald-700">2,5 kg manj CO₂</span>. Letno: <span className="font-bold">5.040 kg hrane + 12.600 kg CO₂</span> prihranjeno.
              </p>
              <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '55%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Cilj: −55% odpadkov · trenutno: −55% ✓</div>
            </motion.div>

            {/* Energy cost tracking */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚡</span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Energetski stroški</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Prej (brez optimizacije)</span>
                  <span className="font-bold text-rose-600 line-through">€1.000/mesec</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Zdaj (AI optimizacija)</span>
                  <span className="font-bold text-emerald-600">€820/mesec</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200">
                  <span className="text-slate-600">Letni prihranek</span>
                  <span className="font-bold text-amber-700">€2.160</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom impact summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-6 p-4 rounded-2xl bg-slate-900 text-white text-center"
        >
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Skupni letni vpliv</div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              <span><span className="font-bold text-white">12.600 kg</span> <span className="text-slate-400">manj CO₂</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span><span className="font-bold text-white">€8.920</span> <span className="text-slate-400">prihranek</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <span><span className="font-bold text-white">96 ur</span> <span className="text-slate-400">manj admin</span></span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   LIVE SOCIAL PROOF — sticky toast: "X gostiln se je pridružilo"
   ============================================================ */
const SOCIAL_PROOF_EVENTS = [
  { city: 'Ljubljana', venue: 'Gostilna Pri Lovru', action: 'se je pridružila' },
  { city: 'Maribor', venue: 'Restavracija Stara ulica', action: 'je začela z Noro Lep' },
  { city: 'Bled', venue: 'Pizzeria Bellavista', action: 'se je pridružila' },
  { city: 'Kranj', venue: 'Okrepčevalnica Pri Tonetu', action: 'je prešla na Noro Lep' },
  { city: 'Celje', venue: 'Gostilna Zlati lev', action: 'se je pridružila' },
  { city: 'Koper', venue: 'Ribji bistro Marina', action: 'je začela z Noro Lep' },
  { city: 'Novo mesto', venue: 'Pivnica Krka', action: 'se je pridružila' },
  { city: 'Portorož', venue: 'Restavracija Riviera', action: 'je prešla na Noro Lep' },
  { city: 'Velenje', venue: 'Gostilna Pri Joži', action: 'se je pridružila' },
  { city: 'Murska Sobota', venue: 'Okrepčevalnica Ponta', action: 'je začela z Noro Lep' },
] as const

function LiveSocialProof() {
  const [visible, setVisible] = useState(false)
  const [evt, setEvt] = useState<{ city: string; venue: string; action: string; minsAgo: number } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const idxRef = useRef(0)

  useEffect(() => {
    if (dismissed) return
    let hideTimer: ReturnType<typeof setTimeout>
    const cycle = () => {
      const e = SOCIAL_PROOF_EVENTS[idxRef.current % SOCIAL_PROOF_EVENTS.length]
      idxRef.current++
      setEvt({ city: e.city, venue: e.venue, action: e.action, minsAgo: 1 + Math.floor(Math.random() * 14) })
      setVisible(true)
      hideTimer = setTimeout(() => setVisible(false), 5500)
    }
    const firstShow = setTimeout(cycle, 4000)
    const interval = setInterval(cycle, 14000)
    return () => { clearTimeout(firstShow); clearTimeout(hideTimer); clearInterval(interval) }
  }, [dismissed])

  if (dismissed || !evt) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-40 max-w-[300px] hidden sm:block"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200/80 p-3 flex items-start gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Utensils className="h-4 w-4 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {evt.venue}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {evt.action} <span className="font-medium text-emerald-600">Noro Lep POS</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-slate-400">📍 {evt.city}</span>
                <span className="text-[10px] text-slate-400">· pred {evt.minsAgo} min</span>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-300 hover:text-slate-500 shrink-0 -mt-1 -mr-1 p-1"
              aria-label="Zapri"
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-45" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ============================================================
   MOBILE MENU — hamburger za mobile
   ============================================================ */
function MobileMenu() {
  const [open, setOpen] = useState(false)
  const items = [
    { label: 'Demo', href: '#demo' },
    { label: 'Funkcije', href: '#funkcije' },
    { label: 'Primerjava', href: '#primerjava' },
    { label: 'Vmesniki', href: '#vmesniki' },
    { label: 'Mnenja', href: '#mnenja' },
    { label: 'ROI', href: '#roi' },
    { label: 'Cene', href: '#cene' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100 transition"
        aria-label={open ? 'Zapri meni' : 'Odpri meni'}
        aria-expanded={open}
      >
        {open ? (
          <Minus className="h-5 w-5 rotate-45 text-slate-700" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-700">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl py-4 z-40"
        >
          <nav className="max-w-7xl mx-auto px-4 flex flex-col gap-1">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition"
              >
                {item.label}
              </a>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" className="flex-1">Prijava</Button>
              <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                Brezplačni preizkus
              </Button>
            </div>
          </nav>
        </motion.div>
      )}
    </div>
  )
}

/* ============================================================
   MAGNETIC BUTTON — gumb sledi miški z magnetnim efektom
   ============================================================ */
function MagneticButton({ children, className, onClick, disabled, size, variant, dataTrack, dataTrackLabel, dataTrackSection }: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'ghost'
  'data-track'?: string
  'data-track-label'?: string
  'data-track-section'?: string
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 15 })
  const springY = useSpring(y, { stiffness: 200, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return
    const rect = ref.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - rect.width / 2
    const offsetY = e.clientY - rect.top - rect.height / 2
    x.set(offsetX * 0.3)
    y.set(offsetY * 0.3)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      onClick={onClick}
      disabled={disabled}
      data-track={dataTrack}
      data-track-label={dataTrackLabel}
      data-track-section={dataTrackSection}
      className={`magnetic-btn ${className || ''}`}
    >
      {children}
    </motion.button>
  )
}

/* ============================================================
   PARALLAX HERO IMAGE — subtle parallax na scroll
   ============================================================ */
function ParallaxHeroImage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, -80])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  return (
    <div ref={ref} className="relative">
      <motion.div style={{ y, scale }}>
        {children}
      </motion.div>
    </div>
  )
}

/* ============================================================
   CURSOR GLOW — emerald glow sledi miški
   ============================================================ */
function CursorGlow() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [mouseX, mouseY])

  return (
    <motion.div
      className="pointer-events-none fixed z-[5] w-[400px] h-[400px] rounded-full opacity-30 hidden lg:block"
      style={{
        left: springX,
        top: springY,
        x: -200,
        y: -200,
        background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
      }}
    />
  )
}

/* ============================================================
   LIVE SALES TICKER — animiran "alive" bar z rotating sporočili
   ============================================================ */
const LIVE_TICKER_MESSAGES = [
  { icon: 'receipt', text: 'Miza 12 plačala', value: '€47,50', tone: 'emerald' },
  { icon: 'kitchen', text: 'Nova naročila v kuhinji', value: '3', tone: 'amber' },
  { icon: 'trend', text: 'Današnji promet', value: '€3.247', tone: 'emerald' },
  { icon: 'delivery', text: 'Wolt dostava #1284', value: 'oddana', tone: 'cyan' },
  { icon: 'receipt', text: 'Miza 7 plačala', value: '€89,20', tone: 'emerald' },
  { icon: 'table', text: 'Nova rezervacija — Miza 3', value: '19:30', tone: 'purple' },
  { icon: 'trend', text: 'Št. naročil danes', value: '187', tone: 'emerald' },
  { icon: 'delivery', text: 'Glovo dostava #561', value: 'prevzeta', tone: 'cyan' },
  { icon: 'receipt', text: 'Miza 15 plačala', value: '€124,80', tone: 'emerald' },
  { icon: 'kitchen', text: 'Jed pripravljena — Miza 9', value: '✓', tone: 'amber' },
] as const

function LiveTickerIcon({ name }: { name: string }) {
  const cls = 'h-3.5 w-3.5'
  if (name === 'receipt') return <Receipt className={cls} />
  if (name === 'kitchen') return <Utensils className={cls} />
  if (name === 'trend') return <TrendingUp className={cls} />
  if (name === 'delivery') return <ShoppingBag className={cls} />
  if (name === 'table') return <Users className={cls} />
  return <Receipt className={cls} />
}

function LiveSalesTicker() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % LIVE_TICKER_MESSAGES.length), 3200)
    return () => clearInterval(t)
  }, [])

  const msg = LIVE_TICKER_MESSAGES[idx]
  const toneColor: Record<string, string> = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    cyan: 'text-cyan-600',
    purple: 'text-purple-600',
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-2">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md px-4 py-2.5 shadow-sm">
        {/* LIVE indicator */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">V živo</span>
        </div>

        {/* Rotating message */}
        <div className="flex-1 min-h-[20px] flex items-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="text-slate-400 shrink-0">
                <LiveTickerIcon name={msg.icon} />
              </span>
              <span className="text-slate-600 font-medium">{msg.text}</span>
              <span className={`font-bold tabular-nums ${toneColor[msg.tone]}`}>{msg.value}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2">
          {LIVE_TICKER_MESSAGES.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === idx ? 'w-5 bg-emerald-500' : 'w-1 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   DARK MODE TOGGLE
   ============================================================ */
function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Sync React state with DOM theme on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const newDark = !isDark
    setIsDark(newDark)
    if (newDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      aria-label={isDark ? 'Preklopi na svetlo' : 'Preklopi na temno'}
    >
      {isDark ? (
        <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

/* ============================================================
   LOYALTY & CRM — vernostni program, točke, CRM profili gostov
   ============================================================ */
const LOYALTY_TIERS = [
  {
    name: 'Bronasti',
    color: 'from-amber-600 to-orange-700',
    badge: 'bg-amber-100 text-amber-800',
    min: '0',
    perk: '5% popust ob rojstnem dnevu',
    icon: '🥉',
  },
  {
    name: 'Srebrni',
    color: 'from-slate-400 to-slate-600',
    badge: 'bg-slate-100 text-slate-700',
    min: '500',
    perk: '10% popust + brezplačna pijača na vsak 5. obisk',
    icon: '🥈',
  },
  {
    name: 'Zlati',
    color: 'from-yellow-400 to-amber-500',
    badge: 'bg-yellow-100 text-yellow-800',
    min: '1500',
    perk: '15% popust + prioriteta rezervacij + brezplačna sladica',
    icon: '🥇',
  },
] as const

const LOYALTY_GUESTS = [
  { initials: 'MK', name: 'Maja Kralj', visits: 47, points: 1240, tier: 1, favDish: 'Beef Burger Deluxe', lastVisit: 'pred 2 dneh', avatarBg: 'bg-rose-500' },
  { initials: 'JN', name: 'Janez Novak', visits: 89, points: 2310, tier: 2, favDish: 'Margherita pizza', lastVisit: 'včeraj', avatarBg: 'bg-emerald-500' },
  { initials: 'AP', name: 'Ana Petrič', visits: 23, points: 580, tier: 1, favDish: 'Cezar solata', lastVisit: 'pred 5 dnevi', avatarBg: 'bg-purple-500' },
  { initials: 'TS', name: 'Tomaž Štirn', visits: 12, points: 180, tier: 0, favDish: '—', lastVisit: 'pred 14 dnevi', avatarBg: 'bg-cyan-500' },
] as const

function LoyaltySection() {
  return (
    <section id="loyalty" className="py-16 lg:py-20 bg-slate-50/40 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge className="mb-3 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
            <Heart className="h-3.5 w-3.5 mr-1.5" />
            Vernostni program & CRM
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Gosti se <span className="bg-gradient-to-r from-indigo-600 to-rose-500 bg-clip-text text-transparent animate-gradient-text">vrnejo</span>. Ti služiš več.
          </h2>
          <p className="mt-2 text-base text-slate-600">Samodejno točkovanje, tierji, CRM profili in reaktivacija gostov, ki že dolgo niso obiskali.</p>
        </div>

        {/* Tier kartice */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {LOYALTY_TIERS.map((tier, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: idx * 0.08 }}>
              <Card className={`relative overflow-hidden p-5 border-0 text-white shadow-lg card-tilt`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${tier.color}`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{tier.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{tier.min}+ točk</span>
                  </div>
                  <div className="text-xl font-bold">{tier.name}</div>
                  <div className="text-xs mt-1 opacity-90 leading-snug">{tier.perk}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEVO: CRM profili gostov */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">CRM profili gostov</h3>
              <Badge variant="outline" className="text-[10px]">4 od 1.247</Badge>
            </div>
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="divide-y divide-slate-100">
                {LOYALTY_GUESTS.map((g, i) => {
                  const tier = LOYALTY_TIERS[g.tier]
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="p-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-full ${g.avatarBg} flex items-center justify-center text-white font-bold text-xs shrink-0`}>{g.initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">{g.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${tier.badge}`}>{tier.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">❤ {g.favDish} · {g.visits} obiskov · {g.lastVisit}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-indigo-600 tabular-nums">{g.points.toLocaleString('sl-SI')}</div>
                        <div className="text-[9px] text-slate-400">točk</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-500">Prikaži vseh 1.247 gostov →</span>
              </div>
            </Card>
          </div>

          {/* DESNO: avtomatske akcije + statistike */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Samodejne akcije</h3>
              <div className="space-y-2.5">
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.1 }} className="flex gap-3 p-3 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0"><Bell className="h-4 w-4 text-rose-600" /></div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-900">Reaktivacija (30 dni brez obiska)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Samodejni SMS: &ldquo;Pogrešamo te! 15% popust v naslednjih 7 dneh.&rdquo;</div>
                  </div>
                  <Badge className="bg-rose-100 text-rose-700 text-[9px] shrink-0">23 aktivnih</Badge>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.15 }} className="flex gap-3 p-3 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Heart className="h-4 w-4 text-amber-600" /></div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-900">Rojstni dan popust</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Avtomatski popust + brezplačna sladica na rojstni dan</div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 text-[9px] shrink-0">7 ta teden</Badge>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.2 }} className="flex gap-3 p-3 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-900">Tier upgrade</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Avtomatski SMS ob prehodu v višji tier + nova nagrada</div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 text-[9px] shrink-0">12 ta mesec</Badge>
                </motion.div>
              </div>
            </div>

            {/* Statistike */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-indigo-600 tabular-nums">1.247</div>
                <div className="text-[10px] text-slate-500 mt-0.5">gostov v CRM</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-emerald-600 tabular-nums">+34%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">repeat obiski</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-rose-600 tabular-nums">€4,20</div>
                <div className="text-[10px] text-slate-500 mt-0.5">povp. vrednost točke</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   INVENTORY PREVIEW — 232 artiklov pripravljenih
   ============================================================ */
function InventoryPreview() {
  const [items, setItems] = useState<{id:string;name:string;category:string;unit:string;stock:number;purchasePrice:number;salePrice:number|null}[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string|null>(null)

  useEffect(() => {
    fetch('/api/inventory/list').then(r => r.json()).then(d => setItems(d.items || [])).catch(() => {})
  }, [])

  const categories = Array.from(new Set(items.map(i => i.category))).sort()
  const filtered = items.filter(item => {
    if (activeCat && item.category !== activeCat) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <section id="inventar" className="py-16 lg:py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><Package className="h-3.5 w-3.5 mr-1.5" />232 artiklov pripravljenih</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Vsi artikli <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-text">pripravljeni</span></h2>
          <p className="mt-2 text-base text-slate-600">232 slovenskih artiklov v 19 kategorijah — vsi z zalogo 0. Ti vneseš samo dobavnice.</p>
        </div>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Iskanje artiklov..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button onClick={() => setActiveCat(null)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${!activeCat ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Vse ({items.length})</button>
          {categories.slice(0, 10).map(cat => <button key={cat} onClick={() => setActiveCat(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${activeCat === cat ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{cat}</button>)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
          {filtered.slice(0, 40).map(item => (
            <div key={item.id} className={`p-3 rounded-lg border-2 ${item.stock <= 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">{item.category}</span>
                {item.stock <= 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold">ZALOGA 0</span>}
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">{item.name}</div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-bold text-emerald-600 tabular-nums">{item.stock} {item.unit}</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{(item.salePrice || item.purchasePrice).toFixed(2)} €</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   DELIVERY — Wolt, Uber Eats, Glovo, Lastmin, QR
   ============================================================ */
function DeliverySection() {
  const [orders, setOrders] = useState<{id:string;platformLabel:string;platformColor:string;platformIcon:string;customerName:string;deliveryAddress:string;items:{name:string;qty:number}[];total:number;status:string;receivedAt:number}[]>([])
  const [stats, setStats] = useState<{total:number;newCount:number;netRevenue:number;totalCommission:number} | null>(null)

  useEffect(() => {
    fetch('/api/delivery/orders').then(r => r.json()).then(d => { setOrders(d.orders || []); setStats(d.stats) }).catch(() => {})
  }, [])

  const handleNew = async () => { await fetch('/api/delivery/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action:'new'}) }); const r = await fetch('/api/delivery/orders'); const d = await r.json(); setOrders(d.orders || []); setStats(d.stats) }

  return (
    <section id="dostava" className="py-16 lg:py-20 bg-slate-50/40 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-cyan-100 text-cyan-800 hover:bg-cyan-100"><Smartphone className="h-3.5 w-3.5 mr-1.5" />Dostavne integracije</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Vse dostavne platforme <span className="bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">na enem mestu</span></h2>
          <p className="mt-2 text-base text-slate-600">Wolt, Uber Eats, Glovo, Lastmin in QR — vsa naročila na enem zaslonu z auto-accept.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[{icon:'🟦',l:'Wolt',d:'12%'},{icon:'🚗',l:'Uber Eats',d:'15%'},{icon:'🟡',l:'Glovo',d:'10%'},{icon:'⏱️',l:'Lastmin',d:'8%'},{icon:'📱',l:'QR',d:'0%'}].map((p,i) => (
            <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-center"><div className="text-2xl mb-1">{p.icon}</div><div className="text-xs font-bold">{p.l}</div><div className="text-[10px] text-slate-400">{p.d} provizija</div></div>
          ))}
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <Card className="p-3 text-center"><div className="text-lg font-bold text-slate-900">{stats.total}</div><div className="text-[9px] text-slate-400">naročil</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-cyan-600">{stats.newCount}</div><div className="text-[9px] text-slate-400">novih</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-emerald-600">{stats.netRevenue?.toFixed(0) || 0}€</div><div className="text-[9px] text-slate-400">neto</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-amber-600">{stats.totalCommission?.toFixed(0) || 0}€</div><div className="text-[9px] text-slate-400">provizija</div></Card>
          </div>
        )}
        <div className="flex justify-center mb-4">
          <Button size="sm" variant="outline" onClick={handleNew} className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"><Plus className="h-3.5 w-3.5 mr-1" />Simuliraj naročilo</Button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {orders.slice(0, 10).map(o => (
            <div key={o.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${o.platformColor} text-white flex items-center justify-center text-sm shrink-0`}>{o.platformIcon}</div>
              <div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-900 truncate">{o.customerName}</div><div className="text-[10px] text-slate-500 truncate">{o.deliveryAddress}</div><div className="text-[10px] text-slate-600">{o.items.map(i => `${i.qty}× ${i.name}`).join(', ')}</div></div>
              <div className="text-right shrink-0"><div className="text-xs font-bold text-slate-900">{o.total.toFixed(2)}€</div><div className="text-[9px] text-slate-400">{o.status}</div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   QR ORDERING & SELF-SERVICE KIOSK — gostje sami naročajo
   ============================================================ */
const QR_MENU_ITEMS = [
  { name: 'Beef Burger Deluxe', price: '14,90', img: '🍔', cat: 'Burgerji' },
  { name: 'Cezar solata', price: '9,50', img: '🥗', cat: 'Solate' },
  { name: 'Margherita pizza', price: '11,00', img: '🍕', cat: 'Pizza' },
  { name: 'Tiramisu', price: '5,50', img: '🍰', cat: 'Sladice' },
  { name: 'Aperol Spritz', price: '6,50', img: '🍹', cat: 'Pijače' },
  { name: 'Limonada', price: '3,20', img: '🥤', cat: 'Pijače' },
] as const

const QR_STATS = [
  { value: '+32%', label: 'višji povprečni račun', tone: 'text-emerald-600' },
  { value: '−45%', label: 'čas čakanja natakarja', tone: 'text-cyan-600' },
  { value: '0', label: 'aplikacij za prenos', tone: 'text-purple-600' },
  { value: '4', label: 'jeziki (SLO/EN/DE/IT)', tone: 'text-amber-600' },
] as const

function QrOrderingSection() {
  const [mode, setMode] = useState<'qr' | 'kiosk'>('qr')
  const [picked, setPicked] = useState<number[]>([0, 2])

  const togglePick = (i: number) => setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  const total = picked.reduce((s, i) => s + parseFloat(QR_MENU_ITEMS[i].price.replace(',', '.')), 0)

  return (
    <section id="qr-ordering" className="py-16 lg:py-20 bg-gradient-to-b from-slate-50/40 to-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-pink-100 text-pink-800 hover:bg-pink-100"><QrCode className="h-3.5 w-3.5 mr-1.5" />QR naročanje & kiosk</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Gosti naročajo <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient-text">sam</span>. Ti služiš.
          </h2>
          <p className="mt-2 text-base text-slate-600">QR koda na mizi ali samopostrežni kiosk. Brez prenosov aplikacij, brez čakanja na natakarja — v 4 jezikih.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {QR_STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}>
              <Card className="p-4 text-center border-slate-200/70 card-tilt">
                <div className={`text-2xl lg:text-3xl font-bold tabular-nums ${s.tone}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode('qr')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'qr' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <QrCode className="h-4 w-4" /> QR na mizi
            </button>
            <button
              onClick={() => setMode('kiosk')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'kiosk' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Monitor className="h-4 w-4" /> Kiosk
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: phone / kiosk mockup */}
          <motion.div key={mode} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Card className="overflow-hidden border-slate-200 shadow-xl">
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  {mode === 'qr' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  <span className="text-xs font-medium">
                    {mode === 'qr' ? 'Noro Lep Meni · Miza 7' : 'Noro Lep Kiosk · Narči sam'}
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">🇸🇮 SLO</span>
              </div>

              {/* Language switcher (mock) */}
              <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-100">
                {['🇸🇮 SLO', '🇬🇧 EN', '🇩🇪 DE', '🇮🇹 IT'].map((l, i) => (
                  <span key={l} className={`px-2 py-1 rounded text-[10px] font-semibold ${i === 0 ? 'bg-pink-100 text-pink-700' : 'text-slate-400'}`}>{l}</span>
                ))}
              </div>

              {/* Menu grid */}
              <div className="p-3 bg-white grid grid-cols-2 gap-2" style={{ minHeight: '300px' }}>
                {QR_MENU_ITEMS.map((item, i) => {
                  const sel = picked.includes(i)
                  return (
                    <button
                      key={i}
                      onClick={() => togglePick(i)}
                      className={`relative p-2.5 rounded-lg border-2 text-left transition-all ${sel ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:border-pink-300 hover:bg-slate-50'}`}
                    >
                      <div className="text-2xl mb-1">{item.img}</div>
                      <div className="text-[11px] font-bold text-slate-900 leading-tight">{item.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-400">{item.cat}</span>
                        <span className="text-xs font-bold text-pink-600">€{item.price}</span>
                      </div>
                      {sel && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">✓</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Cart bar */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Košarica · {picked.length} artiklov</div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">€{total.toFixed(2).replace('.', ',')}</div>
                </div>
                <button className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold shadow-sm transition-colors">
                  Naroči →
                </button>
              </div>
            </Card>
          </motion.div>

          {/* RIGHT: benefits */}
          <motion.div key={mode + '-ben'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-4">
            {mode === 'qr' ? (
              <>
                <div className="flex gap-3 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center shrink-0"><QrCode className="h-5 w-5 text-pink-600" /></div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">QR koda na vsaki mizi</div>
                    <div className="text-xs text-slate-500 mt-0.5">Gost skenira s telefonom — digitalni meni se odpre v brskalniku. Brez aplikacij, brez prenosov.</div>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Smartphone className="h-5 w-5 text-emerald-600" /></div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Slike artiklov & opisi</div>
                    <div className="text-xs text-slate-500 mt-0.5">Gost vidi fotografije jedi, alergene in sestavine. Večji povprečni račun, manj vprašanj.</div>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0"><CreditCard className="h-5 w-5 text-cyan-600" /></div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Plačilo direktno iz menija</div>
                    <div className="text-xs text-slate-500 mt-0.5">Apple Pay, kartica ali dodaj na račun mize. Brez čakanja na natakarja za plačilo.</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-3 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0"><Monitor className="h-5 w-5 text-purple-600" /></div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Samopostrežni kiosk</div>
                    <div className="text-xs text-slate-500 mt-0.5">Stojalo z zaslonom na vhodu. Gosti sami sestavijo naročilo in plačajo — osebje osredotočeno na gostoljubje.</div>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Sparkles className="h-5 w-5 text-amber-600" /></div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Smart upselling engine</div>
                    <div className="text-xs text-slate-500 mt-0.5">AI predlaga prilogo, pijačo ali sladico ob vsakem naročilu. +32% višji račun, samodejno.</div>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Zap className="h-5 w-5 text-emerald-600" /></div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Direktno v kuhinjo</div>
                    <div className="text-xs text-slate-500 mt-0.5">Naročilo iz kioska takoj prikaže na KDS. Brez prepisovanja, brez napak, brez zamud.</div>
                  </div>
                </div>
              </>
            )}

            {/* Trust line */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-emerald-800">FURS ZDavPR-1 potrjeno · vsako naročilo takoj vneseno v promet · 2025 compliant</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   AI PREDICTION — predikcija povpraševanja + samodejne dobavnice
   ============================================================ */
function AIPredictionSection() {
  const [predictions, setPredictions] = useState<{itemName:string;category:string;predictedDemand:number;confidence:number;trend:string;trendPercent:number;currentStock:number;daysUntilStockout:number;reorderNeeded:boolean;reorderQuantity:number;reorderUrgency:string;estimatedCost:number;reasoning:string}[]>([])
  const [stats, setStats] = useState<{totalItems:number;criticalCount:number;avgConfidence:number;totalReorderCost:number} | null>(null)

  useEffect(() => {
    fetch('/api/ai/predict').then(r => r.json()).then(d => { setPredictions(d.predictions || []); setStats(d.stats) }).catch(() => {})
  }, [])

  const urgencyColors: Record<string, string> = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-sky-500', none: 'bg-emerald-500' }
  const trendIcons: Record<string, string> = { rising: '📈', falling: '📉', stable: '➡️', seasonal: '🎯' }

  return (
    <section id="ai-prediction" className="py-16 lg:py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-purple-100 text-purple-800 hover:bg-purple-100"><Sparkles className="h-3.5 w-3.5 mr-1.5" />AI predikcija zalog</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">AI ve <span className="bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">kaj boš prodal</span> naslednji teden</h2>
          <p className="mt-2 text-base text-slate-600">Analiza prodaje, vremenske napovedi in trend detection. Samodejne dobavnice — preden zmanjka.</p>
        </div>
        {/* Real industry stats (Deloitte 2025) */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-w-3xl mx-auto">
          <div className="text-center p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-2xl font-bold text-emerald-600">−55%</div>
            <div className="text-[10px] text-slate-600 leading-tight mt-0.5">manj odpadkov<hr className="border-emerald-200 my-1" /><span className="text-[9px] text-slate-400">Deloitte 2025</span></div>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-50/70 border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">+40%</div>
            <div className="text-[10px] text-slate-600 leading-tight mt-0.5">višji profit<hr className="border-purple-200 my-1" /><span className="text-[9px] text-slate-400">AI optimizacija</span></div>
          </div>
          <div className="text-center p-3 rounded-xl bg-cyan-50/70 border border-cyan-100">
            <div className="text-2xl font-bold text-cyan-600">80%</div>
            <div className="text-[10px] text-slate-600 leading-tight mt-0.5">veča AI invest<hr className="border-cyan-200 my-1" /><span className="text-[9px] text-slate-400">restavracije 2025</span></div>
          </div>
        </div>
        {/* Weather-aware highlight */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100">
            🌦️ <span className="font-semibold text-slate-700">Vreme-aware:</span> deževna sobota? AI ve, da bo večja prodaja juh in tople pijače.
          </span>
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            <Card className="p-3 text-center"><div className="text-lg font-bold text-purple-600">{stats.totalItems}</div><div className="text-[9px] text-slate-400">analiziranih</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-red-600">{stats.criticalCount}</div><div className="text-[9px] text-slate-400">kritičnih</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-emerald-600">{stats.avgConfidence}%</div><div className="text-[9px] text-slate-400">zaupanje</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-amber-600">{stats.totalReorderCost?.toFixed(0) || 0}€</div><div className="text-[9px] text-slate-400">dobavnica</div></Card>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {predictions.slice(0, 9).map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <Card className={`p-3 border-2 ${p.reorderUrgency === 'critical' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-900">{p.itemName}</div><div className="text-[10px] text-slate-500">{p.category}</div></div>
                  <span className={`px-1.5 py-0.5 rounded-full ${urgencyColors[p.reorderUrgency] || 'bg-slate-400'} text-white text-[8px] font-bold shrink-0 ml-2`}>{p.reorderUrgency.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  <div><div className="text-[8px] text-slate-400 uppercase">Zaloga</div><div className="text-xs font-bold text-slate-900">{p.currentStock}</div></div>
                  <div><div className="text-[8px] text-slate-400 uppercase">Predikcija</div><div className="text-xs font-bold text-purple-600">{p.predictedDemand}</div></div>
                  <div><div className="text-[8px] text-slate-400 uppercase">Zmanjka</div><div className={`text-xs font-bold ${p.daysUntilStockout <= 1 ? 'text-red-600' : 'text-amber-600'}`}>{p.daysUntilStockout}d</div></div>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-purple-600 font-semibold">{trendIcons[p.trend]} {p.trend} ({p.trendPercent > 0 ? '+' : ''}{p.trendPercent.toFixed(0)}%)</span>
                  <span className="text-slate-400">{p.confidence}%</span>
                </div>
                {p.reorderNeeded && <div className="text-[10px] text-purple-600 font-bold">→ Naroči {p.reorderQuantity} ({p.estimatedCost.toFixed(2)}€)</div>}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   MENU ENGINEERING — AI analiza dobičkonosnosti menija (4 kvadranti)
   ============================================================ */
interface MenuEngItem {
  name: string
  popularity: number  // 0-100
  profit: number      // € margin per unit
  sold: number        // units this month
  category: 'star' | 'workhorse' | 'puzzle' | 'dog'
}

const MENU_ENG_ITEMS: MenuEngItem[] = [
  { name: 'Čevapi s kajmakom', popularity: 92, profit: 9.80, sold: 312, category: 'star' },
  { name: 'Pizza Margherita', popularity: 88, profit: 7.20, sold: 287, category: 'star' },
  { name: 'Burger Noro Lep', popularity: 85, profit: 11.50, sold: 264, category: 'star' },
  { name: 'Beef Burger Deluxe', popularity: 79, profit: 12.30, sold: 198, category: 'star' },
  { name: 'Trški pršut', popularity: 71, profit: 4.20, sold: 156, category: 'workhorse' },
  { name: 'Brusketa s paradižnikom', popularity: 68, profit: 2.80, sold: 142, category: 'workhorse' },
  { name: 'Štruklji', popularity: 64, profit: 3.10, sold: 128, category: 'workhorse' },
  { name: 'Rižota s morskimi sadeži', popularity: 42, profit: 13.80, sold: 67, category: 'puzzle' },
  { name: 'Kozice na žaru', popularity: 38, profit: 14.50, sold: 54, category: 'puzzle' },
  { name: 'Zrezek na žaru', popularity: 31, profit: 15.20, sold: 41, category: 'puzzle' },
  { name: 'Šampinjoni na žaru', popularity: 22, profit: 2.10, sold: 28, category: 'dog' },
  { name: 'Mešana solata', popularity: 18, profit: 1.90, sold: 19, category: 'dog' },
]

const MENU_ENG_QUADRANTS = {
  star: {
    label: 'Zvezde',
    emoji: '⭐',
    desc: 'Visoka popularnost + visok dobiček',
    color: 'bg-emerald-50 border-emerald-200',
    headerColor: 'text-emerald-700',
    action: 'Poudari na vrhu menija. Nikoli ne spremeni cene.',
  },
  workhorse: {
    label: 'Delavski konji',
    emoji: '🐴',
    desc: 'Visoka popularnost + nizek dobiček',
    color: 'bg-amber-50 border-amber-200',
    headerColor: 'text-amber-700',
    action: 'Razmisli o zvišanju cene za 0,50–1,00 €.',
  },
  puzzle: {
    label: 'Uganke',
    emoji: '🧩',
    desc: 'Nizka popularnost + visok dobiček',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'text-purple-700',
    action: 'Prenesi na boljši položaj v meniju. Promo paket.',
  },
  dog: {
    label: 'Psi',
    emoji: '🐕',
    desc: 'Nizka popularnost + nizek dobiček',
    color: 'bg-rose-50 border-rose-200',
    headerColor: 'text-rose-700',
    action: 'Kandidat za umik iz menija. Sprosti kuhinjo.',
  },
} as const

function MenuEngineeringSection() {
  const [activeQ, setActiveQ] = useState<'star' | 'workhorse' | 'puzzle' | 'dog' | 'all'>('all')

  const filtered = activeQ === 'all' ? MENU_ENG_ITEMS : MENU_ENG_ITEMS.filter(i => i.category === activeQ)
  const counts = {
    star: MENU_ENG_ITEMS.filter(i => i.category === 'star').length,
    workhorse: MENU_ENG_ITEMS.filter(i => i.category === 'workhorse').length,
    puzzle: MENU_ENG_ITEMS.filter(i => i.category === 'puzzle').length,
    dog: MENU_ENG_ITEMS.filter(i => i.category === 'dog').length,
  }
  const totalRevenue = MENU_ENG_ITEMS.reduce((s, i) => s + i.profit * i.sold, 0)

  return (
    <section id="menu-engineering" className="py-16 lg:py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Menu Engineering
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            AI ve katere jedi ti <span className="bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">prinašajo denar</span>
          </h2>
          <p className="mt-2 text-base text-slate-600">Vsak artikel v matriko: popularnost × dobiček. Štirje kvadranti, jasna priporočila.</p>
        </div>

        {/* 4 kvadranti — filter */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {(Object.keys(MENU_ENG_QUADRANTS) as Array<keyof typeof MENU_ENG_QUADRANTS>).map((q) => {
            const info = MENU_ENG_QUADRANTS[q]
            const isActive = activeQ === q
            return (
              <button
                key={q}
                onClick={() => setActiveQ(isActive ? 'all' : q)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${isActive ? info.color + ' ring-2 ring-offset-1 ring-purple-300' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">{info.emoji}</span>
                  <span className={`text-xs font-bold ${info.headerColor}`}>{counts[q]}</span>
                </div>
                <div className={`text-sm font-bold ${info.headerColor}`}>{info.label}</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{info.desc}</div>
              </button>
            )
          })}
        </div>

        {/* Items grid + AI insight */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items (2/3) */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {activeQ === 'all' ? 'Vsi artikli' : MENU_ENG_QUADRANTS[activeQ].label}
                </span>
                <span className="text-[10px] text-slate-400">{filtered.length} od {MENU_ENG_ITEMS.length}</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {filtered.map((item, i) => {
                  const info = MENU_ENG_QUADRANTS[item.category]
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <span className="text-lg shrink-0">{info.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{item.name}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {/* Popularity bar */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-400 w-8">POP</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.popularity}%` }} />
                            </div>
                          </div>
                          {/* Profit bar */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-400 w-8">€</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (item.profit / 16) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-900 tabular-nums">{item.sold}</div>
                        <div className="text-[9px] text-slate-400">prodanih</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-600 tabular-nums">€{(item.profit * item.sold).toFixed(0)}</div>
                        <div className="text-[9px] text-slate-400">dobiček</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* AI insight (1/3) */}
          <div className="space-y-4">
            {/* AI priporočilo za aktivni kvadrant */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }} className={`p-4 rounded-xl border-2 ${activeQ === 'all' ? 'bg-purple-50 border-purple-200' : MENU_ENG_QUADRANTS[activeQ].color}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">AI priporočilo</span>
              </div>
              {activeQ === 'all' ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  Izberi kvadrant za specifična priporočila. Skupni dobiček iz menija: <span className="font-bold text-purple-700">€{totalRevenue.toLocaleString('sl-SI')}</span>.
                </p>
              ) : (
                <>
                  <div className="text-sm font-bold text-slate-900 mb-1">
                    {MENU_ENG_QUADRANTS[activeQ].emoji} {MENU_ENG_QUADRANTS[activeQ].label}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{MENU_ENG_QUADRANTS[activeQ].action}</p>
                </>
              )}
            </motion.div>

            {/* Statistike */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-purple-600 tabular-nums">€{totalRevenue.toLocaleString('sl-SI')}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">dobiček/mesec</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-emerald-600 tabular-nums">{counts.star}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">zvezd v meniju</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-rose-600 tabular-nums">{counts.dog}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">psa (umik)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-amber-600 tabular-nums">+12%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">profit ob akciji</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   STAFF & SHIFT MANAGEMENT — scheduling + labor cost tracking
   ============================================================ */
interface StaffShift {
  initials: string
  name: string
  role: string
  avatarBg: string
  start: string
  end: string
  hours: number
  rate: number
  station: string
  status: 'active' | 'break' | 'off'
}

const STAFF_SHIFTS: StaffShift[] = [
  { initials: 'MK', name: 'Maja Kovač', role: 'Natakarica', avatarBg: 'bg-emerald-500', start: '10:00', end: '18:00', hours: 8, rate: 9.50, station: 'Mize 1-6', status: 'active' },
  { initials: 'JN', name: 'Janez Novak', role: 'Kuhar', avatarBg: 'bg-amber-500', start: '09:00', end: '17:00', hours: 8, rate: 12.00, station: 'Vroče', status: 'active' },
  { initials: 'AP', name: 'Ana Petrič', role: 'Natakarica', avatarBg: 'bg-rose-500', start: '11:00', end: '19:00', hours: 8, rate: 9.50, station: 'Mize 7-12', status: 'break' },
  { initials: 'TS', name: 'Tomaž Štirn', role: 'Pomivalec', avatarBg: 'bg-cyan-500', start: '12:00', end: '20:00', hours: 8, rate: 7.50, station: 'Pomiv', status: 'active' },
  { initials: 'BL', name: 'Blaž Leban', role: 'Sommelier', avatarBg: 'bg-purple-500', start: '16:00', end: '23:00', hours: 7, rate: 11.00, station: 'Bar', status: 'off' },
  { initials: 'NZ', name: 'Nina Zupan', role: 'Natakarica', avatarBg: 'bg-indigo-500', start: '16:00', end: '23:00', hours: 7, rate: 9.50, station: 'Mize 7-12', status: 'off' },
]

const WEEKDAYS = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'] as const

function StaffSection() {
  const [activeDay, setActiveDay] = useState(0) // Pon

  const todayShifts = STAFF_SHIFTS.filter(s => s.status !== 'off' || activeDay === 0)
  const laborCost = todayShifts.reduce((s, st) => s + st.hours * st.rate, 0)
  const totalHours = todayShifts.reduce((s, st) => s + st.hours, 0)
  const activeCount = todayShifts.filter(s => s.status === 'active').length
  // AI priporočilo: optimal osebje glede na projected promet
  const projectedRevenue = 3247
  const optimalStaff = 5
  const laborPct = Math.round((laborCost / projectedRevenue) * 100)

  const statusInfo: Record<string, { label: string; dot: string; text: string }> = {
    active: { label: 'Aktiven', dot: 'bg-emerald-500', text: 'text-emerald-700' },
    break: { label: 'Premor', dot: 'bg-amber-500', text: 'text-amber-700' },
    off: { label: 'Prosti', dot: 'bg-slate-400', text: 'text-slate-500' },
  }

  return (
    <section id="osebje" className="py-16 lg:py-20 bg-slate-50/40 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Osebje & izmene
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Pravo osebje ob <span className="bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">pravem času</span>
          </h2>
          <p className="mt-2 text-base text-slate-600">Shift scheduling z labor cost tracking. AI napove promet, priporoči optimalno število osebja.</p>
        </div>

        {/* Teden selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center bg-white rounded-xl p-1 gap-1 border border-slate-200 shadow-sm">
            {WEEKDAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setActiveDay(i)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeDay === i ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {day}
                {i === 0 && <span className="hidden sm:inline ml-1 text-[10px] opacity-70">danes</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEVO: Shift list (2/3) */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{WEEKDAYS[activeDay]} — izmene</span>
                <span className="text-[10px] text-slate-400">{todayShifts.length} delavcev</span>
              </div>
              <div className="divide-y divide-slate-50">
                {todayShifts.map((s, i) => {
                  const st = statusInfo[s.status]
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-full ${s.avatarBg} flex items-center justify-center text-white font-bold text-xs shrink-0`}>{s.initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{s.role}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 tabular-nums">🕒 {s.start}–{s.end}</span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[11px] text-slate-500">📍 {s.station}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${s.status === 'active' ? 'animate-pulse' : ''}`} />
                        <span className={`text-[10px] font-bold ${st.text}`}>{st.label}</span>
                      </div>
                      <div className="text-right shrink-0 min-w-[60px]">
                        <div className="text-xs font-bold text-slate-900 tabular-nums">{s.hours}h</div>
                        <div className="text-[9px] text-slate-400 tabular-nums">€{(s.hours * s.rate).toFixed(0)}</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Skupaj: <span className="font-bold text-slate-700">{totalHours}h</span></span>
                <span className="text-[11px] text-slate-500">Strošek: <span className="font-bold text-slate-700">€{laborCost.toFixed(0)}</span></span>
              </div>
            </Card>
          </div>

          {/* DESNO: AI labor analytics */}
          <div className="space-y-4">
            {/* AI priporočilo */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }} className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-emerald-50 border-2 border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">AI labor priporočilo</span>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed mb-3">
                Projektiran promet danes: <span className="font-bold text-cyan-700">€{projectedRevenue.toLocaleString('sl-SI')}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Trenutno osebje</span>
                  <span className="font-bold text-slate-900">{todayShifts.length} delavcev</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">AI optimalno</span>
                  <span className="font-bold text-emerald-600">{optimalStaff} delavcev</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Labor % prometa</span>
                  <span className={`font-bold ${laborPct <= 25 ? 'text-emerald-600' : laborPct <= 30 ? 'text-amber-600' : 'text-rose-600'}`}>{laborPct}%</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-cyan-200">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {laborPct <= 25
                    ? '✓ Labor stroški znotraj cilja (≤25%). Osebje optimalno za projektiran promet.'
                    : laborPct <= 30
                      ? '⚠ Labor blizu meje (25-30%). Razmisli o krajšanju izmene ob 22h.'
                      : '⚠ Labor nad 30%. Priporočam krajšanje 1 izmene ali premik v tišji dan.'}
                </p>
              </div>
            </motion.div>

            {/* Statistike */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-emerald-600 tabular-nums">{activeCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">aktivnih zdaj</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-cyan-600 tabular-nums">{totalHours}h</div>
                <div className="text-[10px] text-slate-500 mt-0.5">ur danes</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-purple-600 tabular-nums">€{laborCost.toFixed(0)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">labor dnes</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
                <div className="text-xl font-bold text-amber-600 tabular-nums">{laborPct}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">od prometa</div>
              </div>
            </div>

            {/* Hitre akcije */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/70">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Hitre akcije</div>
              <div className="space-y-1.5">
                <button className="w-full text-left text-[11px] text-slate-600 hover:text-cyan-700 flex items-center justify-between p-1.5 rounded hover:bg-cyan-50 transition-colors">
                  <span>+ Dodaj izmeno</span><span className="text-slate-300">→</span>
                </button>
                <button className="w-full text-left text-[11px] text-slate-600 hover:text-cyan-700 flex items-center justify-between p-1.5 rounded hover:bg-cyan-50 transition-colors">
                  <span>📋 Kopiraj prejšnji teden</span><span className="text-slate-300">→</span>
                </button>
                <button className="w-full text-left text-[11px] text-slate-600 hover:text-cyan-700 flex items-center justify-between p-1.5 rounded hover:bg-cyan-50 transition-colors">
                  <span>📧 SMS vsem aktivnim</span><span className="text-slate-300">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   RESERVATIONS & WAITLIST — mize, rezervacije, čakalna vrsta SMS
   ============================================================ */
interface Reservation {
  initials: string
  name: string
  guests: number
  time: string
  table: string
  status: 'confirmed' | 'seated' | 'waiting' | 'late'
  phone: string
  avatarBg: string
  notes?: string
}

const RESERVATIONS: Reservation[] = [
  { initials: 'MK', name: 'Maja Kralj', guests: 4, time: '19:00', table: 'Miza 5', status: 'confirmed', phone: '+386 41 234 567', avatarBg: 'bg-emerald-500', notes: 'Otroški stol' },
  { initials: 'JN', name: 'Janez Novak', guests: 2, time: '19:30', table: 'Miza 9', status: 'seated', phone: '+386 41 888 999', avatarBg: 'bg-cyan-500' },
  { initials: 'AP', name: 'Ana Petrič', guests: 6, time: '20:00', table: 'Miza 1', status: 'confirmed', phone: '+386 31 555 333', avatarBg: 'bg-purple-500', notes: 'Rojstni dan' },
  { initials: 'TS', name: 'Tomaž Štirn', guests: 3, time: '18:30', table: '—', status: 'waiting', phone: '+386 41 111 222', avatarBg: 'bg-amber-500' },
  { initials: 'BL', name: 'Blaž Leban', guests: 2, time: '18:00', table: 'Miza 7', status: 'late', phone: '+386 31 777 444', avatarBg: 'bg-rose-500', notes: '15 min zamude' },
]

const WAITLIST: { initials: string; name: string; guests: number; joined: string; waitMin: number; phone: string; avatarBg: string }[] = [
  { initials: 'NZ', name: 'Nina Zupan', guests: 2, joined: '19:12', waitMin: 8, phone: '+386 41 222 333', avatarBg: 'bg-indigo-500' },
  { initials: 'DP', name: 'David Pečar', guests: 4, joined: '19:18', waitMin: 14, phone: '+386 31 444 555', avatarBg: 'bg-teal-500' },
  { initials: 'SR', name: 'Sara Rekar', guests: 2, joined: '19:25', waitMin: 21, phone: '+386 41 666 777', avatarBg: 'bg-orange-500' },
]

const TABLE_MAP = [
  { id: 1, seats: 6, status: 'occupied', x: 15, y: 20 },
  { id: 2, seats: 2, status: 'free', x: 45, y: 20 },
  { id: 3, seats: 4, status: 'reserved', x: 75, y: 20 },
  { id: 4, seats: 4, status: 'free', x: 15, y: 50 },
  { id: 5, seats: 4, status: 'reserved', x: 45, y: 50 },
  { id: 6, seats: 2, status: 'occupied', x: 75, y: 50 },
  { id: 7, seats: 2, status: 'late', x: 15, y: 80 },
  { id: 8, seats: 6, status: 'free', x: 45, y: 80 },
  { id: 9, seats: 2, status: 'occupied', x: 75, y: 80 },
] as const

const TABLE_STATUS_INFO = {
  free: { label: 'Prosto', color: 'bg-emerald-100 border-emerald-400 text-emerald-700', dot: 'bg-emerald-500' },
  reserved: { label: 'Rezervirano', color: 'bg-amber-100 border-amber-400 text-amber-700', dot: 'bg-amber-500' },
  occupied: { label: 'Zasedeno', color: 'bg-rose-100 border-rose-400 text-rose-700', dot: 'bg-rose-500' },
  late: { label: 'Zamuja', color: 'bg-purple-100 border-purple-400 text-purple-700', dot: 'bg-purple-500' },
} as const

const RES_STATUS_INFO = {
  confirmed: { label: 'Potrjena', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  seated: { label: 'Sedi', dot: 'bg-cyan-500', text: 'text-cyan-700', bg: 'bg-cyan-50' },
  waiting: { label: 'Čaka', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  late: { label: 'Zamuja', dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
} as const

function ReservationsSection() {
  const [tab, setTab] = useState<'today' | 'waitlist' | 'map'>('today')

  const confirmed = RESERVATIONS.filter(r => r.status === 'confirmed').length
  const seated = RESERVATIONS.filter(r => r.status === 'seated').length
  const waiting = RESERVATIONS.filter(r => r.status === 'waiting').length
  const late = RESERVATIONS.filter(r => r.status === 'late').length
  const totalGuests = RESERVATIONS.reduce((s, r) => s + r.guests, 0) + WAITLIST.reduce((s, w) => s + w.guests, 0)

  return (
    <section id="rezervacije" className="py-16 lg:py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-rose-100 text-rose-800 hover:bg-rose-100">
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Rezervacije & čakalna vrsta
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Vsaka miza <span className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent animate-gradient-text">zasedena</span>. Nikoli ne čaka.
          </h2>
          <p className="mt-2 text-base text-slate-600">Rezervacije, table mapping, waitlist z avtomatskim SMS. Gost ve, kdaj je miza prosta.</p>
        </div>

        {/* Statistike */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-6">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
            <div className="text-xl font-bold text-emerald-600 tabular-nums">{confirmed}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">potrjene</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-100 text-center">
            <div className="text-xl font-bold text-cyan-600 tabular-nums">{seated}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">sedijo</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
            <div className="text-xl font-bold text-amber-600 tabular-nums">{waiting + WAITLIST.length}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">čakajo</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">
            <div className="text-xl font-bold text-rose-600 tabular-nums">{late}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">zamuja</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
            <div className="text-xl font-bold text-purple-600 tabular-nums">{totalGuests}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">gostov</div>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button onClick={() => setTab('today')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'today' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Današnje rezervacije</button>
            <button onClick={() => setTab('waitlist')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'waitlist' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Čakalna vrsta ({WAITLIST.length})</button>
            <button onClick={() => setTab('map')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'map' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tloris miz</button>
          </div>
        </div>

        {/* Content */}
        {tab === 'today' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="divide-y divide-slate-50">
                {RESERVATIONS.map((r, i) => {
                  const st = RES_STATUS_INFO[r.status]
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className={`px-4 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors ${r.status === 'late' ? st.bg : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-full ${r.avatarBg} flex items-center justify-center text-white font-bold text-xs shrink-0`}>{r.initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">{r.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{r.guests} gostov</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-500 tabular-nums">🕒 {r.time}</span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[11px] text-slate-500">📍 {r.table}</span>
                          {r.notes && (
                            <>
                              <span className="text-[10px] text-slate-400">·</span>
                              <span className="text-[10px] text-purple-600 font-medium">📝 {r.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${r.status === 'late' ? 'animate-pulse' : ''}`} />
                        <span className={`text-[10px] font-bold ${st.text}`}>{st.label}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        <button className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors">📞</button>
                        <button className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors">SMS</button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {tab === 'waitlist' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  Čakalna vrsta — avtomatski SMS
                </span>
                <span className="text-[10px] text-amber-700">{WAITLIST.length} v vrsti</span>
              </div>
              <div className="divide-y divide-slate-50">
                {WAITLIST.map((w, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="text-center shrink-0 w-8">
                      <div className="text-xs font-bold text-slate-400">#{i + 1}</div>
                    </div>
                    <div className={`w-9 h-9 rounded-full ${w.avatarBg} flex items-center justify-center text-white font-bold text-xs shrink-0`}>{w.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{w.name}</div>
                      <div className="text-[11px] text-slate-500">{w.guests} gostov · pridružil {w.joined}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold tabular-nums ${w.waitMin > 15 ? 'text-rose-600' : 'text-amber-600'}`}>{w.waitMin}min</div>
                      <div className="text-[9px] text-slate-400">čakanje</div>
                    </div>
                    <button className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shrink-0">
                      📱 SMS prost
                    </button>
                  </motion.div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">AI napove: prosta miza čez ~6 min (Miza 8)</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Avtomatsko obvesti Nina Z. ko je miza prosta</span>
              </div>
            </Card>
          </motion.div>
        )}

        {tab === 'map' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tloris restavracije</span>
                <div className="flex items-center gap-3 flex-wrap">
                  {(Object.keys(TABLE_STATUS_INFO) as Array<keyof typeof TABLE_STATUS_INFO>).map(k => (
                    <span key={k} className="flex items-center gap-1 text-[10px] text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${TABLE_STATUS_INFO[k].dot}`} />
                      {TABLE_STATUS_INFO[k].label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative bg-slate-50/40" style={{ height: '320px' }}>
                {/* Mize */}
                {TABLE_MAP.map(t => {
                  const info = TABLE_STATUS_INFO[t.status as keyof typeof TABLE_STATUS_INFO]
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: t.id * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className={`absolute border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${info.color}`}
                      style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.seats > 4 ? '64px' : '52px', height: t.seats > 4 ? '56px' : '48px' }}
                    >
                      <span className="text-[10px] font-bold">M{t.id}</span>
                      <span className="text-[9px] opacity-70">{t.seats}×</span>
                    </motion.div>
                  )
                })}
                {/* Vhod */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-t-lg bg-slate-700 text-white text-[10px] font-bold">🚪 VHOD</div>
                {/* Bar */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-purple-100 border border-purple-300 text-purple-700 text-[10px] font-bold">🍸 BAR</div>
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div><div className="text-sm font-bold text-emerald-600">{TABLE_MAP.filter(t => t.status === 'free').length}</div><div className="text-[9px] text-slate-500">prostih</div></div>
                <div><div className="text-sm font-bold text-amber-600">{TABLE_MAP.filter(t => t.status === 'reserved').length}</div><div className="text-[9px] text-slate-500">rezerviranih</div></div>
                <div><div className="text-sm font-bold text-rose-600">{TABLE_MAP.filter(t => t.status === 'occupied').length}</div><div className="text-[9px] text-slate-500">zasedenih</div></div>
                <div><div className="text-sm font-bold text-purple-600">{TABLE_MAP.filter(t => t.status === 'late').length}</div><div className="text-[9px] text-slate-500">zamuja</div></div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  )
}

/* ============================================================
   INTEGRATIONS MARKETPLACE — ekosistem integracij (network effect)
   ============================================================ */
const INTEGRATION_CATEGORIES = [
  {
    name: 'Dostava',
    icon: '🛵',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    integrations: [
      { name: 'Wolt', emoji: '🟡', desc: 'Dostava hrane' },
      { name: 'Glovo', emoji: '🟠', desc: 'Dostava & pickup' },
      { name: 'Uber Eats', emoji: '🟢', desc: 'Globalna dostava' },
      { name: 'Jäger', emoji: '🔴', desc: 'Lokalna dostava SI' },
    ],
  },
  {
    name: 'Plačila',
    icon: '💳',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    integrations: [
      { name: 'Stripe', emoji: '💠', desc: 'Kartice, Apple/Google Pay' },
      { name: 'Braintree', emoji: '🔷', desc: 'PayPal, kartice' },
      { name: 'FURS', emoji: '🏛️', desc: 'Davčna blagajna SI' },
      { name: 'CBUS', emoji: '🟦', desc: 'Slovenske kartice' },
    ],
  },
  {
    name: 'Računovodstvo',
    icon: '📊',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    integrations: [
      { name: 'Pantheon', emoji: '🔶', desc: 'Računovodstvo SI' },
      { name: 'Minimax', emoji: '🔴', desc: 'ERP & finance' },
      { name: 'DRS', emoji: '🟢', desc: 'Davčno svetovanje' },
      { name: 'Datec', emoji: '🟡', desc: 'Fiskalni sistemi' },
    ],
  },
  {
    name: 'CRM & Marketing',
    icon: '📧',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    integrations: [
      { name: 'Mailchimp', emoji: '🟡', desc: 'Email kampanje' },
      { name: 'Brevo', emoji: '🔵', desc: 'SMS & email' },
      { name: 'Viber', emoji: '🟣', desc: 'Biz SMS Slovenija' },
      { name: 'Google Reviews', emoji: '⭐', desc: 'Ocene & feedback' },
    ],
  },
  {
    name: 'Rezervacije',
    icon: '📅',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    integrations: [
      { name: 'OpenTable', emoji: '🔴', desc: 'Globalne rezervacije' },
      { name: 'Eat App', emoji: '🟠', desc: 'Rezervacije & waitlist' },
      { name: 'Resy', emoji: '⚫', desc: 'Restavracije rezerve' },
      { name: 'TableCheck', emoji: '🔵', desc: 'Mize & rezervacije' },
    ],
  },
  {
    name: 'Analitika',
    icon: '📈',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    integrations: [
      { name: 'Google Analytics', emoji: '🟠', desc: 'Spletna analitika' },
      { name: 'Mixpanel', emoji: '🟣', desc: 'Product analytics' },
      { name: 'Power BI', emoji: '🟡', desc: 'BI dashboardi' },
      { name: 'Looker', emoji: '🔵', desc: 'Data studio' },
    ],
  },
] as const

function IntegrationsSection() {
  const [activeCat, setActiveCat] = useState<number | null>(null)
  const allIntegrations = INTEGRATION_CATEGORIES.flatMap(c => c.integrations)
  const shown = activeCat !== null ? INTEGRATION_CATEGORIES[activeCat].integrations : allIntegrations.slice(0, 12)

  return (
    <section id="integracije" className="py-16 lg:py-20 bg-slate-50/40 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
            <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
            Integrations & API
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Poveži <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent animate-gradient-text">vse</span>. Vsi sistemi na enem mestu.
          </h2>
          <p className="mt-2 text-base text-slate-600">24+ integracij v 6 kategorijah. Od dostave do računovodstva — tvoji podatki tečejo samodejno.</p>
        </div>

        {/* Kategorije filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveCat(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCat === null ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            Vse ({allIntegrations.length})
          </button>
          {INTEGRATION_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCat(activeCat === i ? null : i)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeCat === i ? cat.color + ' ring-2 ring-offset-1 ring-indigo-300' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <span>{cat.icon}</span>
              {cat.name}
              <span className="text-[10px] opacity-70">({cat.integrations.length})</span>
            </button>
          ))}
        </div>

        {/* Integrations grid */}
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {shown.map((int, i) => (
              <motion.div
                key={int.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all card-tilt"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
                    {int.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{int.name}</div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{int.desc}</div>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Povezano
                  </span>
                  <button className="text-[10px] text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
                    Konfiguriraj →
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* API callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">REST API & Webhooks</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Manjka integracija? Zgradi svojo.</h3>
              <p className="text-sm text-slate-300">Odprti REST API z webhook podporo. JavaScript SDK, PHP SDK, Python wrapper. Full docs na <span className="font-mono text-indigo-300">docs.norolep-pos.si</span></p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <code className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700 text-xs font-mono text-emerald-400">
                POST /api/v1/orders
              </code>
              <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shrink-0">
                API docs →
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stat bar */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
            <div className="text-2xl font-bold text-indigo-600 tabular-nums">24+</div>
            <div className="text-[10px] text-slate-500 mt-0.5">integracij</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">6</div>
            <div className="text-[10px] text-slate-500 mt-0.5">kategorij</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
            <div className="text-2xl font-bold text-cyan-600 tabular-nums">99,9%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">API uptime</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-center">
            <div className="text-2xl font-bold text-purple-600 tabular-nums">&lt; 50ms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">odzivni čas</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   ONBOARDING WIZARD — 5-korak setup, "15 min do prvega računa"
   ============================================================ */
const ONBOARDING_STEPS = [
  {
    n: 1,
    title: 'Registracija',
    duration: '2 min',
    icon: '📝',
    desc: 'Ustvari račun, vnesi podatke o restavraciji (naziv, naslov, davčna številka).',
    deliverable: 'Aktiven račun + FURS povezava',
    color: 'bg-emerald-500',
    light: 'bg-emerald-50 border-emerald-200',
  },
  {
    n: 2,
    title: 'Meni & artikli',
    duration: '5 min',
    icon: '🍽️',
    desc: 'Uvozi meni iz Excela ali dodaj artikle ročno. Cene, kategorije, slike, alergeni.',
    deliverable: '232 artiklov pripravljenih za prodajo',
    color: 'bg-cyan-500',
    light: 'bg-cyan-50 border-cyan-200',
  },
  {
    n: 3,
    title: 'FURS aktivacija',
    duration: '3 min',
    icon: '🏛️',
    desc: 'Naloži FURS certifikat (.p12), potrdi davčno številko. Sistem samodejno generira ZOI/EOR.',
    deliverable: 'FURS potrjen — vsak račun fiskaliziran',
    color: 'bg-amber-500',
    light: 'bg-amber-50 border-amber-200',
  },
  {
    n: 4,
    title: 'Osebje & mize',
    duration: '3 min',
    icon: '👥',
    desc: 'Dodaj natakarje, kuharje, določi postaje. Nariši tloris miz z sedeži.',
    deliverable: '6 delavcev + 12 miz pripravljenih',
    color: 'bg-rose-500',
    light: 'bg-rose-50 border-rose-200',
  },
  {
    n: 5,
    title: 'Prvi račun',
    duration: '2 min',
    icon: '🧾',
    desc: 'Vzami naročilo na mizi, pošlji v kuhinjo, izdaj račun. FURS avtomatsko, Z-Report pripravljen.',
    deliverable: '✓ Prvi račun izdan — si v poslu!',
    color: 'bg-purple-500',
    light: 'bg-purple-50 border-purple-200',
  },
] as const

function OnboardingWizardSection() {
  const [activeStep, setActiveStep] = useState(0)
  const step = ONBOARDING_STEPS[activeStep]
  const totalDuration = ONBOARDING_STEPS.reduce((s, st) => s + parseInt(st.duration), 0)

  return (
    <section id="onboarding" className="py-16 lg:py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Hitri začetek
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Od registracije do prvega računa v <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent animate-gradient-text">15 minutah</span>
          </h2>
          <p className="mt-2 text-base text-slate-600">5 korakov. Brez namestitve, brez usposabljanja, brez IT podpore. Start-up čas namestitve konkurence: 1-3 dni.</p>
        </div>

        {/* Big time-to-value banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-cyan-50 to-purple-50 border-2 border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 flex items-center justify-center shadow-lg">
                <Clock className="h-7 w-7 text-emerald-600" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white"
              />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">15 min</div>
              <div className="text-sm text-slate-600">do prvega računa · brez IT</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-rose-600 line-through tabular-nums">1-3 dni</div>
              <div className="text-[11px] text-slate-500">konkurenca (TRONpos, SpletsisPOS)</div>
            </div>
            <div className="text-2xl text-slate-300">→</div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 tabular-nums">15 min</div>
              <div className="text-[11px] text-slate-500">Noro Lep POS</div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEVO: Step navigator */}
          <div className="lg:col-span-2">
            <div className="space-y-2">
              {ONBOARDING_STEPS.map((s, i) => {
                const isActive = i === activeStep
                const isDone = i < activeStep
                return (
                  <button
                    key={s.n}
                    onClick={() => setActiveStep(i)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${isActive ? s.light + ' ring-2 ring-offset-1 ring-emerald-300' : isDone ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                  >
                    {/* Step number / check */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${isDone ? 'bg-emerald-500 text-white' : isActive ? s.color + ' text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {isDone ? '✓' : s.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{s.title}</span>
                        <span className="text-[10px] text-slate-400">{s.icon}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {s.duration}
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0"
                      >
                        AKTIVNO
                      </motion.div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
                <span className="font-semibold">Skupni napredek</span>
                <span className="tabular-nums">{Math.round(((activeStep + 1) / ONBOARDING_STEPS.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((activeStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1.5">Skupni čas: {totalDuration} min · 1-3 dni pri konkurenci</div>
            </div>
          </div>

          {/* DESNO: Aktivni step detail */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-2xl border-2 ${step.light} h-full flex flex-col`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center text-2xl shrink-0 shadow-lg`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Korak {step.n} / {ONBOARDING_STEPS.length}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 text-slate-600 font-bold">{step.duration}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed mb-4">{step.desc}</p>

                {/* Deliverable */}
                <div className="mt-auto p-3 rounded-xl bg-white/70 border border-white/80 flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${step.color} flex items-center justify-center shrink-0`}>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rezultat koraka</div>
                    <div className="text-sm font-semibold text-slate-900">{step.deliverable}</div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                    disabled={activeStep === 0}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prejšnji
                  </button>
                  {activeStep < ONBOARDING_STEPS.length - 1 ? (
                    <button
                      onClick={() => setActiveStep(s => Math.min(ONBOARDING_STEPS.length - 1, s + 1))}
                      className={`px-4 py-2 rounded-lg ${step.color} text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity`}
                    >
                      Naslednji korak →
                    </button>
                  ) : (
                    <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors">
                      🚀 Začni brezplačno
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   SUPPORT & TRAINING — multi-channel podpora + učenje
   ============================================================ */
const SUPPORT_CHANNELS = [
  {
    icon: '💬',
    title: 'Live chat',
    desc: 'Odgovor v < 2 min v delovnem času. Slovenski agenti, ne bot.',
    availability: 'Pon-Pet 8-22',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: '< 2min',
  },
  {
    icon: '📞',
    title: 'Telefon',
    desc: 'Direktna številka za nujne primere. Brez čakalne vrste.',
    availability: '24/7 za kritične',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    badge: '24/7',
  },
  {
    icon: '📧',
    title: 'Email',
    desc: 'Podroben odgovor z dokumentacijo v < 4 urah.',
    availability: 'Pon-Pet',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    badge: '< 4h',
  },
  {
    icon: '🎓',
    title: '1:1 onboarding',
    desc: 'Osebna video seja z našim specialistom. Brezplačno.',
    availability: 'Po dogovoru',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'Brezplačno',
  },
] as const

const TRAINING_RESOURCES = [
  { icon: '📹', title: 'Video vadnica', desc: '47 video vodnikov v slovenščini', count: '47', color: 'text-rose-600' },
  { icon: '📚', title: 'Dokumentacija', desc: 'Step-by-step članki z screenshots', count: '180+', color: 'text-emerald-600' },
  { icon: '🎓', title: 'Webinarji', desc: 'Tedenski live webinarji + Q&A', count: 'tedensko', color: 'text-cyan-600' },
  { icon: '👥', title: 'Skupnost', desc: 'Forum lastnikov restavracij', count: '542', color: 'text-purple-600' },
] as const

const SLA_STATS = [
  { value: '99.9%', label: 'uptime SLA', sub: 'garancija v pogodbi' },
  { value: '< 2min', label: 'chat odgovor', sub: 'povprečno' },
  { value: '4.8/5', label: 'CSAT ocena', sub: 'zadovoljstvo' },
  { value: '24/7', label: 'kritična podpora', sub: 'tudi vikendi' },
] as const

function SupportSection() {
  return (
    <section id="podpora" className="py-16 lg:py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge className="mb-3 bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
            <Heart className="h-3.5 w-3.5 mr-1.5" />
            Podpora & učenje
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Nikoli ne <span className="bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">zaideš</span>. Vedno smo tu.
          </h2>
          <p className="mt-2 text-base text-slate-600">Live chat, telefon, email, 1:1 onboarding. 47 video vodnikov, 180+ člankov, tedenski webinarji. Slovenski agenti, ne bot.</p>
        </div>

        {/* SLA stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {SLA_STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-center"
            >
              <div className="text-2xl lg:text-3xl font-bold text-cyan-600 tabular-nums">{s.value}</div>
              <div className="text-xs font-semibold text-slate-700 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEVO: Support channels */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">4 kanali podpore</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {SUPPORT_CHANNELS.map((ch, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className={`p-4 rounded-2xl border-2 ${ch.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{ch.icon}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70">{ch.badge}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{ch.title}</div>
                  <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{ch.desc}</div>
                  <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-current/10 font-semibold">{ch.availability}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* DESNO: Training resources */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Učni viri</h3>
            </div>
            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
              <div className="divide-y divide-slate-50">
                {TRAINING_RESOURCES.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg shrink-0">{r.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{r.desc}</div>
                    </div>
                    <div className={`text-sm font-bold tabular-nums shrink-0 ${r.color}`}>{r.count}</div>
                  </motion.div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[11px] text-cyan-600 font-semibold hover:text-cyan-800">Odpri help center →</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Trust guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-emerald-50 border border-cyan-200 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Garancija zadovoljstva</div>
              <div className="text-xs text-slate-600">Če v 30 dneh nisi zadovoljen — denar nazaj, brez vprašanj.</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
              <span className="font-bold text-slate-900 ml-1">4.8/5</span>
            </span>
            <span>·</span>
            <span>2.847 rešenih ticketov</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   COMMAND CENTER — Unified dashboard vseh sistemov
   ============================================================ */
interface DashboardData {
  pos: { revenueToday: number; ordersToday: number; avgCheck: number; hourlyTrend: number[]; peakHour: string; revenueChange: string }
  kds: { newOrders: number; preparing: number; ready: number; avgPrepTime: number; longestWaiting: number }
  tables: { total: number; occupied: number; free: number; reserved: number; payment: number; occupancyRate: number; avgTableTime: number }
  delivery: { total: number; newCount: number; preparing: number; ready: number; totalRevenue: number; netRevenue: number; totalCommission: number }
  ai: { criticalAlerts: number; avgConfidence: number }
  payments: { totalToday: number; byMethod: { method: string; label: string; amount: number; color: string }[] }
  inventory: { totalItems: number; lowStock: number; categories: number }
  systemHealth: { score: number; activeModules: number; uptime: string; alerts: number }
}

const ACTIVITY_TEMPLATES = [
  { make: () => `Miza ${1 + Math.floor(Math.random() * 15)} — novo naročilo`, val: () => `€${(8 + Math.random() * 40).toFixed(2).replace('.', ',')}`, tone: 'cyan' },
  { make: () => `Kuhinja — jed pripravljena (Miza ${1 + Math.floor(Math.random() * 15)})`, val: () => '✓', tone: 'amber' },
  { make: () => `Miza ${1 + Math.floor(Math.random() * 15)} — plačilo`, val: () => `€${(15 + Math.random() * 80).toFixed(2).replace('.', ',')}`, tone: 'emerald' },
  { make: () => `${['Wolt', 'Glovo', 'Uber Eats'][Math.floor(Math.random() * 3)]} — dostava prevzeta`, val: () => '→', tone: 'cyan' },
  { make: () => `Miza ${1 + Math.floor(Math.random() * 15)} — rezervacija`, val: () => `${19 + Math.floor(Math.random() * 2)}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}`, tone: 'purple' },
] as const

function CommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const [liveRevenue, setLiveRevenue] = useState(0)
  const [liveOrders, setLiveOrders] = useState(0)
  const [liveKds, setLiveKds] = useState({ newOrders: 0, preparing: 0, ready: 0 })
  const [tableStates, setTableStates] = useState<number[]>([])
  const [activity, setActivity] = useState<{ id: number; text: string; val: string; tone: string; time: string }[]>([])
  const [flash, setFlash] = useState(false)
  const [weather, setWeather] = useState<{ temp: number; cond: 'sun' | 'cloud' | 'rain' | 'snow'; city: string; aiHint: string } | null>(null)
  const idRef = useRef(0)

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/dashboard/overview')
        .then(r => r.json())
        .then(d => {
          setData(d)
          setLiveRevenue(prev => prev === 0 ? d.pos.revenueToday : prev)
          setLiveOrders(prev => prev === 0 ? d.pos.ordersToday : prev)
          setLiveKds({ newOrders: d.kds.newOrders, preparing: d.kds.preparing, ready: d.kds.ready })
          setTableStates(prev => prev.length === 0
            ? Array.from({ length: d.tables.total }, (_, i) =>
                i < d.tables.occupied ? 1 : i < d.tables.occupied + d.tables.reserved ? 2 : i < d.tables.occupied + d.tables.reserved + d.tables.payment ? 3 : 0)
            : prev)
        })
        .then(() => {
          setWeather(prev => prev ?? {
            temp: 8 + Math.floor(Math.random() * 14),
            cond: (['sun', 'cloud', 'rain', 'cloud'] as const)[Math.floor(Math.random() * 4)],
            city: 'Ljubljana',
            aiHint: 'Deževno — pričakuj +18% prodaje juh',
          })
        })
        .catch(() => {})
    }
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // LIVE SIMULATION — revenue, orders, KDS flow, table states, activity feed
  useEffect(() => {
    const sim = setInterval(() => {
      const inc = +(3 + Math.random() * 25).toFixed(2)
      setLiveRevenue(r => r + inc)
      setLiveOrders(o => o + (Math.random() < 0.3 ? 1 : 0))
      setLiveKds(k => {
        let { newOrders, preparing, ready } = k
        if (ready > 0 && Math.random() < 0.5) ready--
        if (preparing > 0 && Math.random() < 0.6) { preparing--; ready++ }
        if (newOrders > 0 && Math.random() < 0.7) { newOrders--; preparing++ }
        if (Math.random() < 0.4) newOrders++
        return { newOrders: Math.min(newOrders, 9), preparing: Math.min(preparing, 9), ready: Math.min(ready, 9) }
      })
      setTableStates(prev => {
        if (prev.length === 0) return prev
        const next = [...prev]
        const i = Math.floor(Math.random() * next.length)
        const cur = next[i]
        if (cur === 0) next[i] = Math.random() < 0.5 ? 1 : 2
        else if (cur === 1) next[i] = 3
        else if (cur === 3) next[i] = 0
        else next[i] = 1
        return next
      })
      const tpl = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)]
      const evt = {
        id: idRef.current++,
        text: tpl.make(),
        val: tpl.val(),
        tone: tpl.tone,
        time: new Date().toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setActivity(a => [evt, ...a].slice(0, 6))
      setFlash(true)
      setTimeout(() => setFlash(false), 600)
    }, 2800)
    return () => clearInterval(sim)
  }, [])

  if (!data) return null

  const occupied = tableStates.filter(s => s === 1).length
  const reserved = tableStates.filter(s => s === 2).length
  const occRate = tableStates.length ? Math.round((occupied / tableStates.length) * 100) : data.tables.occupancyRate
  const toneColor: Record<string, string> = { emerald: 'text-emerald-400', amber: 'text-amber-400', cyan: 'text-cyan-400', purple: 'text-purple-400' }

  return (
    <section id="command-center" className="py-16 lg:py-20 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] bg-emerald-500/10 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Command Center · Live
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Vsi sistemi{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">na enem zaslonu</span>
          </h2>
        </div>

        {/* Health bar */}
        <div className="mb-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-emerald-400">{data.systemHealth.score}</span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">System Health</div>
              <div className="text-xs font-bold text-emerald-400">{data.systemHealth.activeModules} modulov · {data.systemHealth.uptime}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {weather && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50" title={weather.aiHint}>
                <span className="text-lg leading-none">
                  {weather.cond === 'sun' ? '☀️' : weather.cond === 'cloud' ? '☁️' : weather.cond === 'rain' ? '🌧️' : '❄️'}
                </span>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase leading-tight">{weather.city} · Vreme</div>
                  <div className="font-bold text-white tabular-nums leading-tight">{weather.temp}°C</div>
                </div>
                <span className="hidden md:inline text-[9px] text-cyan-300 font-medium max-w-[120px] leading-tight">{weather.aiHint}</span>
              </div>
            )}
            <div className="text-center"><div className="text-slate-400">Opozorila</div><div className="font-bold text-emerald-400">{data.systemHealth.alerts}</div></div>
            <div className="text-center"><div className="text-slate-400">Čas</div><div className="font-bold text-white tabular-nums">{now ? now.toLocaleTimeString('sl-SI') : '--:--:--'}</div></div>
          </div>
        </div>

        {/* 7 System Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3 bg-slate-900/60 border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center"><Receipt className="h-3.5 w-3.5 text-emerald-400" /></div>
              <span className="text-[10px] font-bold text-slate-300">POS</span>
              <span className="ml-auto text-[8px] text-emerald-400 font-bold">{data.pos.revenueChange}</span>
            </div>
            <div className={`text-xl font-bold text-white tabular-nums transition-colors duration-500 ${flash ? 'text-emerald-300' : ''}`}>€{liveRevenue.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-[9px] text-slate-400">{liveOrders} naročil</div>
            <div className="flex items-end gap-0.5 mt-2 h-6">
              {data.pos.hourlyTrend.map((v, i) => (
                <div key={i} className="flex-1 bg-emerald-500/40 rounded-sm" style={{ height: `${(v / Math.max(...data.pos.hourlyTrend)) * 100}%` }} />
              ))}
            </div>
          </Card>

          <Card className="p-3 bg-slate-900/60 border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center"><Utensils className="h-3.5 w-3.5 text-amber-400" /></div>
              <span className="text-[10px] font-bold text-slate-300">KDS</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="text-center p-1 rounded bg-cyan-500/10"><div className="text-base font-bold text-cyan-400 tabular-nums">{liveKds.newOrders}</div><div className="text-[7px] text-slate-400">NOVA</div></div>
              <div className="text-center p-1 rounded bg-amber-500/10"><div className="text-base font-bold text-amber-400 tabular-nums">{liveKds.preparing}</div><div className="text-[7px] text-slate-400">PRIPR.</div></div>
              <div className="text-center p-1 rounded bg-emerald-500/10"><div className="text-base font-bold text-emerald-400 tabular-nums">{liveKds.ready}</div><div className="text-[7px] text-slate-400">GOTOV</div></div>
            </div>
            <div className="text-[9px] text-slate-400 mt-2">Povp: {data.kds.avgPrepTime}min</div>
          </Card>

          <Card className="p-3 bg-slate-900/60 border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center"><LayoutGrid className="h-3.5 w-3.5 text-sky-400" /></div>
              <span className="text-[10px] font-bold text-slate-300">Mize</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{occRate}%</div>
            <div className="text-[9px] text-slate-400">{occupied} zasedene · {reserved} rezervirane</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {tableStates.map((s, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded transition-colors duration-500 ${s === 1 ? 'bg-emerald-500' : s === 2 ? 'bg-amber-500' : s === 3 ? 'bg-cyan-500' : 'bg-slate-600'}`} />
              ))}
            </div>
          </Card>

          <Card className="p-3 bg-slate-900/60 border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center"><Sparkles className="h-3.5 w-3.5 text-purple-400" /></div>
              <span className="text-[10px] font-bold text-slate-300">AI</span>
              {data.ai.criticalAlerts > 0 && <span className="ml-auto px-1 py-0.5 rounded-full bg-red-500 text-white text-[7px] font-bold">{data.ai.criticalAlerts}</span>}
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{data.ai.avgConfidence}%</div>
            <div className="text-[9px] text-slate-400">zupanje predikcij</div>
          </Card>
        </div>

        {/* LIVE ACTIVITY FEED — realnočasni tok dogodkov */}
        <div className="mt-4 rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Tok dogodkov</span>
            </div>
            <span className="text-[9px] text-slate-500">realnočasno · vsakih 2,8s</span>
          </div>
          <div className="max-h-44 overflow-y-auto">
            <AnimatePresence initial={false}>
              {activity.map((evt) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -16, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="px-3 py-1.5 flex items-center gap-2.5 border-b border-slate-800/50 text-xs"
                >
                  <span className="text-[9px] text-slate-500 tabular-nums shrink-0">{evt.time}</span>
                  <span className="text-slate-300 flex-1 truncate">{evt.text}</span>
                  <span className={`font-bold tabular-nums shrink-0 ${toneColor[evt.tone]}`}>{evt.val}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Live · {now ? now.toLocaleTimeString('sl-SI') : '--:--:--'} · promet se dviga v realnem času
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   PAYMENTS — Contactless plačila
   ============================================================ */
function PaymentsSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <section id="placila" className="py-16 lg:py-20 bg-slate-50/40 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Contactless plačila
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Vsi načini{' '}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">plačila</span>
            {' '}na enem mestu
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Apple Pay, Google Pay, kartice, NFC in gotovina. $90.6B contactless market.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { icon: '🍎', label: 'Apple Pay', desc: 'iPhone & Watch', color: 'bg-black text-white' },
            { icon: 'G', label: 'Google Pay', desc: 'Android', color: 'bg-white border-2 border-slate-200 text-slate-700' },
            { icon: '💳', label: 'Kartica', desc: 'Visa, MC', color: 'bg-blue-50 text-blue-700' },
            { icon: '📱', label: 'NFC', desc: 'Tap-to-pay', color: 'bg-emerald-50 text-emerald-700' },
            { icon: '💵', label: 'Gotovina', desc: 'Klasično', color: 'bg-amber-50 text-amber-700' },
            { icon: '🔗', label: 'QR plačilo', desc: 'Skeniraj', color: 'bg-purple-50 text-purple-700' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }} className={`p-4 rounded-xl ${f.color} text-center hover:scale-105 transition-transform cursor-pointer`}>
              <div className="text-3xl mb-1">{f.icon}</div>
              <div className="text-xs font-bold">{f.label}</div>
              <div className="text-[10px] opacity-70">{f.desc}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 text-base shadow-lg shadow-emerald-500/30" onClick={() => setShowModal(true)} data-track="cta_click" data-track-label="payment_demo" data-track-section="placila">
            <CreditCard className="h-4 w-4 mr-2" />
            Poskusi demo plačilo (12.50 €)
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> PCI DSS</span>
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-500" /> 3D Secure</span>
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-emerald-500" /> Instant settlement</span>
          <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-500" /> EUR + multi-valutno</span>
        </div>
      </div>

      {showModal && <PaymentModal amount={12.50} onClose={() => setShowModal(false)} />}
    </section>
  )
}

function PaymentModal({ amount, onClose }: { amount: number; onClose: () => void }) {
  const [status, setStatus] = useState<'select' | 'processing' | 'demo'>('select')

  const handlePay = async () => {
    setStatus('processing')
    try {
      await fetch('/api/payments/create-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) })
      await new Promise(r => setTimeout(r, 1500))
      setStatus('demo')
    } catch { setStatus('select') }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div><div className="text-sm font-bold text-slate-900">Plačilo računa</div><div className="text-2xl font-bold text-emerald-600 tabular-nums">{amount.toFixed(2)} €</div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center" aria-label="Zapri"><Minus className="h-4 w-4 rotate-45 text-slate-500" /></button>
        </div>
        <div className="p-5">
          {status === 'select' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Izberi način plačila</div>
              {[
                { label: 'Apple Pay', icon: '🍎', color: 'bg-black text-white' },
                { label: 'Google Pay', icon: 'G', color: 'bg-white border-2 border-slate-200 text-slate-700' },
                { label: 'Kartica', icon: '💳', color: 'bg-blue-50 text-blue-700' },
                { label: 'Contactless', icon: '📱', color: 'bg-emerald-50 text-emerald-700' },
                { label: 'Gotovina', icon: '💵', color: 'bg-amber-50 text-amber-700' },
              ].map(m => (
                <button key={m.label} onClick={handlePay} className={`w-full flex items-center gap-3 p-3.5 rounded-xl ${m.color} hover:scale-[1.02] transition-transform active:scale-95`}>
                  <span className="text-2xl w-8 text-center">{m.icon}</span>
                  <div className="flex-1 text-left"><div className="text-sm font-bold">{m.label}</div></div>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </button>
              ))}
            </div>
          )}
          {status === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
              <div className="text-sm font-bold text-slate-900">Obdelava plačila...</div>
            </div>
          )}
          {status === 'demo' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><Sparkles className="h-8 w-8 text-amber-600" /></div>
              <div className="text-sm font-bold text-slate-900">Demo plačilo simulirano</div>
              <div className="text-xs text-slate-500 mt-2">Dodaj <code className="px-1 py-0.5 rounded bg-slate-100 text-emerald-600 font-mono">STRIPE_SECRET_KEY</code> za prava plačila.</div>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><ShieldCheck className="h-3 w-3 text-emerald-500" /> PCI DSS · Šifrirano</div>
          {(status === 'demo') && <button onClick={onClose} className="text-emerald-600 font-semibold text-xs">Zapri</button>}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ============================================================
   Z-REPORT — Dnevno zaključevanje blagajne (FURS)
   ============================================================ */
function ZReportSection() {
  const [closed, setClosed] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const report = {
    date: mounted ? new Date().toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—',
    cashier: 'Maja K.',
    location: 'Gostilna Pri Lovru, Ljubljana',
    totals: { revenue: 10681, orders: 633, avgCheck: 16.86, returns: 2, returnsValue: 32.00 },
    vat: [
      { rate: 22, base: 6215.57, vat: 1367.43, total: 7583.00 },
      { rate: 9.5, base: 2819.18, vat: 267.82, total: 3087.00 },
      { rate: 5, base: 1.90, vat: 0.10, total: 2.00 },
    ],
    payments: [
      { method: 'Kartica', count: 285, amount: 4827.50 },
      { method: 'Apple Pay', count: 127, amount: 2136.20 },
      { method: 'Google Pay', count: 95, amount: 1602.15 },
      { method: 'Gotovina', count: 76, amount: 1281.72 },
      { method: 'NFC', count: 50, amount: 833.43 },
    ],
    furs: { zoi: 'a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5', eor: 'EOR-2026-07-01-12345', messages: 633, errors: 0 },
  }

  const totalVat = report.vat.reduce((s, v) => s + v.vat, 0)
  const totalBase = report.vat.reduce((s, v) => s + v.base, 0)

  const handleClose = () => {
    setPrinting(true)
    setTimeout(() => { setPrinting(false); setClosed(true) }, 2500)
  }

  return (
    <section id="z-report" className="py-20 lg:py-28 bg-slate-50/40 border-y border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4 bg-slate-200 text-slate-700 hover:bg-slate-200">
            <Receipt className="h-3.5 w-3.5 mr-1.5" />
            Z-Report · FURS dnevni zaključek
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Dnevni zaključek{' '}
            <span className="bg-gradient-to-r from-slate-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">
              v enem kliku
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Z-Report z DDV razčlenitvijo, FURS ZOI/EOR potrditvijo in povzetkom plačil.
            Avtomatsko tiskanje na 80mm termalni tiskalnik. FURS zaključek v 2 sekundah.
          </p>
        </div>

        {/* Z-Report paper */}
        <Card className="overflow-hidden border-slate-300 shadow-xl max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 text-center">
            <div className="text-base font-bold">DNEVNI ZAKLJUČEK — Z-REPORT</div>
            <div className="text-xs opacity-70 mt-1">{report.date}</div>
            <div className="text-[10px] opacity-50 mt-0.5">{report.location} · Blagajnik: {report.cashier}</div>
          </div>

          {!closed ? (
            <div className="p-6 font-mono text-sm">
              {/* Totals */}
              <div className="border-b border-dashed border-slate-200 pb-3 mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Št. računov</span><span className="font-bold tabular-nums">{report.totals.orders}</span></div>
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Vračila</span><span className="tabular-nums">{report.totals.returns} ({report.totals.returnsValue.toFixed(2)} €)</span></div>
                <div className="flex justify-between text-base font-bold text-slate-900 mt-2 pt-2 border-t border-slate-100"><span>SKUPNI PROMET</span><span className="tabular-nums">{report.totals.revenue.toLocaleString('sl-SI')} €</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>Povprečni račun</span><span className="tabular-nums">{report.totals.avgCheck} €</span></div>
              </div>

              {/* DDV breakdown */}
              <div className="border-b border-dashed border-slate-200 pb-3 mb-3">
                <div className="text-xs font-bold text-slate-700 mb-2">DDV RAZČLENITEV</div>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-400 font-bold mb-1">
                  <span>Stopnja</span><span className="text-right">Osnova</span><span className="text-right">DDV</span><span className="text-right">Skupaj</span>
                </div>
                {report.vat.map((v, i) => (
                  <div key={i} className="grid grid-cols-4 gap-1 text-xs text-slate-600 py-0.5">
                    <span className="font-bold">{v.rate}%</span>
                    <span className="text-right tabular-nums">{v.base.toFixed(2)} €</span>
                    <span className="text-right tabular-nums">{v.vat.toFixed(2)} €</span>
                    <span className="text-right tabular-nums font-semibold">{v.total.toFixed(2)} €</span>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-1 text-xs font-bold text-slate-900 mt-1 pt-1 border-t border-slate-100">
                  <span>SKUPAJ</span>
                  <span className="text-right tabular-nums">{totalBase.toFixed(2)} €</span>
                  <span className="text-right tabular-nums">{totalVat.toFixed(2)} €</span>
                  <span className="text-right tabular-nums">{(totalBase + totalVat).toFixed(2)} €</span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="border-b border-dashed border-slate-200 pb-3 mb-3">
                <div className="text-xs font-bold text-slate-700 mb-2">PLAČILA PO METODAH</div>
                {report.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-600 py-0.5">
                    <span>{p.method} ({p.count}×)</span>
                    <span className="tabular-nums font-semibold">{p.amount.toFixed(2)} €</span>
                  </div>
                ))}
              </div>

              {/* FURS */}
              <div className="pb-3">
                <div className="text-xs font-bold text-slate-700 mb-2">FURS</div>
                <div className="flex justify-between text-[10px] text-slate-500 py-0.5"><span>ZOI</span><span className="font-mono">{report.furs.zoi.substring(0, 16)}...</span></div>
                <div className="flex justify-between text-[10px] text-slate-500 py-0.5"><span>EOR</span><span className="font-mono">{report.furs.eor}</span></div>
                <div className="flex justify-between text-[10px] text-slate-500 py-0.5"><span>Sporočila</span><span className="tabular-nums">{report.furs.messages}</span></div>
                <div className="flex justify-between text-[10px] py-0.5"><span>Napake</span><span className="tabular-nums font-bold text-emerald-600">{report.furs.errors} ✅</span></div>
              </div>

              {/* Action */}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 mt-2"
                onClick={handleClose}
                disabled={printing}
              >
                {printing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Tiskanje in FURS zaključek...</>
                ) : (
                  <><Receipt className="h-4 w-4 mr-2" />Zaključi dan · Natisni Z-Report</>
                )}
              </Button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-slate-900 mb-1">Dan zaključen! ✅</div>
              <div className="text-sm text-slate-500 mb-4">Z-Report natisnjen · FURS zaključen · EOR potrjen</div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-xs text-emerald-700 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                FURS dnevni zaključek uspešen · 0 napak
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => setClosed(false)}>
                  Ponovi zaključek
                </Button>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Features */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {[
            { icon: Zap, title: '1-klik zaključek', desc: 'FURS + tiskanje v 2s' },
            { icon: Receipt, title: '80mm termalni', desc: 'ESC/POS tiskanje' },
            { icon: ShieldCheck, title: 'FURS ZOI/EOR', desc: 'Avtomatska potrditev' },
            { icon: BarChart3, title: 'DDV razčlenitev', desc: '22%, 9.5%, 5% stopnje' },
          ].map((f, i) => (
            <Card key={i} className="p-4 border-slate-200/70 text-center">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <f.icon className="h-4 w-4 text-slate-600" />
              </div>
              <div className="text-xs font-bold text-slate-900">{f.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   EMAIL CAPTURE — brezplačni vodič kot lead magnet
   ============================================================ */
const GUIDE_CONTENTS = [
  { icon: '📋', text: '11 ključnih funkcij katere mora imeti POS 2026' },
  { icon: '🏛️', text: 'FURS ZDavP-2P 2025 — kaj se spremeni in zakaj' },
  { icon: '💰', text: 'ROI kalkulator — koliko prihraniš z AI predikcijo' },
  { icon: '🛡️', text: 'GDPR + PCI DSS — compliance checklist za restavracije' },
  { icon: '🇸🇮', text: 'Slovenski trg: cene, podpora, lokalne integracije' },
  { icon: '❌', text: '7 napak pri izbiri POS, ki stanejo 5.000€+ na leto' },
] as const

function EmailCaptureSection() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [restaurant, setRestaurant] = useState('')
  const [consent, setConsent] = useState(true)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, restaurant, consent, guide: 'pos_vodnik_2026' }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Napaka pri oddaji')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Omrežna napaka — poskusi znova')
    }
  }

  return (
    <section id="vodnik" className="py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* LEVO: Vsebina vodiča */}
          <div>
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Brezplačni vodič 2026
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
              Vodnik za izbiro <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-text">POS blagajne 2026</span>
            </h2>
            <p className="text-slate-300 mb-5 text-sm sm:text-base">
              32 strani PDF. Vse kar mora vedet lastnik restavracije pred izbiro POS — od FURS ZDavP-2P do AI predikcije. Brez prodajnega govora.
            </p>

            <div className="space-y-2 mb-6">
              {GUIDE_CONTENTS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span className="text-slate-200">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex -space-x-2">
                {['bg-emerald-500', 'bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'].map((bg, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full ${bg} border-2 border-slate-800 flex items-center justify-center text-[9px] font-bold`}>
                    {['MK', 'JN', 'AP', 'TS', 'BL'][i]}
                  </div>
                ))}
              </div>
              <span><span className="font-bold text-white">1.247</span> lastnikov je že preneslo</span>
              <span className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
              </span>
            </div>
          </div>

          {/* DESNO: Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-900">
              {status === 'success' ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Vodič je na poti! 📧</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Preveri svoj email <span className="font-semibold text-emerald-700">{email}</span>. PDF vodič prispel v naslednjih 5 minutah.
                  </p>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
                    💡 Bonus: dobili boste tudi tedenski nasvet o optimizaciji restavracije. Odjava kadarkoli.
                  </div>
                  <button
                    onClick={() => { setStatus('idle'); setEmail(''); setName(''); setRestaurant('') }}
                    className="mt-4 text-xs text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Prenesi še enega →
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-3">
                      <span className="text-xs font-bold text-emerald-700">📄 PDF · 32 strani · Brezplačno</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Prenesi vodič</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Brez kreditne kartice. Instant prenos.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="marko@moja-restavracija.si"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Ime</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Marko"
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">Restavracija</label>
                        <input
                          type="text"
                          value={restaurant}
                          onChange={(e) => setRestaurant(e.target.value)}
                          placeholder="Pri Lovru"
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Consent */}
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                      />
                      <span className="text-[11px] text-slate-500 leading-relaxed">
                        Strinjam se z obdelavo podatkov v skladu z <span className="text-emerald-700 font-medium">GDPR</span>. Lahko se odjavim kadarkoli.
                      </span>
                    </label>

                    {/* Error */}
                    {status === 'error' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                        ⚠ {errorMsg}
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'loading' || !consent}
                      className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      {status === 'loading' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Pošiljam...</>
                      ) : (
                        <>📥 Prenesi brezplačni vodič</>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> GDPR</span>
                      <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Brez spam</span>
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Instant</span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function Home() {
  useAnalytics()

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
      <ScrollProgressBar />
      <BackToTop />
      <CursorGlow />
      <LiveSocialProof />
      <SectionDots />

      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Preskoči na vsebino
      </a>

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/40 shadow-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group" aria-label="Noro Lep POS — domov">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Receipt className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight">Noro Lep</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">POS · 2026</span>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-1" aria-label="Glavna navigacija">
            {[
              { label: 'Demo', href: '#demo' },
              { label: 'Funkcije', href: '#funkcije' },
              { label: 'Primerjava', href: '#primerjava' },
              { label: 'Vmesniki', href: '#vmesniki' },
              { label: 'Mnenja', href: '#mnenja' },
              { label: 'ROI', href: '#roi' },
              { label: 'Cene', href: '#cene' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-slate-600">Prijava</Button>
            <Button size="sm" className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" data-track="cta_click" data-track-label="brezplacni_preizkus_header" data-track-section="header">
              Brezplačni preizkus
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section id="main-content" className="relative overflow-hidden" aria-label="Hero — predstavitev">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white" />
        <motion.div
          className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-emerald-400/20 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-20 -left-40 w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full bg-purple-400/8 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-poganjana · FURS skladna
                </Badge>
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                  <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                  4.9/5 · 542 restavracij
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-[1.02]">
                Tvoja restavracija{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">zasluži več</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                    <path d="M2 9C50 4 150 2 298 6" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-7 text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed">
                Najlepša slovenska POS blagajna z avtomatskim FURS, AI predikcijo prometa in kuhinjskim zaslonom.
                TEXT za natakarje (kot Toast), SLIKE za goste (upselling +22%).
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <MagneticButton className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-7 text-base shadow-lg shadow-emerald-500/30 rounded-lg font-medium" data-track="cta_click" data-track-label="brezplacni_preizkus_hero" data-track-section="hero">
                  <Zap className="h-4 w-4 mr-2" />
                  Brezplačni 30-dnevni preizkus
                </MagneticButton>
                <VideoDemoModal />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> FURS ZDavPR</span>
                <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-600" /> GDPR</span>
                <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-600" /> SLO · EN · DE · IT</span>
                <span className="flex items-center gap-1.5"><Wifi className="h-4 w-4 text-emerald-600" /> Dela offline</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <ParallaxHeroImage>
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-transparent rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 border border-white/60 bg-slate-100">
                  <img src="/pos-brand/hero-restaurant.png" alt="Noro Lep POS v restavraciji" fetchPriority="high" className="w-full h-auto" />
                </div>
              </ParallaxHeroImage>
              <motion.div initial={{ opacity: 0, x: -20, y: 10 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="absolute -left-3 sm:-left-6 top-8 bg-white rounded-xl shadow-xl border border-slate-100 p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-slate-900">FURS potrjen</div>
                  <div className="text-[10px] text-slate-500">EOR · 0.3s</div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20, y: -10 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.6, delay: 1.1 }} className="absolute -right-3 sm:-right-6 bottom-20 bg-white rounded-xl shadow-xl border border-slate-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Danes</span>
                </div>
                <div className="text-lg font-bold text-slate-900">€2,847</div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-emerald-600 font-semibold">+18%</span>
                  <span className="text-slate-400">vs včeraj</span>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.3 }} className="absolute left-1/2 -translate-x-1/2 -bottom-3 bg-white rounded-xl shadow-xl border border-slate-100 px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                  <Bell className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Miza 12 — jed pripravljena</span>
                <span className="text-[10px] text-slate-400">· zdaj</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== LIVE SALES TICKER ===== */}
      <LiveSalesTicker />

      {/* ===== STATS BAR ===== */}
      <section className="relative -mt-2 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: idx * 0.08 }}>
                <Card className="p-5 border-slate-200/70 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl lg:text-3xl font-bold text-slate-900 tabular-nums">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
                      </div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST BAR (certifications) ===== */}
      <TrustBar />

      {/* ===== SECURITY & COMPLIANCE ===== */}
      <SecuritySection />

      {/* ===== MULTI-LOCATION & MOBILE ===== */}
      <MultiLocationSection />

      {/* ===== SUSTAINABILITY & COST CONTROL ===== */}
      <SustainabilitySection />

      {/* ===== COMMAND CENTER ===== */}
      <CommandCenter />

      {/* ===== PAYMENTS ===== */}
      <PaymentsSection />

      {/* ===== LOYALTY & CRM ===== */}
      <LoyaltySection />

      {/* ===== INVENTORY PREVIEW ===== */}
      <InventoryPreview />

      {/* ===== DELIVERY ===== */}
      <DeliverySection />

      {/* ===== QR ORDERING & KIOSK ===== */}
      <QrOrderingSection />

      {/* ===== AI PREDICTION ===== */}
      <AIPredictionSection />

      {/* ===== MENU ENGINEERING ===== */}
      <MenuEngineeringSection />

      {/* ===== STAFF & SHIFT MANAGEMENT ===== */}
      <StaffSection />

      {/* ===== RESERVATIONS & WAITLIST ===== */}
      <ReservationsSection />

      {/* ===== INTEGRATIONS MARKETPLACE ===== */}
      <IntegrationsSection />

      {/* ===== ONBOARDING WIZARD ===== */}
      <OnboardingWizardSection />

      {/* ===== SUPPORT & TRAINING ===== */}
      <SupportSection />

      {/* ===== INTERACTIVE PRODUCT TOUR ===== */}
      <section id="demo" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50/40 to-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <ScanLine className="h-3.5 w-3.5 mr-1.5" />
              4 moduli v živo · brez registracije
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Celoten sistem{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-text">v akciji</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Preklopi med <strong>POS blagajno</strong> (Natakar + Gost), <strong>kuhinjskim zaslonom</strong>,
              <strong> tlorisom miz</strong> in <strong>AI analitiko</strong>. Vse kar potrebuješ na enem mestu.
            </p>
          </div>

          <ProductTour />

          {/* Research insight */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-12">
            <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Raziskava 5 svetovnih POS</div>
                    <div className="text-lg font-bold">Zakaj dva vmesnika?</div>
                  </div>
                </div>
                <div className="flex-1 grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-bold">Natakar = TEXT</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Toast & Lightspeed (svetovni #1 in #3) uporabljata TEXT gumbe — 24 artiklov na zaslon,
                      naročilo v 1-2 sekundah. Slike upočasnijo prepoznavo pri 50+ artiklih.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-bold">Gost = SLIKE</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Online ordering s slikami dvigne povprečni račun za +22%. Gost vidi jed, želi več.
                      Slike 750×450px (Toast standard), prikazane na QR naročanju in CFD.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section id="funkcije" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              Vse v eni aplikaciji
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              9 modulov za popolno{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-text">restavracijo</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Od prvega naročila do končnega računa — vse kar potrebuješ za vodenje restavracije.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}>
                <Card className="card-tilt group relative p-6 h-full border-slate-200/70 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer overflow-hidden">
                  <div className={`absolute -top-12 -right-12 w-32 h-32 ${feature.iconBg} rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                      <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPETITION COMPARISON ===== */}
      <section id="primerjava" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
              <Scale className="h-3.5 w-3.5 mr-1.5" />
              Iskrena primerjava
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Noro Lep vs{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                slovenske blagajne
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Poštena primerjava 11 ključnih funkcij z vodilnimi slovenskimi POS sistemi. Kjer smo boljši — povemo. Kjer zaostajamo — tudi.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <CompetitionComparison />
          </motion.div>

          {/* Key wins summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 grid sm:grid-cols-3 gap-4"
          >
            {[
              { icon: ShieldCheck, title: 'FURS skladnost', desc: 'Edini s popolno slovensko fiskalno skladnostjo', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Zap, title: 'Real-time sync', desc: 'POS→KDS→Analitika v 1 akciji — edini na trgu', color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: Globe, title: 'Slovenski jezik', desc: 'Native SLO podpora, lokalni kontekst', color: 'text-sky-600', bg: 'bg-sky-50' },
            ].map((win, i) => (
              <Card key={i} className="p-5 border-slate-200/70 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${win.bg} flex items-center justify-center shrink-0`}>
                    <win.icon className={`h-5 w-5 ${win.color}`} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{win.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{win.desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== INTERFACE COMPARISON ===== */}
      <section id="vmesniki" className="py-20 lg:py-28 bg-slate-50/40 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Vmesniki v primerjavi
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              4 vmesniki vs{' '}
              <span className="bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-text">
                svetovni liderji
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Z VLM modelom GLM-4.6V sem primerjal naše 4 vmesnike z najboljšimi POS sistemi na svetu.
              Odkrito — 2 zmagi, 2 poraza.
            </p>
          </div>

          <InterfaceComparison />
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="mnenja" className="py-20 lg:py-28 bg-slate-50/40 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-rose-100 text-rose-800 hover:bg-rose-100">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Glasovi gostincev
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              542 restavracij že{' '}
              <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">prihranilo čas</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: idx * 0.08 }}>
                <Card className="p-6 h-full border-slate-200/70 shadow-sm hover:shadow-lg transition-shadow flex flex-col">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-5 flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>{t.avatar}</div>
                    <div className="leading-tight">
                      <div className="text-sm font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                      <div className="text-[11px] text-slate-400">{t.location}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CASE STUDIES — konkretne pred/po metrike ===== */}
      <CaseStudiesSection />

      {/* ===== ROI CALCULATOR ===== */}
      <section id="roi" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50/40 to-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Izračunaj svoj prihranek
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Koliko boš{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-text">
                prihranil
              </span>{' '}
              z Noro Lep?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Vnesi parametre svoje restavracije in v živo poglej projeciran letni prihranek.
              Na podlagi realnih rezultatov 542 slovenskih restavracij.
            </p>
          </div>

          <RoiCalculator />
        </div>
      </section>

      {/* ===== Z-REPORT (dnevno zaključevanje blagajne) ===== */}
      <ZReportSection />

      {/* ===== EMAIL CAPTURE (lead magnet) ===== */}
      <EmailCaptureSection />

      {/* ===== PRICING ===== */}
      <section id="cene" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Transparentne cene
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Cenik, ki{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-text">ustreza vsaki restavraciji</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">Brez skritih stroškov. Brez vezave. Brezplačni preizkus 30 dni.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Starter', price: '0', period: '/mes', desc: 'Za majhne bife in kioske', features: ['1 lokacija, 1 blagajna', 'Do 50 jedi na meniju', 'FURS ZOI & EOR', 'Osnovna poročila', 'Email podpora'], cta: 'Brezplačni začetek', popular: false },
              { name: 'Professional', price: '49', period: '/mes', desc: 'Za restavracije in lokale', features: ['Do 3 lokacije, 5 blagajn', 'Neomezen meni & modifikatorji', 'Kuhinjski KDS v realnem času', 'Zaloge & dobavitelji', 'Vernostni program & rezervacije', 'AI predikcija prometa', 'Prioritetna 24/7 podpora'], cta: '30-dnevni preizkus', popular: true },
              { name: 'Enterprise', price: 'Po meri', period: '', desc: 'Za verige in franšize', features: ['Neomejene lokacije & blagajne', 'Multi-valutni & multi-jezik', 'API integracije (Stripe, SAP…)', 'Namenski account manager', 'On-site implementacija', 'SLA 99.9% garancija'], cta: 'Kontaktiraj prodajo', popular: false },
            ].map((plan, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: idx * 0.08 }} className={plan.popular ? 'md:-mt-4 md:mb-4' : ''}>
                <Card className={`p-7 h-full flex flex-col relative ${plan.popular ? 'border-emerald-400 shadow-2xl shadow-emerald-500/15 ring-2 ring-emerald-400/30 bg-white' : 'border-slate-200/70 shadow-sm hover:shadow-md transition-shadow bg-white'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 border-0 shadow-lg px-3 py-1">
                        <Star className="h-3 w-3 mr-1 fill-white" />
                        Najbolj priljubljen
                      </Badge>
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{plan.desc}</p>
                  </div>
                  <div className="mb-6 flex items-baseline gap-1">
                    {plan.price === 'Po meri' ? (
                      <span className="text-3xl font-bold text-slate-900">Po meri</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-slate-900">{plan.price}€</span>
                        <span className="text-sm text-slate-500">{plan.period}</span>
                      </>
                    )}
                  </div>
                  <Button className={`w-full mb-6 ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'}`} variant={plan.popular ? 'default' : 'outline'} data-track="cta_click" data-track-label={`pricing_${plan.name.toLowerCase()}`} data-track-section="pricing">
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="text-center mt-10 text-sm text-slate-500">Vsi paketi vključujejo FURS skladnost, GDPR zaščito in 99.9% SLA. DDV ni vključen v ceno.</p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-20 lg:py-28 bg-slate-50/40 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-200 text-slate-700 hover:bg-slate-200">
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              Pogosta vprašanja
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Vse kar si želel{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-text">vprašati</span>
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="bg-white border border-slate-200 rounded-xl px-5 shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-left hover:no-underline font-semibold text-slate-900 text-base py-5">{item.q}</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-sm leading-relaxed pb-5">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== DECISION HUB — finalni CTA z 3 potmi, ugodnosti, urgency ===== */}
      <section id="cta" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 shadow-2xl glow-pulse shimmer shadow-emerald-500/30">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl" />

              <div className="relative p-8 sm:p-12 lg:p-16">
                {/* Heading */}
                <div className="text-center mb-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-emerald-200" />
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
                    Pripravljen narediti naslednji korak?
                  </h2>
                  <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
                    Pridruži se 542 slovenskim restavracijam, ki že prihranjajo čas in zaslužijo več z Noro Lep POS.
                  </p>
                </div>

                {/* 6 ključnih ugodnosti — grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
                  {[
                    { icon: Zap, text: '15 min do prvega računa' },
                    { icon: ShieldCheck, text: 'FURS ZDavP-2P 2025 compliant' },
                    { icon: CreditCard, text: 'Brez kreditne kartice' },
                    { icon: Sparkles, text: 'AI predikcija vključena' },
                    { icon: Globe, text: '4 jeziki (SLO/EN/DE/IT)' },
                    { icon: Wifi, text: 'Dela offline' },
                  ].map((b, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
                    >
                      <b.icon className="h-4 w-4 text-emerald-200 shrink-0" />
                      <span className="text-xs font-semibold text-white">{b.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* 3 poti — za različne buyer stages */}
                <div className="grid sm:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
                  {/* Demo */}
                  <a href="#demo" className="group p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <Smartphone className="h-5 w-5 text-emerald-100" />
                    </div>
                    <div className="text-sm font-bold text-white">Poskusi demo</div>
                    <div className="text-[11px] text-emerald-100/80 mt-0.5">Brez prijave · 2 min</div>
                  </a>
                  {/* Vodič */}
                  <a href="#vodnik" className="group p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <Receipt className="h-5 w-5 text-emerald-100" />
                    </div>
                    <div className="text-sm font-bold text-white">Prenesi vodič</div>
                    <div className="text-[11px] text-emerald-100/80 mt-0.5">32 strani PDF · brezplačno</div>
                  </a>
                  {/* Signup */}
                  <a href="#cene" className="group p-4 rounded-2xl bg-white text-emerald-700 border border-white hover:bg-emerald-50 transition-all text-center shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <Zap className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-sm font-bold text-emerald-700">Začni brezplačno</div>
                    <div className="text-[11px] text-emerald-600 mt-0.5">30 dni · brez kreditke</div>
                  </a>
                </div>

                {/* Comparison recap — instant summary */}
                <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-slate-900/40 backdrop-blur-sm border border-white/10 mb-6">
                  <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider text-center mb-2">Zakaj Noro Lep?</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-emerald-100/70">Konkurenca</div>
                      <div className="text-sm font-bold text-rose-200 line-through">1-3 dni</div>
                      <div className="text-[10px] text-emerald-100/60">setup</div>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div>
                      <div className="text-xs text-emerald-100/70">Noro Lep</div>
                      <div className="text-sm font-bold text-white">15 min</div>
                      <div className="text-[10px] text-emerald-100/60">setup</div>
                    </div>
                  </div>
                </div>

                {/* Trust line + social proof */}
                <div className="text-center">
                  <p className="text-sm text-emerald-100 mb-3">Brez kreditne kartice · Brez vezave · 30-dnevni preizkus</p>
                  <div className="flex items-center justify-center gap-4 text-xs text-emerald-100/80 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="flex -space-x-1.5">
                        {['bg-emerald-400', 'bg-cyan-400', 'bg-purple-400', 'bg-amber-400'].map((bg, i) => (
                          <div key={i} className={`w-5 h-5 rounded-full ${bg} border-2 border-emerald-600`} />
                        ))}
                      </span>
                      <span className="font-semibold text-white">542</span> restavracij
                    </span>
                    <span className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-300 text-amber-300" />)}
                      <span className="font-semibold text-white ml-1">4.9/5</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>24/7 podpora</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="mt-auto bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-base text-white tracking-tight">Noro Lep</span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">POS · 2026</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed max-w-sm mb-5">
                Najlepša slovenska POS blagajna z avtomatskim FURS, AI predikcijo prometa in kuhinjskim zaslonom. Zgrajena z ljubeznijo za gostince.
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-900">
                  <ShieldCheck className="h-3 w-3 mr-1 text-emerald-500" /> FURS
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-900">
                  <Shield className="h-3 w-3 mr-1 text-emerald-500" /> GDPR
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-900">
                  <Globe className="h-3 w-3 mr-1 text-emerald-500" /> EU
                </Badge>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Produkt</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#demo" className="hover:text-emerald-400 transition">Demo</a></li>
                <li><a href="#funkcije" className="hover:text-emerald-400 transition">Funkcije</a></li>
                <li><a href="#cene" className="hover:text-emerald-400 transition">Cene</a></li>
                <li><a href="#faq" className="hover:text-emerald-400 transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Družba</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition">O nas</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Kariera</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Kontakt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Pravno</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition">Pogoji uporabe</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Politika zasebnosti</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Piškotki</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">SLA</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2026 Noro Lep POS. Vse pravice pridržane. Zgrajeno v Sloveniji 🇸🇮</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                Vsi sistemi operativni
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-emerald-500" />
                Slovenščina
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
