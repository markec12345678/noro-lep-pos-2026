'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  Heart,
  LayoutGrid,
  Minus,
  Package,
  Plus,
  Receipt,
  ScanLine,
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
import { motion, useInView, animate } from 'framer-motion'
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
              <span className="text-xs text-slate-400">{new Date().toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })}</span>
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
                  className="grid grid-cols-3 sm:grid-cols-4 gap-2"
                >
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item.id)}
                      className="group relative p-3 rounded-lg border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left active:scale-95"
                    >
                      {item.popular && (
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[9px] font-bold shadow-sm">
                          ★
                        </span>
                      )}
                      <div className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">
                        {item.name}
                      </div>
                      <div className="text-sm font-bold text-emerald-600 mt-1">
                        {item.price.toFixed(2)} €
                      </div>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="gost"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item.id)}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left active:scale-95"
                    >
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
                          <span className="text-sm font-bold text-emerald-600">
                            {item.price.toFixed(2)} €
                          </span>
                          <div className="w-6 h-6 rounded-full bg-emerald-50 group-hover:bg-emerald-600 flex items-center justify-center transition-colors">
                            <Plus className="h-3.5 w-3.5 text-emerald-600 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </Card>

          {/* Info badge below device */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
            {view === 'natakar' ? (
              <>
                <Zap className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong className="text-slate-700">TEXT gumbi</strong> — kot Toast & Lightspeed. 24 artiklov na zaslon, 1-2s do naročila.</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span><strong className="text-slate-700">SLIKE artiklov</strong> — za goste. Upselling +22%, QR naročanje v 3.2s.</span>
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
            <div className="text-[10px] text-slate-400">{new Date().toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
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
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
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
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-6 text-sm shadow-lg shadow-emerald-500/30">
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
   MAIN PAGE
   ============================================================ */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Receipt className="h-5 w-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight">Noro Lep</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">POS · 2026</span>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Demo', href: '#demo' },
              { label: 'Funkcije', href: '#funkcije' },
              { label: 'Mnenja', href: '#mnenja' },
              { label: 'ROI', href: '#roi' },
              { label: 'Cene', href: '#cene' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-slate-600">Prijava</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              Brezplačni preizkus
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }} />
        <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute top-20 -left-40 w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-3xl" />

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
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">zasluži več</span>
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
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-7 text-base shadow-lg shadow-emerald-500/30">
                  <Zap className="h-4 w-4 mr-2" />
                  Brezplačni 30-dnevni preizkus
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-7 text-base border-slate-300 hover:bg-slate-50" asChild>
                  <a href="#demo">
                    <ScanLine className="h-4 w-4 mr-2" />
                    Poskusi demo (živo)
                  </a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> FURS ZDavPR</span>
                <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-600" /> GDPR</span>
                <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-600" /> SLO · EN · DE · IT</span>
                <span className="flex items-center gap-1.5"><Wifi className="h-4 w-4 text-emerald-600" /> Dela offline</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 border border-white/60 bg-slate-100">
                <img src="/pos-brand/hero-restaurant.png" alt="Noro Lep POS v restavraciji" className="w-full h-auto" />
              </div>
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
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">v akciji</span>
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
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">restavracijo</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Od prvega naročila do končnega računa — vse kar potrebuješ za vodenje restavracije.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}>
                <Card className="group relative p-6 h-full border-slate-200/70 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
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
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: idx * 0.1 }}>
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
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
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
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">ustreza vsaki restavraciji</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">Brez skritih stroškov. Brez vezave. Brezplačni preizkus 30 dni.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Starter', price: '0', period: '/mes', desc: 'Za majhne bife in kioske', features: ['1 lokacija, 1 blagajna', 'Do 50 jedi na meniju', 'FURS ZOI & EOR', 'Osnovna poročila', 'Email podpora'], cta: 'Brezplačni začetek', popular: false },
              { name: 'Professional', price: '49', period: '/mes', desc: 'Za restavracije in lokale', features: ['Do 3 lokacije, 5 blagajn', 'Neomezen meni & modifikatorji', 'Kuhinjski KDS v realnem času', 'Zaloge & dobavitelji', 'Vernostni program & rezervacije', 'AI predikcija prometa', 'Prioritetna 24/7 podpora'], cta: '30-dnevni preizkus', popular: true },
              { name: 'Enterprise', price: 'Po meri', period: '', desc: 'Za verige in franšize', features: ['Neomejene lokacije & blagajne', 'Multi-valutni & multi-jezik', 'API integracije (Stripe, SAP…)', 'Namenski account manager', 'On-site implementacija', 'SLA 99.9% garancija'], cta: 'Kontaktiraj prodajo', popular: false },
            ].map((plan, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: idx * 0.1 }} className={plan.popular ? 'md:-mt-4 md:mb-4' : ''}>
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
                  <Button className={`w-full mb-6 ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'}`} variant={plan.popular ? 'default' : 'outline'}>
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
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">vprašati</span>
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

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 shadow-2xl shadow-emerald-500/30">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="relative p-8 sm:p-12 lg:p-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-5 text-emerald-200" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
                  Pripravljen narediti naslednji korak?
                </h2>
                <p className="text-emerald-50 text-lg max-w-2xl mx-auto mb-8">
                  Pridruži se 542 slovenskim restavracijam, ki že prihranjajo čas in zaslužijo več z Noro Lep POS.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 h-12 px-8 text-base shadow-xl">
                    <Zap className="h-4 w-4 mr-2" />
                    Brezplačni 30-dnevni preizkus
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white">
                    Razgovor z ekipo
                  </Button>
                </div>
                <p className="mt-6 text-sm text-emerald-100">Brez kreditne kartice · Brez vezave · Namestitev v 15 minutah</p>
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
