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
   INTERACTIVE POS DEMO — Toggle between Natakar (TEXT) and Gost (IMAGE)
   ============================================================ */
function PosDemo() {
  const [view, setView] = useState<'natakar' | 'gost'>('natakar')
  const [activeCat, setActiveCat] = useState<string>('predjedi')
  const [cart, setCart] = useState<Record<string, number>>({})

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
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Izdaj račun · FURS
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  ZOI · EOR · QR koda avtomatsko
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
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

      {/* ===== INTERACTIVE POS DEMO ===== */}
      <section id="demo" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50/40 to-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <ScanLine className="h-3.5 w-3.5 mr-1.5" />
              Poskusi živo · brez registracije
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Dve izkušnji,{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">ena platforma</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Preklopi med <strong>natakarjem</strong> (TEXT — kot Toast/Lightspeed) in <strong>gostom</strong> (SLIKE — upselling).
              Klikni artikel in ga dodaj v naročilo.
            </p>
          </div>

          <PosDemo />

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
