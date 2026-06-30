'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  ExternalLink,
  Gauge,
  Globe,
  HelpCircle,
  ImageIcon,
  Layers,
  Loader2,
  Moon,
  Palette,
  Receipt,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

interface PosSystem {
  id: string
  name: string
  url: string
  category: string
  country: string
  screenshot: string
  status: 'analyzed' | 'blocked' | 'error'
  accentColor: string
  accentName: string
  typography: string
  heroStyle: string
  keyFeatures: string[]
  vlmSummary: string
  designScore: number
  strengths: string[]
  weaknesses: string[]
  takeaway: string
}

interface DesignPattern {
  category: string
  pattern: string
  examples: string[]
  recommendation: string
}

interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  inspiration: string[]
}

interface ColorPalette {
  name: string
  primary: string
  accent: string
  background: string
  foreground: string
  inspiredBy: string
}

interface ResearchData {
  generatedAt: string
  totalSystemsResearched: number
  successfullyAnalyzed: number
  blockedByProtection: number
  vlmAnalyses: number
  systems: PosSystem[]
  patterns: DesignPattern[]
  ourCurrentState: {
    screenshot: string
    vlmVerdict: string
    score: number
    issues: string[]
  }
  recommendations: Recommendation[]
  colorPalette: ColorPalette[]
}

const CATEGORY_LABEL: Record<string, string> = {
  enterprise: 'Enterprise',
  restaurant: 'Restavracija',
  retail: 'Maloprodaja',
  'all-in-one': 'Vse-v-enem',
}

const PRIORITY_CONFIG = {
  critical: { label: 'Kritično', color: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' },
  high: { label: 'Visoka', color: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200' },
  medium: { label: 'Srednja', color: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200' },
  low: { label: 'Nizka', color: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200' },
}

function scoreColor(score: number): string {
  if (score >= 9) return 'text-emerald-600'
  if (score >= 8) return 'text-teal-600'
  if (score >= 7) return 'text-amber-600'
  if (score >= 6) return 'text-orange-600'
  return 'text-red-600'
}

function scoreBg(score: number): string {
  if (score >= 9) return 'bg-emerald-500'
  if (score >= 8) return 'bg-teal-500'
  if (score >= 7) return 'bg-amber-500'
  if (score >= 6) return 'bg-orange-500'
  return 'bg-red-500'
}

export default function Home() {
  const [data, setData] = useState<ResearchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'analyzed' | 'blocked'>('all')

  useEffect(() => {
    fetch('/api/pos-research')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="mt-4 text-slate-600">Nalagam svetovno primerjavo POS blagajn…</p>
      </div>
    )
  }

  const filteredSystems = data.systems.filter((s) => {
    if (filter === 'all') return true
    if (filter === 'analyzed') return s.status === 'analyzed'
    if (filter === 'blocked') return s.status === 'blocked' || s.status === 'error'
    return true
  })

  const topSystems = [...data.systems]
    .filter((s) => s.status === 'analyzed')
    .sort((a, b) => b.designScore - a.designScore)
    .slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base">POS Research</span>
              <span className="text-[11px] text-slate-500">Svetovna primerjava 2026</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <a href="#sistemi" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">Sistemi</a>
            <a href="#primerjava" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">Primerjava</a>
            <a href="#vzorec" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">Vzorec</a>
            <a href="#palete" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">Palete</a>
            <a href="#priporocila" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition">Priporočila</a>
          </nav>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Začni z graduacijo
          </Button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Emerald glow */}
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-teal-400/15 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <Badge variant="outline" className="mb-6 px-3 py-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                {data.totalSystemsResearched} svetovnih POS sistemov raziskanih
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
                Najlepše POS blagajne{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  na svetu
                </span>
                , raziskane in primerjane z našo
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl lg:max-w-none leading-relaxed">
                Z agent-browser sem obiskal 12 vodilnih POS platform (Toast, Square, Lightspeed, Shopify, Lavu…),
                zajel screenshot-e in z VLM modelom analiziral dizajn vzorce. Tu je odkrito primerjalno poročilo
                z konkretimi priporočili za našo aplikacijo.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 text-base shadow-lg shadow-emerald-500/25">
                  <Eye className="h-4 w-4 mr-2" />
                  Raziskuj screenshot-e
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6 text-base border-slate-300 hover:bg-slate-50">
                  <Target className="h-4 w-4 mr-2" />
                  Priporočila za nas
                </Button>
              </div>
            </motion.div>

            {/* Right: Hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-400/30 to-teal-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 border border-white/60">
                { }
                <img
                  src="/pos-research/hero-pos-terminal.png"
                  alt="Modern restaurant POS terminal with emerald UI"
                  className="w-full h-auto"
                />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <Badge className="bg-white/90 text-emerald-700 hover:bg-white/90 border-0 backdrop-blur shadow-md">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-generated hero
                  </Badge>
                  <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-600/90 border-0 backdrop-blur shadow-md">
                    8 / 10 VLM score
                  </Badge>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { icon: Globe, label: 'Raziskanih sistemov', value: data.totalSystemsResearched, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: CheckCircle2, label: 'Uspešno analiziranih', value: data.successfullyAnalyzed, color: 'text-teal-600', bg: 'bg-teal-50' },
              { icon: ShieldAlert, label: 'Zaščitenih (Cloudflare)', value: data.blockedByProtection, color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: Bot, label: 'VLM analiz', value: data.vlmAnalyses, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((stat, i) => (
              <Card key={i} className="p-5 border-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TOP 3 PODIUM ===== */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-slate-50/50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-3 bg-amber-100 text-amber-800 hover:bg-amber-100">
              <Award className="h-3.5 w-3.5 mr-1.5" />
              Top 3 po dizajn oceni
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Najlepše POS blagajne po VLM oceni
            </h2>
            <p className="mt-3 text-slate-600">
              GLM-4.6V vision model je vsak screenshot ocenil po barvni paleti, tipografiji, layout-u,
              hierarhiji in modernosti. Tu so zmagovalci.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {topSystems.map((sys, idx) => (
              <motion.div
                key={sys.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden border-slate-200/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    { }
                    <img
                      src={sys.screenshot}
                      alt={sys.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                          idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      {idx === 0 && (
                        <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                          <Star className="h-3 w-3 mr-1 fill-white" />
                          Zmagovalca
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge
                        className="text-white border-0 shadow-md"
                        style={{ backgroundColor: sys.accentColor }}
                      >
                        {sys.accentName}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold">{sys.name}</h3>
                      <div className={`text-2xl font-bold ${scoreColor(sys.designScore)}`}>
                        {sys.designScore.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">{sys.vlmSummary}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Gauge className="h-3.5 w-3.5" />
                      <span>{sys.takeaway}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ALL SYSTEMS GRID ===== */}
      <section id="sistemi" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <Badge className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Vsi raziskani sistemi
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                12 POS sistemov z VLM analizo
              </h2>
              <p className="mt-3 text-slate-600">
                Vsak sistem je bil obiskan z agent-browser, posnet in analiziran z GLM-4.6V vision modelom.
                Kliknite na posamezni sistem za podrobnosti.
              </p>
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">Vsi ({data.systems.length})</TabsTrigger>
                <TabsTrigger value="analyzed">Analizirani ({data.successfullyAnalyzed})</TabsTrigger>
                <TabsTrigger value="blocked">Zaščiteni ({data.blockedByProtection + (data.systems.length - data.successfullyAnalyzed - data.blockedByProtection)})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSystems.map((sys, idx) => (
              <motion.div
                key={sys.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: (idx % 3) * 0.08 }}
              >
                <Card className="overflow-hidden border-slate-200/70 shadow-sm hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    { }
                    <img
                      src={sys.screenshot}
                      alt={sys.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {sys.status === 'analyzed' && (
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-0 shadow-sm">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Analiziran
                        </Badge>
                      )}
                      {sys.status === 'blocked' && (
                        <Badge className="bg-amber-500 text-white hover:bg-amber-500 border-0 shadow-sm">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          Cloudflare
                        </Badge>
                      )}
                      {sys.status === 'error' && (
                        <Badge className="bg-red-500 text-white hover:bg-red-500 border-0 shadow-sm">
                          <XCircle className="h-3 w-3 mr-1" />
                          404
                        </Badge>
                      )}
                    </div>
                    {sys.status === 'analyzed' && (
                      <div className="absolute top-3 right-3">
                        <div
                          className="px-2.5 py-1 rounded-md text-xs font-semibold text-white shadow-md"
                          style={{ backgroundColor: sys.accentColor }}
                        >
                          {sys.designScore.toFixed(1)} / 10
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-end justify-between text-white">
                        <div>
                          <h3 className="text-lg font-bold leading-tight">{sys.name}</h3>
                          <p className="text-xs text-white/80">{sys.country} · {CATEGORY_LABEL[sys.category]}</p>
                        </div>
                        {sys.status === 'analyzed' && (
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white/60 shadow-md"
                            style={{ backgroundColor: sys.accentColor }}
                            title={sys.accentName}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    {sys.status === 'analyzed' ? (
                      <>
                        <p className="text-sm text-slate-600 line-clamp-3 mb-3">{sys.vlmSummary}</p>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 w-20">Tipografija</span>
                            <span className="font-medium text-slate-700">{sys.typography}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 w-20">Hero</span>
                            <span className="font-medium text-slate-700 line-clamp-1">{sys.heroStyle}</span>
                          </div>
                        </div>
                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            <span className="line-clamp-1">{sys.takeaway}</span>
                          </span>
                          <a
                            href={sys.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-emerald-600 transition shrink-0 ml-2"
                            aria-label={`Obišči ${sys.name}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-sm text-slate-500 italic mb-3">{sys.vlmSummary}</p>
                        <div className="mt-auto pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            {sys.takeaway}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SIDE-BY-SIDE COMPARISON ===== */}
      <section id="primerjava" className="py-16 lg:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-3 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30">
              <Scale className="h-3.5 w-3.5 mr-1.5" />
              Side-by-side primerjava
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Naša aplikacija <span className="text-emerald-400">vs</span> svetovni standard
            </h2>
            <p className="mt-3 text-slate-300">
              Isti VLM model je ocenil našo trenutno aplikacijo. Razlika je očitna —
              to je izhodišče za gradnjo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Our app */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden border-red-500/30 bg-slate-800/50 backdrop-blur">
                <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Naša aplikacija (trenutno)</h3>
                      <p className="text-xs text-slate-400">localhost:3000</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">{data.ourCurrentState.score.toFixed(1)}</div>
                    <div className="text-[10px] text-slate-500">/ 10</div>
                  </div>
                </div>
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  { }
                  <img
                    src={data.ourCurrentState.screenshot}
                    alt="Naša trenutna aplikacija"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-3">
                    <Progress value={data.ourCurrentState.score * 10} className="h-2 bg-slate-700 [&>div]:bg-red-500" />
                  </div>
                  <p className="text-sm text-slate-300 italic leading-relaxed mb-4">
                    &ldquo;{data.ourCurrentState.vlmVerdict}&rdquo;
                  </p>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Identificirane težave</div>
                    {data.ourCurrentState.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Best reference */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden border-emerald-500/40 bg-slate-800/50 backdrop-blur">
                <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Award className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">{topSystems[0].name} (referenca)</h3>
                      <p className="text-xs text-slate-400">{topSystems[0].url.replace(/https?:\/\//, '').split('/')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">{topSystems[0].designScore.toFixed(1)}</div>
                    <div className="text-[10px] text-slate-500">/ 10</div>
                  </div>
                </div>
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  { }
                  <img
                    src={topSystems[0].screenshot}
                    alt={topSystems[0].name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-3">
                    <Progress value={topSystems[0].designScore * 10} className="h-2 bg-slate-700 [&>div]:bg-emerald-500" />
                  </div>
                  <p className="text-sm text-slate-300 italic leading-relaxed mb-4">
                    &ldquo;{topSystems[0].vlmSummary}&rdquo;
                  </p>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ključne prednosti</div>
                    {topSystems[0].strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Gap analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/30">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Luknja v dizajnu</div>
                    <div className="text-3xl font-bold text-white">
                      +{(topSystems[0].designScore - data.ourCurrentState.score).toFixed(1)}{' '}
                      <span className="text-base font-normal text-slate-400">točk izboljšanja</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-300 lg:ml-auto lg:max-w-md">
                  Naša aplikacija trenutno dobi <span className="text-red-400 font-semibold">{data.ourCurrentState.score.toFixed(1)}/10</span> od VLM modela.
                  Da dosežemo nivo {topSystems[0].name} ({topSystems[0].designScore.toFixed(1)}/10), moramo implementirati spodnja priporočila.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== DESIGN PATTERNS ===== */}
      <section id="vzorec" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-3 bg-purple-100 text-purple-800 hover:bg-purple-100">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Ekstrahirani dizajn vzorci
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              8 vzorcev ki jih uporabljajo najboljši
            </h2>
            <p className="mt-3 text-slate-600">
              VLM analiza vseh 10 uspešno posnetih sistemov je razkrila konsistentne vzorce.
              To je formula za moderni POS dizajn.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.patterns.map((p, idx) => {
              const icons = [Palette, Layers, Eye, Layers, Users, Moon, Receipt, HelpCircle]
              const Icon = icons[idx % icons.length]
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: (idx % 4) * 0.08 }}
                >
                  <Card className="p-5 h-full border-slate-200/70 hover:border-emerald-300 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                      {p.category}
                    </div>
                    <h3 className="font-bold text-sm mb-2 leading-snug">{p.pattern}</h3>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{p.recommendation}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.examples.slice(0, 3).map((ex, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== COLOR PALETTES ===== */}
      <section id="palete" className="py-16 lg:py-24 bg-gradient-to-b from-slate-50/50 to-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <Palette className="h-3.5 w-3.5 mr-1.5" />
              Predlagane barvne palete
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              4 palete navdhnjene z najboljšimi
            </h2>
            <p className="mt-3 text-slate-600">
              Vsaka paleta je sestavljena iz značilnosti več POS sistemov. Emerald Professional je naša
              glavna priporočena izbira.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.colorPalette.map((pal, idx) => {
              const isRecommended = idx === 0
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                >
                  <Card className={`overflow-hidden h-full transition-all ${isRecommended ? 'border-emerald-400 shadow-lg ring-2 ring-emerald-400/30' : 'border-slate-200/70 hover:shadow-md'}`}>
                    <div className="relative h-32 flex">
                      <div className="flex-1" style={{ backgroundColor: pal.background }} />
                      <div className="flex-1" style={{ backgroundColor: pal.foreground }} />
                      <div className="flex-1" style={{ backgroundColor: pal.primary }} />
                      <div className="flex-1" style={{ backgroundColor: pal.accent }} />
                      {isRecommended && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-0">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            Priporočeno
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-1">{pal.name}</h3>
                      <p className="text-[11px] text-slate-500 mb-3">{pal.inspiredBy}</p>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Background', color: pal.background },
                          { label: 'Foreground', color: pal.foreground },
                          { label: 'Primary', color: pal.primary },
                          { label: 'Accent', color: pal.accent },
                        ].map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <div
                              className="w-4 h-4 rounded border border-slate-200"
                              style={{ backgroundColor: c.color }}
                            />
                            <span className="text-slate-500">{c.label}</span>
                            <span className="font-mono text-slate-700 ml-auto">{c.color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== RECOMMENDATIONS ===== */}
      <section id="priporocila" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <Target className="h-3.5 w-3.5 mr-1.5" />
              Concrete akcijski načrt
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              8 korakov do svetovnega razreda
            </h2>
            <p className="mt-3 text-slate-600">
              Prioritizirana priporočila, razvrščena po pomembnosti. Kritične postavke moramo
              implementirati najprej.
            </p>
          </div>

          <div className="space-y-3 max-w-4xl mx-auto">
            {data.recommendations.map((rec, idx) => {
              const cfg = PRIORITY_CONFIG[rec.priority]
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Card className={`p-5 border-l-4 ${cfg.border} hover:shadow-md transition-shadow`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${cfg.color} flex items-center justify-center shrink-0`}>
                        <span className="text-white font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-base">{rec.title}</h3>
                          <Badge className={`${cfg.color} text-white border-0 hover:opacity-90`} variant="default">
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-2">{rec.description}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-slate-400">Navdih:</span>
                          {rec.inspiration.map((ins, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {ins}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 shrink-0 mt-1" />
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 lg:py-24 bg-slate-50/50 border-t border-slate-200/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-slate-200 text-slate-700 hover:bg-slate-200">
              <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
              Pogosta vprašanja
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              FAQ o raziskavi
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="q1" className="bg-white border border-slate-200 rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="text-left hover:no-underline">
                Kako so bili izbrani POS sistemi za raziskavo?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Izbral sem 12 vodilnih svetovnih POS platform (Toast, Square, Lightspeed, Shopify, Lavu, Restroworks,
                TouchBistro, Clover, Petpooja, GloriaFood, Eats365, BentoBox) — kombinacija enterprise, restaurant-specific
                in all-in-one rešitev iz ZDA, Kanade, Indije, Evrope in Hong Konga.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2" className="bg-white border border-slate-200 rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="text-left hover:no-underline">
                Zakaj Toast in TouchBistro nista bila analizirana?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Oba sta za Cloudflare bot zaščito (&ldquo;Just a moment…&rdquo;). Kljub večkratnim retry-em z daljšimi
                pavzami (do 8 sekund) Cloudflare ni dovolil avtomatiziranega dostopa. To je sicer signal, da imajo
                veliki SaaS močno zaščito — naša aplikacija bo morala uporabljati podobne mehanizme v produkciji.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="bg-white border border-slate-200 rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="text-left hover:no-underline">
                Kako je potekala VLM analiza?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Uporabil sem GLM-4.6V vision model preko z-ai-web-dev-sdk CLI. Za vsak screenshot sem postavil
                strukturizirana vprašanja o barvni paleti, tipografiji, hero sekciji, ključnih UI/UX vzorcih in
                modernosti. Model je vrnil detajlne opise, iz katerih sem ekstrahiral 8 konsistentnih dizajn vzorcev
                in ocenil vsak sistem na skali 0–10.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4" className="bg-white border border-slate-200 rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="text-left hover:no-underline">
                Zakaj priporočaš emerald/teal namesto modre?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Trije razlogi: (1) Emerald/teal je povezan z rastjo, zaupanjem in denarjem — idealno za POS.
                (2) Več najboljših sistemov (Shopify, Lavu, Restroworks, BentoBox) ga uspešno uporablja.
                (3) Izbegne prenatrpanost modre barve, ki jo uporabljajo Square, LinkedIn, Facebook in vsa banka.
                Emerald nas bolj izpostavi in postavi blagovno znamko naravnost v restaurant vertical.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5" className="bg-white border border-slate-200 rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="text-left hover:no-underline">
                Koliko časa bo trajalo implementirati priporočila?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Kritični postavki (hero sekcija + brand paleta) lahko implementirava v eni seji. Feature grid,
                social proof in pricing kartice v naslednji. Dark mode sekcija, FAQ in mikroanimacije v tretji.
                Skupno 3–4 seje za dosego nivoja Square/Shopify.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q6" className="bg-white border border-slate-200 rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="text-left hover:no-underline">
                Ali so screenshot-e shranjene lokalno?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Da, vseh 16 screenshot-ov je v <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/public/pos-research/</code>{' '}
                mapi in so dostopne preko statičnega path-a. VLM analize so shranjene v <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/tmp/vlm-*.json</code>{' '}
                datotekah. API route <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/pos-research</code> vrača strukturirane podatke.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 border-0 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />
              <div className="relative p-8 lg:p-12 text-center">
                <Sparkles className="h-10 w-10 mx-auto mb-4 text-emerald-200" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  Pripravljen na gradnjo najlepše slovenske POS blagajne?
                </h2>
                <p className="text-emerald-50 text-lg max-w-2xl mx-auto mb-8">
                  Imamo jasno vizijo, 16 referenčnih screenshotov in 8 konkretnih priporočil.
                  Naslednji korak: implementacija hero sekcije in brand palete.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 h-12 px-8 text-base shadow-lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Začni implementacijo
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white">
                    <Eye className="h-4 w-4 mr-2" />
                    Ponovno pokaži screenshot-e
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER (sticky) ===== */}
      <footer className="mt-auto bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-white">POS Research 2026</span>
              </div>
              <p className="text-sm leading-relaxed">
                Svetovna primerjava 12 vodilnih POS blagajn z VLM analizo in konkretnimi
                priporočili za gradnjo slovenske POS aplikacije svetovnega razreda.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Raziskani sistemi</h4>
              <ul className="space-y-1.5 text-sm">
                {data.systems.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                      <ExternalLink className="h-3 w-3" />
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Tehnologije</h4>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-emerald-500" /> agent-browser (Chromium 150)</li>
                <li className="flex items-center gap-2"><Bot className="h-3.5 w-3.5 text-emerald-500" /> GLM-4.6V Vision Model</li>
                <li className="flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5 text-emerald-500" /> 16 screenshotov v PNG</li>
                <li className="flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5 text-emerald-500" /> Next.js 16 + TypeScript</li>
                <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-emerald-500" /> Generirano: {new Date(data.generatedAt).toLocaleString('sl-SI', { dateStyle: 'short', timeStyle: 'short' })}</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2026 POS Research. Primerjava izobraževalne narave.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              VLM analize opravljene z GLM-4.6V
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
