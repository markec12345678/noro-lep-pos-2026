'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
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
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

/* ============================================================
   ANIMATED COUNTER — counts up when scrolled into view
   ============================================================ */
function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
}: {
  value: number
  suffix?: string
  prefix?: string
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
      {prefix}
      {display.toLocaleString('sl-SI', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

/* ============================================================
   FEATURE DATA — 9 features with curated accent colors
   ============================================================ */
const FEATURES = [
  {
    icon: ScanLine,
    title: 'Hitra blagajna',
    desc: 'Skeniraj, tapni, plačaj. Račun izstavljen v 8 sekundah z vgrajenim FURS ZOI/EOR.',
    color: 'emerald',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: LayoutGrid,
    title: 'Upravljanje miz',
    desc: 'Vizualni tloris restavracije z barvno kodiranimi statusi miz in rezervacijami v realnem času.',
    color: 'teal',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    icon: Utensils,
    title: 'Kuhinjski KDS',
    desc: 'Kanban prikaz naročil za kuharje. Status jedi, časi priprave, avtomatska obvestila.',
    color: 'amber',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Package,
    title: 'Zaloge & dobave',
    desc: 'Sledenje zalog v realnem času, avtomatski opozorili, upravljanje dobaviteljev in naročil.',
    color: 'purple',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: ShieldCheck,
    title: 'FURS skladnost',
    desc: 'Avtomatska ZOI šifra, EOR potrdilo, QR koda na računu. Popolna skladnost z ZDavPR.',
    color: 'rose',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    icon: BarChart3,
    title: 'Analitika & poročila',
    desc: 'Dnevna poročila, Z-report, analiza jedi (menu engineering), predikcija prometa z AI.',
    color: 'sky',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
  {
    icon: Heart,
    title: 'Vernostni program',
    desc: 'Točkovanje gostov, nagrade,CRM s zgodovino obiskov in personaliziranimi ponudbami.',
    color: 'pink',
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    icon: Calendar,
    title: 'Rezervacije',
    desc: 'Online rezervacijski sistem z integracijo na Google Calendar in SMS opomniki za goste.',
    color: 'indigo',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    icon: Smartphone,
    title: 'Mobilna aplikacija',
    desc: 'Naročanje za goste preko QR kode, sledenje statusa naročila, povratne informacije.',
    color: 'lime',
    iconBg: 'bg-lime-50',
    iconColor: 'text-lime-600',
  },
]

/* ============================================================
   STATS — animated counters
   ============================================================ */
const STATS = [
  { value: 542, suffix: '+', label: 'Restavracij zaupa nam', icon: Utensils, color: 'text-emerald-600' },
  { value: 2.4, suffix: 'M€', label: 'Mesečni promet gostov', decimals: 1, icon: TrendingUp, color: 'text-teal-600' },
  { value: 30, suffix: '%', label: 'Manj časa na račun', icon: Clock, color: 'text-amber-600' },
  { value: 4.9, suffix: '/5', label: 'Povprečna ocena', decimals: 1, icon: Star, color: 'text-rose-600' },
]

/* ============================================================
   PRICING TIERS
   ============================================================ */
const PRICING = [
  {
    name: 'Starter',
    price: '0',
    period: '/mes',
    desc: 'Za majhne bife in kioske',
    features: [
      '1 lokacija, 1 blagajna',
      'Do 50 jedi na meniju',
      'FURS ZOI & EOR',
      'Osnovna poročila',
      'Email podpora',
    ],
    cta: 'Brezplačni začetek',
    popular: false,
  },
  {
    name: 'Professional',
    price: '49',
    period: '/mes',
    desc: 'Za restavracije in lokale',
    features: [
      'Do 3 lokacije, 5 blagajn',
      'Neomejen meni & modifikatorji',
      'Kuhinjski KDS v realnem času',
      'Zaloge & dobavitelji',
      'Vernostni program & rezervacije',
      'AI predikcija prometa',
      'Prioritetna 24/7 podpora',
    ],
    cta: '30-dnevni preizkus',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Po meri',
    period: '',
    desc: 'Za verige in franšize',
    features: [
      'Neomejene lokacije & blagajne',
      'Multi-valutni & multi-jezik',
      'API integracije (Stripe, SAP…)',
      'Namenski account manager',
      'On-site implementacija',
      'SLA 99.9% garancija',
    ],
    cta: 'Kontaktiraj prodajo',
    popular: false,
  },
]

/* ============================================================
   TESTIMONIALS
   ============================================================ */
const TESTIMONIALS = [
  {
    quote:
      'Po prehodu na Noro Lep POS smo skrajšali čas izdaje računa za 40%. FURS dela avtomatsko, kuharji pa končno vidijo vsa naročila na enem zaslonu.',
    name: 'Marko Kovač',
    role: 'Lastnik, Gostilna Pri Lovru',
    location: 'Ljubljana',
    avatar: 'MK',
    avatarBg: 'bg-emerald-500',
    rating: 5,
  },
  {
    quote:
      'AI predikcija prometa je zaklad. Zdaj vemo, koliko zaloge naročiti za vikend, brez da bi karkoli ugibali. Prihranili smo 15% na odpadu.',
    name: 'Ana Zupan',
    role: 'Direktorica, Restavracija Mariana',
    location: 'Bled',
    avatar: 'AZ',
    avatarBg: 'bg-teal-500',
    rating: 5,
  },
  {
    quote:
      'Mobilna aplikacija za goste je dvignila naš povprečni račun za 22%. QR naročanje deluje v 3 sekundah, gostje so navdušeni.',
    name: 'Tomaž Horvat',
    role: 'Upravljalec, Pizza Factory',
    location: 'Maribor',
    avatar: 'TH',
    avatarBg: 'bg-amber-500',
    rating: 5,
  },
]

/* ============================================================
   FAQ
   ============================================================ */
const FAQ = [
  {
    q: 'Kako hitro lahko začnem uporabljati Noro Lep POS?',
    a: 'Registracija traja 2 minuti. Po namestitvi aplikacije na tablet ali računalnik vneseš meni (ali uvoziš iz Excela), aktiviraš FURS podatke in si pripravljen za prvi račun v 15 minutah.',
  },
  {
    q: 'Ali sistem deluje brez internetne povezave?',
    a: 'Da. Vsi naročila in računi se shranjujejo lokalno in se samodejno sinhronizirajo s FURS takoj, ko je povezava spet na voljo. Tvoja restavracija nikoli ne stoji.',
  },
  {
    q: 'Katero strojno opremo potrebujem?',
    a: 'Noro Lep deluje na kateremkoli Android tabletu, iPad-u, Windows računalniku ali Mac-u. Podpira vse pogoste tiskalnike računov (EPSON, Star, Bixolon), blagajniške predale in QR scannerje.',
  },
  {
    q: 'Kakšna je FURS skladnost?',
    a: 'Noro Lep je polno skladen z ZDavPR. Avtomatsko generira ZOI (zaščitna oznaka izdajatelja) in pridobiva EOR (enkratna identifikacijska oznaka računa) od FURS v realnem času. QR koda na računu je vključena.',
  },
  {
    q: 'Ali lahko uporabljam sistem v več lokacijah?',
    a: 'Da. Paket Professional podpira do 3 lokacije z enotnim upravljanjem menija, cen in poročil. Enterprise paket omogoča neomejeno število lokacij s centraliziranim nadzorom.',
  },
  {
    q: 'Kaj če potrebujem pomoč?',
    a: 'Paket Professional vključuje 24/7 prioriteto podporo preko chata, emaila in telefonov. Enterprise paket vključuje namenskega account manager-ja in SLA 99.9% garancijo.',
  },
]

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
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
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
              { label: 'Funkcije', href: '#funkcije' },
              { label: 'Zakaj mi', href: '#zakaj' },
              { label: 'Kako deluje', href: '#kako' },
              { label: 'Primerjava', href: '#primerjava-svet' },
              { label: 'Cene', href: '#cene' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-slate-600">
              Prijava
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              Brezplačni preizkus
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        {/* Emerald glow orbs */}
        <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute top-20 -left-40 w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
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
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    zasluži več
                  </span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9C50 4 150 2 298 6"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mt-7 text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed">
                Najlepša slovenska POS blagajna z avtomatskim FURS, AI predikcijo prometa
                in kuhinjskim zaslonom. Nameščena v 15 minutah — pripravljena na prvi račun še danes.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-7 text-base shadow-lg shadow-emerald-500/30">
                  <Zap className="h-4 w-4 mr-2" />
                  Brezplačni 30-dnevni preizkus
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-7 text-base border-slate-300 hover:bg-slate-50">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Oglej si demo (2 min)
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  FURS ZDavPR skladno
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  GDPR skladno
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  SLO · EN · DE · IT
                </span>
                <span className="flex items-center gap-1.5">
                  <Wifi className="h-4 w-4 text-emerald-600" />
                  Dela tudi offline
                </span>
              </div>
            </motion.div>

            {/* Right: Hero image with floating cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 border border-white/60 bg-slate-100">
                { }
                <img
                  src="/pos-brand/hero-restaurant.png"
                  alt="Noro Lep POS v restavraciji — natakar z emerald UI na tablici"
                  className="w-full h-auto"
                />
              </div>

              {/* Floating card 1: FURS confirmed */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="absolute -left-3 sm:-left-6 top-8 bg-white rounded-xl shadow-xl border border-slate-100 p-3 flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-slate-900">FURS potrjen</div>
                  <div className="text-[10px] text-slate-500">EOR · 0.3s</div>
                </div>
              </motion.div>

              {/* Floating card 2: Revenue */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="absolute -right-3 sm:-right-6 bottom-20 bg-white rounded-xl shadow-xl border border-slate-100 p-3"
              >
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

              {/* Floating card 3: Order ready */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.3 }}
                className="absolute left-1/2 -translate-x-1/2 -bottom-3 bg-white rounded-xl shadow-xl border border-slate-100 px-3 py-2 flex items-center gap-2"
              >
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
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <Card className="p-5 border-slate-200/70 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl lg:text-3xl font-bold text-slate-900 tabular-nums">
                        <AnimatedCounter
                          value={stat.value}
                          suffix={stat.suffix}
                          decimals={stat.decimals ?? 0}
                        />
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

      {/* ===== LOGOS STRIP ===== */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Zaupajo nam vodilne slovenske restavracije
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-60">
            {['Gostilna Pri Lovru', 'Restavracija Mariana', 'Pizza Factory', 'Sushi Ljubljana', 'Bistro Bled', 'Kavarna Central'].map((name, i) => (
              <span key={i} className="text-lg font-bold text-slate-700 tracking-tight" style={{ fontFamily: i % 2 === 0 ? 'serif' : 'sans-serif' }}>
                {name}
              </span>
            ))}
          </div>
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
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                restavracijo
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Od prvega naročila do končnega računa — vse kar potrebuješ za vodenje restavracije,
              združeno v eni prelepši aplikaciji.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
              >
                <Card className="group relative p-6 h-full border-slate-200/70 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                  {/* Subtle gradient accent on hover */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 ${feature.iconBg} rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                      <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Več o {feature.title.toLowerCase()}
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DARK "ZAKAJ IZBRATI NAS" SECTION ===== */}
      <section id="zakaj" className="relative py-20 lg:py-28 bg-slate-950 text-white overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] bg-emerald-500/10 blur-3xl rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Zakaj Noro Lep?
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              3 razloga zakaj gostinci{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                izbirajo nas
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                num: '01',
                title: '2x hitrejša od tradicionalnih POS',
                desc: 'Optimiziran touch workflow, bližnjice na tipkovnici (F1-F3), hitro iskanje jedi. Povprečen račun izstavljen v 8 sekundah.',
                stat: '8s',
                statLabel: 'na račun',
                icon: Zap,
              },
              {
                num: '02',
                title: 'AI ki resnično prihrani denar',
                desc: 'Predikcija prometa za naslednji teden, optimizacija zalog, prepoznavanje najbolj donosnih jedi (menu engineering).',
                stat: '15%',
                statLabel: 'manj odpada',
                icon: TrendingUp,
              },
              {
                num: '03',
                title: 'Vzpostavljeno v 15 minutah',
                desc: 'Brez namestitve, brez usposabljanja. Uvozi meni iz Excela, aktiviraj FURS in izstavi prvi račun še danes.',
                stat: '15min',
                statLabel: 'do prvega računa',
                icon: Clock,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="relative p-7 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/50 border border-slate-800 hover:border-emerald-500/40 transition-colors h-full">
                  <div className="flex items-start justify-between mb-5">
                    <span className="text-5xl font-bold bg-gradient-to-br from-slate-700 to-slate-800 bg-clip-text text-transparent">
                      {item.num}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 leading-snug">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">{item.desc}</p>
                  <div className="pt-4 border-t border-slate-800 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-400 tabular-nums">{item.stat}</span>
                    <span className="text-xs text-slate-500">{item.statLabel}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUCT SHOWCASE WITH ANNOTATIONS ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-teal-100 text-teal-800 hover:bg-teal-100">
              <Smartphone className="h-3.5 w-3.5 mr-1.5" />
              Oglej si izdelano
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Enota nadzorni panel{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                v živo
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Vse metrike, vsa naročila, vse mize — na enem zaslonu. Premakni miško za interaktivnost.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-emerald-200/40 via-teal-200/30 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100">
              { }
              <img
                src="/pos-brand/product-ui.png"
                alt="Noro Lep POS nadzorni panel z analitiko, mizami in naročili"
                className="w-full h-auto"
              />
            </div>

            {/* Floating annotation callouts */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute top-[20%] -left-2 sm:left-4 bg-white rounded-xl shadow-xl border border-slate-100 p-3 max-w-[180px] hidden sm:block"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-slate-900">Analitika v živo</span>
              </div>
              <p className="text-[11px] text-slate-500">Promet, pokritost, jedi v realnem času</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute top-[55%] -right-2 sm:right-4 bg-white rounded-xl shadow-xl border border-slate-100 p-3 max-w-[180px] hidden sm:block"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <LayoutGrid className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-slate-900">Tloris miz</span>
              </div>
              <p className="text-[11px] text-slate-500">Barvno kodirani statusi miz z rezervacijami</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== KAKO DELA (3 KORAKI) ===== */}
      <section id="kako" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50/60 to-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Od namestitve do računa
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Pripravljen v{' '}
              <span className="bg-gradient-to-r from-amber-500 to-emerald-600 bg-clip-text text-transparent">
                3 preprostih korakih
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200" />

            {[
              {
                num: '1',
                title: 'Ustvari račun',
                desc: 'Registriraj se v 2 minutah. Brez kreditne kartice, brez obveznosti.',
                icon: Users,
                circleBg: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
                badgeBg: 'bg-emerald-600',
              },
              {
                num: '2',
                title: 'Uvozi meni',
                desc: 'Povleci Excel datoteko ali ročno vnesej jedi. FURS podatke aktiviramo zate.',
                icon: Utensils,
                circleBg: 'bg-teal-50',
                iconColor: 'text-teal-600',
                badgeBg: 'bg-teal-600',
              },
              {
                num: '3',
                title: 'Izdaj prvi račun',
                desc: 'Odpri aplikacijo na tablici, tapni jed, izdaj račun. FURS potrjen avtomatsko.',
                icon: Receipt,
                circleBg: 'bg-amber-50',
                iconColor: 'text-amber-600',
                badgeBg: 'bg-amber-600',
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative text-center"
              >
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className={`w-24 h-24 rounded-full ${step.circleBg} flex items-center justify-center relative z-10`}>
                    <step.icon className={`h-10 w-10 ${step.iconColor}`} />
                  </div>
                  <div className={`absolute -top-1 -right-1 w-8 h-8 rounded-full ${step.badgeBg} text-white flex items-center justify-center text-sm font-bold shadow-lg z-20`}>
                    {step.num}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 text-base shadow-lg shadow-emerald-500/25">
              Začni zdaj — brezplačno
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="mt-3 text-xs text-slate-500">Brez kreditne kartice · 30 dni brezplačno · prekliči kadarkoli</p>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="mnenja" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-rose-100 text-rose-800 hover:bg-rose-100">
              <Heart className="h-3.5 w-3.5 mr-1.5" />
              Glasovi gostincev
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              542 restavracij že{' '}
              <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                prihranilo čas
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full border-slate-200/70 shadow-sm hover:shadow-lg transition-shadow flex flex-col">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-5 flex-1 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {t.avatar}
                    </div>
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

      {/* ===== COMPARISON TABLE ===== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
              <ScanLine className="h-3.5 w-3.5 mr-1.5" />
              Noro Lep vs. tradicionalni POS
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Zakaj ne{' '}
              <span className="bg-gradient-to-r from-slate-500 to-slate-700 bg-clip-text text-transparent">
                stare blagajne
              </span>
              ?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Primerjaj Noro Lep z običajnim POS sistemom in poglej razliko.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden border-slate-200 shadow-lg">
              <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                <div className="p-5 text-sm font-semibold text-slate-500">Funkcija</div>
                <div className="p-5 text-sm font-semibold text-slate-500 text-center border-l border-slate-200">Tradicionalni POS</div>
                <div className="p-5 text-sm font-bold text-emerald-700 text-center bg-emerald-50 border-l border-emerald-200">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Noro Lep POS
                  </div>
                </div>
              </div>
              {[
                { feat: 'FURS ZOI/EOR avtomatsko', trad: false, noro: true },
                { feat: 'AI predikcija prometa', trad: false, noro: true },
                { feat: 'Kuhinjski zaslon (KDS)', trad: 'Dodatak', noro: true },
                { feat: 'Mobilno naročanje (QR)', trad: false, noro: true },
                { feat: 'Offline način', trad: 'Omejeno', noro: true },
                { feat: 'Vernostni program', trad: false, noro: true },
                { feat: 'Čas do prvega računa', trad: '2-3 dni', noro: '15 minut', isText: true },
                { feat: 'Mesečna cena', trad: '89€+', noro: '0€', isText: true },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-3 border-b border-slate-100 last:border-0 ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                >
                  <div className="p-4 text-sm font-medium text-slate-700">{row.feat}</div>
                  <div className="p-4 flex items-center justify-center border-l border-slate-100">
                    {row.isText ? (
                      <span className="text-sm text-slate-500">{row.trad}</span>
                    ) : row.trad === true ? (
                      <Check className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Minus className="h-4 w-4 text-slate-300" />
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-center bg-emerald-50/40 border-l border-emerald-100">
                    {row.isText ? (
                      <span className="text-sm font-bold text-emerald-700">{row.noro}</span>
                    ) : row.noro === true ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-slate-300" />
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== NORO LEP vs SVETOVNI LIDERJI (visual comparison) ===== */}
      <section id="primerjava-svet" className="py-20 lg:py-28 bg-slate-50/40 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Iskrena primerjava s svetom
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Noro Lep POS vs{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                svetovni liderji
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Z VLM modelom GLM-4.6V sem primerjal našo stran z najboljšimi POS blagajnami na svetu.
              Tu so odkriti rezultati — pošteno in brez olepševanja.
            </p>
          </div>

          {/* 4-column visual comparison grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              {
                name: 'Noro Lep POS',
                tag: 'Naš izdelek',
                tagBg: 'bg-emerald-600',
                screenshot: '/pos-comparison/ours-hero-desktop.png',
                score: 7.5,
                scoreColor: 'text-emerald-600',
                scoreBg: 'bg-emerald-500',
                accent: '#10B981',
                accentName: 'Emerald',
                country: 'Slovenija 🇸🇮',
                strengths: [
                  'Lokalna FURS skladnost',
                  'AI-generirane slike (3x)',
                  'Floating cards v hero',
                  'Slovenski jezik & kontekst',
                ],
                weaknesses: ['Manj globalnega brand trust-a'],
                highlighted: true,
              },
              {
                name: 'Square POS',
                tag: 'Svetovni #1',
                tagBg: 'bg-blue-600',
                screenshot: '/pos-research/02-square-pos-full.png',
                score: 9.2,
                scoreColor: 'text-blue-600',
                scoreBg: 'bg-blue-500',
                accent: '#0066FF',
                accentName: 'Square Blue',
                country: 'ZDA 🇺🇸',
                strengths: [
                  'Najboljši minimalizem',
                  'Pricing tier kartice',
                  'FAQ accordion',
                  'Globalni brand authority',
                ],
                weaknesses: ['Preveč "corporate"'],
                highlighted: false,
              },
              {
                name: 'Shopify POS',
                tag: 'Svetovni #2',
                tagBg: 'bg-emerald-700',
                screenshot: '/pos-research/11-shopify-pos.png',
                score: 9.0,
                scoreColor: 'text-emerald-700',
                scoreBg: 'bg-emerald-700',
                accent: '#008060',
                accentName: 'Shopify Green',
                country: 'Kanada 🇨🇦',
                strengths: [
                  'Brand konsistenca',
                  'Dark mode sekcije',
                  '3-column cards',
                  'Ecosystem integracije',
                ],
                weaknesses: ['Manj restaurant-specific'],
                highlighted: false,
              },
              {
                name: 'Lightspeed',
                tag: 'Svetovni #3',
                tagBg: 'bg-red-600',
                screenshot: '/pos-research/03-lightspeed-main.png',
                score: 8.8,
                scoreColor: 'text-red-600',
                scoreBg: 'bg-red-500',
                accent: '#E60023',
                accentName: 'Lightspeed Red',
                country: 'Kanada 🇨🇦',
                strengths: [
                  'Premium občutek',
                  'Inter typography',
                  'Brand logos (Five Guys)',
                  'Lifestyle fotografija',
                ],
                weaknesses: ['Rdeča je agresivna'],
                highlighted: false,
              },
            ].map((sys, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={sys.highlighted ? 'lg:-mt-2 lg:mb-2' : ''}
              >
                <Card className={`overflow-hidden h-full flex flex-col transition-all ${
                  sys.highlighted
                    ? 'border-emerald-400 shadow-xl ring-2 ring-emerald-400/30'
                    : 'border-slate-200/70 shadow-sm hover:shadow-md'
                }`}>
                  {/* Screenshot */}
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                    { }
                    <img
                      src={sys.screenshot}
                      alt={`${sys.name} hero`}
                      className="w-full h-full object-cover object-top"
                    />
                    {/* Score badge */}
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-md ${sys.scoreBg}`}>
                        {sys.score.toFixed(1)}
                      </div>
                    </div>
                    {/* Tag */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold text-white shadow-sm ${sys.tagBg}`}>
                        {sys.tag}
                      </span>
                    </div>
                    {sys.highlighted && (
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 border-0 shadow-md">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Naš izdelek
                        </Badge>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm">{sys.name}</h3>
                      <span className="text-[10px] text-slate-400">{sys.country}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <div
                        className="w-3 h-3 rounded-full border border-slate-200"
                        style={{ backgroundColor: sys.accent }}
                      />
                      <span className="text-[10px] text-slate-500">{sys.accentName}</span>
                      <span className="text-slate-300">·</span>
                      <span className={`text-xs font-bold ${sys.scoreColor}`}>{sys.score.toFixed(1)}/10</span>
                    </div>
                    {/* Strengths */}
                    <div className="space-y-1 mb-3 flex-1">
                      {sys.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                          <CheckCircle2 className={`h-3 w-3 shrink-0 mt-0.5 ${sys.highlighted ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{s}</span>
                        </div>
                      ))}
                      {sys.weaknesses.map((w, i) => (
                        <div key={`w-${i}`} className="flex items-start gap-1.5 text-[11px] text-slate-400 italic">
                          <Minus className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${sys.scoreBg}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${sys.score * 10}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Honest verdict card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">VLM odkrit zaključek</div>
                    <div className="text-lg font-bold">Iskrena ocena</div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-200 leading-relaxed mb-4">
                    Pri direktni primerjavi <strong className="text-white">Noro Lep POS dobi 7.5/10</strong>, medtem ko
                    vodilni svetovni sistemi (Square 9.2, Shopify 9.0, Lightspeed 8.8) še vedno vodijo. VLM pohvali
                    našo <strong className="text-emerald-400">lokalno relevantnost</strong> (FURS, slovenski jezik),
                    <strong className="text-emerald-400"> AI-generirane slike</strong> in
                    <strong className="text-emerald-400"> floating cards</strong> v hero. Konkurenca še vedno
                    prednjači v globalnem brand trust-u in ekosistemu integracij.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
                      ✓ Presega v lokalni relevantnosti
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/20">
                      ⚠ Zaostaja v brand authority
                    </Badge>
                    <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/20">
                      ✓ Match-a v vizualnem storytelling
                    </Badge>
                  </div>
                </div>
                <div className="text-center lg:text-right shrink-0 lg:border-l lg:border-slate-700 lg:pl-6">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Luknja do #1</div>
                  <div className="text-4xl font-bold text-emerald-400 tabular-nums">1.7</div>
                  <div className="text-xs text-slate-500">točk do Square</div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="cene" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50/60 to-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Transparentne cene
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Cenik, ki{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ustreza vsaki restavraciji
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Brez skritih stroškov. Brez vezave. Brezplačni preizkus 30 dni.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PRICING.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={plan.popular ? 'md:-mt-4 md:mb-4' : ''}
              >
                <Card className={`p-7 h-full flex flex-col relative ${
                  plan.popular
                    ? 'border-emerald-400 shadow-2xl shadow-emerald-500/15 ring-2 ring-emerald-400/30 bg-white'
                    : 'border-slate-200/70 shadow-sm hover:shadow-md transition-shadow bg-white'
                }`}>
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
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
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

          <p className="text-center mt-10 text-sm text-slate-500">
            Vsi paketi vključujejo FURS skladnost, GDPR zaščito in 99.9% SLA. DDV ni vključen v ceno.
          </p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-200 text-slate-700 hover:bg-slate-200">
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              Pogosta vprašanja
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Vse kar si želel{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                vprašati
              </span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {FAQ.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="bg-white border border-slate-200 rounded-xl px-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline font-semibold text-slate-900 text-base py-5">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-sm leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 shadow-2xl shadow-emerald-500/30">
              {/* Decorative pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />
              {/* Glow */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl" />

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
                    <Calendar className="h-4 w-4 mr-2" />
                    Razgovor z ekipo
                  </Button>
                </div>
                <p className="mt-6 text-sm text-emerald-100">
                  Brez kreditne kartice · Brez vezave · Namestitev v 15 minutah
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER (sticky to bottom) ===== */}
      <footer className="mt-auto bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand column */}
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
                Najlepša slovenska POS blagajna z avtomatskim FURS, AI predikcijo prometa
                in kuhinjskim zaslonom. Zgrajena z ljubeznijo za gostince.
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-900">
                  <ShieldCheck className="h-3 w-3 mr-1 text-emerald-500" />
                  FURS
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-900">
                  <Shield className="h-3 w-3 mr-1 text-emerald-500" />
                  GDPR
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-900">
                  <Globe className="h-3 w-3 mr-1 text-emerald-500" />
                  EU
                </Badge>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Produkt</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#funkcije" className="hover:text-emerald-400 transition">Funkcije</a></li>
                <li><a href="#cene" className="hover:text-emerald-400 transition">Cene</a></li>
                <li><a href="#kako" className="hover:text-emerald-400 transition">Kako deluje</a></li>
                <li><a href="#mnenja" className="hover:text-emerald-400 transition">Mnenja</a></li>
                <li><a href="#faq" className="hover:text-emerald-400 transition">FAQ</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Družba</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition">O nas</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Kariera</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Kontakt</a></li>
              </ul>
            </div>

            {/* Legal */}
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

/* ============================================================
   Inline SVG play icon (lighter than importing)
   ============================================================ */
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
