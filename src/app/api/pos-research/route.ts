import { NextResponse } from 'next/server'

export interface PosSystem {
  id: string
  name: string
  url: string
  category: 'enterprise' | 'restaurant' | 'retail' | 'all-in-one'
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

export interface DesignPattern {
  category: string
  pattern: string
  examples: string[]
  recommendation: string
}

export interface ResearchData {
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
  recommendations: {
    priority: 'critical' | 'high' | 'medium' | 'low'
    title: string
    description: string
    inspiration: string[]
  }[]
  colorPalette: {
    name: string
    primary: string
    accent: string
    background: string
    foreground: string
    inspiredBy: string
  }[]
}

const SYSTEMS: PosSystem[] = [
  {
    id: 'square',
    name: 'Square POS',
    url: 'https://squareup.com/us/en/point-of-sale',
    category: 'all-in-one',
    country: 'ZDA',
    screenshot: '/pos-research/02-square-pos-full.png',
    status: 'analyzed',
    accentColor: '#0066FF',
    accentName: 'Square Blue',
    typography: 'Helvetica Neue / Geometric Sans',
    heroStyle: 'Lifestyle fotografija + 2 CTA gumba',
    keyFeatures: [
      'Modularne sekcije z ikonami',
      '3-tier pricing kartice (Free/Plus/Premium)',
      'FAQ accordion',
      'Inline POS UI mockup z obrobo',
      'Ample white space',
    ],
    vlmSummary:
      'Clean, minimalist palette (white/black/blue). Bold geometric sans-serif. Modular grid with ample white space. Pricing tier cards + FAQ accordion. Professional, trustworthy, scannable.',
    designScore: 9.2,
    strengths: [
      'Najboljši minimalizem med vsemi',
      'Jasna vizualna hierarhija',
      'Pricing kartice so odlične',
      'Brand konsistentnost (modra)',
    ],
    weaknesses: ['Preveč "corporate"', 'Manj čustveno privlačen'],
    takeaway: 'Zlati standard za B2B SaaS minimalizem',
  },
  {
    id: 'shopify',
    name: 'Shopify POS',
    url: 'https://www.shopify.com/pos',
    category: 'retail',
    country: 'Kanada',
    screenshot: '/pos-research/11-shopify-pos.png',
    status: 'analyzed',
    accentColor: '#008060',
    accentName: 'Shopify Green',
    typography: 'Shopify Sans (custom)',
    heroStyle: 'Full-width fotografija POS naprave na zeleni pulti',
    keyFeatures: [
      '3-column visual cards (Back office/POS/Online)',
      'Light green badges za use case',
      'Dark mode sekcije za kontrast',
      'Subtle hover efekti',
      'Responsive spacing',
    ],
    vlmSummary:
      'Brand green (#008060) accents on neutral base. Bold dark gray headlines. Full-width hero with POS device photo. 3-column visual cards. Dark mode sections for visual breaks. Modern, conversion-optimized.',
    designScore: 9.0,
    strengths: [
      'Brand zelena je prepoznatljiva',
      'Dark mode sekcije dajejo kontrast',
      '3-column cards odlične za skeniranje',
    ],
    weaknesses: ['Preveč fokusirano na retail', 'Manj restaurant-specific'],
    takeaway: 'Masterclass v brand konsistenci in dark/light kontrastu',
  },
  {
    id: 'lightspeed',
    name: 'Lightspeed',
    url: 'https://www.lightspeedhq.com/',
    category: 'enterprise',
    country: 'Kanada',
    screenshot: '/pos-research/03-lightspeed-main.png',
    status: 'analyzed',
    accentColor: '#E60023',
    accentName: 'Lightspeed Red',
    typography: 'Inter',
    heroStyle: 'Full-width z blurred lifestyle bg + dark overlay',
    keyFeatures: [
      'Card-based layouts z ikonami',
      'Brand logos za social proof (Five Guys, Alinea)',
      '2-3 column responsive grids',
      'High-quality lifestyle fotografija',
      'Soft natural lighting',
    ],
    vlmSummary:
      'White bg, dark gray text, bold red (#e60023) CTAs. Inter typography. Full-width hero with blurred lifestyle background + semi-transparent dark overlay. Card-based modular layouts. Brand logos for trust.',
    designScore: 8.8,
    strengths: [
      'Premium občutek z rdečo akcentno',
      'Inter typography je sodoben',
      'Social proof z brand logotipi',
    ],
    weaknesses: ['Rdeča je lahko agresivna', 'Preveč generic B2B'],
    takeaway: 'Premium enterprise občutek z enim bold akcentom',
  },
  {
    id: 'lavu',
    name: 'Lavu POS',
    url: 'https://lavu.com/',
    category: 'restaurant',
    country: 'ZDA',
    screenshot: '/pos-research/05-lavu.png',
    status: 'analyzed',
    accentColor: '#10B981',
    accentName: 'Lavu Green',
    typography: 'Inter',
    heroStyle: 'Data-driven naslov + blurred POS mockup',
    keyFeatures: [
      'AI-centric messaging ("Marty AI")',
      'Specifične številke ($4,200 v izgubah)',
      '"Wall of Love" testimonials',
      'Numbered steps (01, 02, 03)',
      'Kitchen imagery za kontekst',
    ],
    vlmSummary:
      'White bg, green accents, dark navy contrast. Bold data-driven headlines ("Your POS hid $4,200 in losses"). Marty AI profit-restoring engine. Real restaurant imagery. Wall of Love testimonials.',
    designScore: 8.5,
    strengths: [
      'Data-driven storytelling je prepričljiv',
      'AI messaging je sodoben',
      'Specifične številke gradijo zaupanje',
    ],
    weaknesses: ['Preveč marketinško', 'UI manj prikazan'],
    takeaway: 'Data + AI storytelling za čustveno prepričevanje',
  },
  {
    id: 'restroworks',
    name: 'Restroworks',
    url: 'https://www.restroworks.com/',
    category: 'enterprise',
    country: 'Indija',
    screenshot: '/pos-research/12-restroworks.png',
    status: 'analyzed',
    accentColor: '#00A896',
    accentName: 'Restroworks Teal',
    typography: 'Inter',
    heroStyle: 'Centriran naslov + 2 CTA + trust badges',
    keyFeatures: [
      'Modular feature cards (Kitchen/Insights/Digital)',
      'Line art ikone (fork/knife)',
      'Gradient accents (purple/blue)',
      'Social proof (McDonald\'s, Subway)',
      '3-column responsive grids',
    ],
    vlmSummary:
      'Teal (#00A896) CTAs, black headings, white bg. Bold Inter typography. Centered hero + 2 CTAs + trust badges (25,000+ restaurants). Modular feature cards with line art icons. Gradient accents.',
    designScore: 8.3,
    strengths: [
      'Teal je edinstven in professional',
      'Line art ikone so elegantne',
      'Enterprise trust signals',
    ],
    weaknesses: ['Preveč feature-list orientiran', 'Manj čustven'],
    takeaway: 'Enterprise teal + line art za profesionalni občutek',
  },
  {
    id: 'petpooja',
    name: 'Petpooja',
    url: 'https://www.petpooja.com/',
    category: 'restaurant',
    country: 'Indija',
    screenshot: '/pos-research/09-petpooja-small.png',
    status: 'analyzed',
    accentColor: '#DC2626',
    accentName: 'Petpooja Red',
    typography: 'Inter',
    heroStyle: 'Dark navy bg + centered headline + red CTA',
    keyFeatures: [
      'Dark mode default (navy #0F172A)',
      'Color-coded tables (blue/green/yellow)',
      'Red action buttons za urgency',
      'Table management UI showcase',
      'Device mockups',
    ],
    vlmSummary:
      'Deep navy (#0F172A) background, white text, red (#DC2626) accents. Minimalist centered hero. POS UI screenshot with color-coded tables. Red action buttons for urgency. Tech-forward device mockups.',
    designScore: 8.0,
    strengths: [
      'Dark mode je sodoben in drzen',
      'Color-coded tables so vizualno jasne',
      'Red CTA ustvarja urgency',
    ],
    weaknesses: ['Dark mode ni za vsakogar', 'Preveč "startup" feeling'],
    takeaway: 'Dark mode + color-coding za sodoben, drzen občutek',
  },
  {
    id: 'gloriafood',
    name: 'GloriaFood',
    url: 'https://www.gloriafood.com/',
    category: 'restaurant',
    country: 'Romunija',
    screenshot: '/pos-research/13-gloriafood.png',
    status: 'analyzed',
    accentColor: '#F97316',
    accentName: 'Gloria Orange',
    typography: 'Inter / Roboto',
    heroStyle: 'Blurred kitchen bg + dark overlay + central text',
    keyFeatures: [
      'Navy (#1E3A8A) za trust + orange (#F97316) za action',
      'Mobile-first UI mockups',
      'Testimonials s fotografijami',
      'FAQ accordion',
      'Warm food imagery',
    ],
    vlmSummary:
      'Navy blue for trust, orange for action. Blurred kitchen background with flames/chefs. Mobile-first UI mockups. Testimonials with photos. FAQ accordion. Warm food imagery evokes appetite.',
    designScore: 7.8,
    strengths: [
      'Dvojna barvna strategija (trust + action)',
      'Mobile-first pristop',
      'Warm food imagery',
    ],
    weaknesses: ['Preveč "templated"', 'Manj premium občutek'],
    takeaway: 'Dvojna barvna strategija: trust (navy) + action (orange)',
  },
  {
    id: 'eats365',
    name: 'Eats365',
    url: 'https://www.eats365.com/',
    category: 'restaurant',
    country: 'Hong Kong',
    screenshot: '/pos-research/08-eats365.png',
    status: 'analyzed',
    accentColor: '#FF8C42',
    accentName: 'Eats365 Orange',
    typography: 'Bold Sans-serif',
    heroStyle: 'Orange gradient + food photos framing headline',
    keyFeatures: [
      'Warm orange gradient hero',
      'Cuisine category tiles',
      'Time indicators (10m/15m)',
      'Rounded card layouts',
      'Special offer badges',
    ],
    vlmSummary:
      'Warm orange (#FF8C42) hero gradient, white content sections, vibrant food imagery. Bold sans-serif. Cuisine category tiles. Time indicators for proximity. Rounded cards. Cohesive orange/white palette.',
    designScore: 7.5,
    strengths: [
      'Warm orange je appetizing',
      'Category tiles so intuitivne',
      'Cohesive brand palette',
    ],
    weaknesses: ['Manj profesionalen kot Square', 'Preveč consumer-y'],
    takeaway: 'Warm barve za appetizing restaurant občutek',
  },
  {
    id: 'bentobox',
    name: 'BentoBox → Clover',
    url: 'https://www.getbento.com/',
    category: 'restaurant',
    country: 'ZDA',
    screenshot: '/pos-research/10-bentobox.png',
    status: 'analyzed',
    accentColor: '#0D9488',
    accentName: 'Bento Teal',
    typography: 'Inter / Helvetica',
    heroStyle: 'Two-column: text levo + lifestyle fotografija desno',
    keyFeatures: [
      'Creamy beige background',
      'Rounded corners na slikah/gumbih',
      'High-quality lifestyle fotografija',
      'Minimalist iconography',
      'Responsive grid layout',
    ],
    vlmSummary:
      'Creamy beige background, dark gray text, teal accent buttons. Clean sans-serif. Two-column grid with lifestyle images. Rounded corners, ample white space. High-quality lifestyle photography.',
    designScore: 7.7,
    strengths: [
      'Beige bg je topla in elegantna',
      'Rounded corners so sodobni',
      'Lifestyle fotografija je vrhunska',
    ],
    weaknesses: ['Manj funkcionalen prikaz', 'Preveč "lifestyle"'],
    takeaway: 'Beige + teal + rounded = topel, eleganten restaurant občutek',
  },
  {
    id: 'clover',
    name: 'Clover POS',
    url: 'https://www.clover.com/pos',
    category: 'all-in-one',
    country: 'ZDA',
    screenshot: '/pos-research/06-clover.png',
    status: 'error',
    accentColor: '#008040',
    accentName: 'Clover Green',
    typography: 'Helvetica / Arial',
    heroStyle: '404 page (URL je bil napačen)',
    keyFeatures: [
      'Cookie consent modal',
      'Category navigation grid',
      'Error recovery guidance',
      'Branded consistency (green)',
    ],
    vlmSummary:
      '404 page captured. Dominant green (#008040) for brand identity. Clean sans-serif. Minimalist icons. Cookie consent modal prominent. Category navigation grid. Friendly error recovery.',
    designScore: 6.0,
    strengths: ['Brand zelena je prepoznatljiva', 'Clean error handling'],
    weaknesses: ['404 namesto prave strani', 'Manj podatkov za analizo'],
    takeaway: 'Pomembnost pravilnega URL-ja in clean error recovery',
  },
  {
    id: 'toast',
    name: 'Toast POS',
    url: 'https://toasttab.com/',
    category: 'restaurant',
    country: 'ZDA',
    screenshot: '/pos-research/01-toast-marketing.png',
    status: 'blocked',
    accentColor: '#FF8C42',
    accentName: 'Toast Orange',
    typography: 'Inter (predvidoma)',
    heroStyle: 'Cloudflare "Just a moment..." challenge',
    keyFeatures: [
      'Popolnoma za Cloudflare zaščito',
      'Ni bilo mogoče analizirati UI',
      'Samo login page vidna',
    ],
    vlmSummary:
      'Cloudflare challenge page captured instead of actual Toast marketing. Only "Just a moment..." loading screen visible. Could not analyze actual Toast UI design.',
    designScore: 0,
    strengths: ['Močna zaščita proti botom'],
    weaknesses: ['Nepristopen za raziskovanje', 'Ni podatkov za analizo'],
    takeaway: 'Tudi vodilni POS ima Cloudflare — pomembnost bot zaščite',
  },
  {
    id: 'touchbistro',
    name: 'TouchBistro',
    url: 'https://www.touchbistro.com/',
    category: 'restaurant',
    country: 'Kanada',
    screenshot: '/pos-research/04-touchbistro.png',
    status: 'blocked',
    accentColor: '#FF6B35',
    accentName: 'TouchBistro Orange',
    typography: 'Inter (predvidoma)',
    heroStyle: 'Cloudflare "Just a moment..." challenge',
    keyFeatures: [
      'Popolnoma za Cloudflare zaščito',
      'Večkratni retry-ji neuspešni',
    ],
    vlmSummary:
      'Cloudflare challenge page. Could not bypass protection even with extended waits. No actual TouchBistro UI visible for analysis.',
    designScore: 0,
    strengths: ['Močna bot zaščita'],
    weaknesses: ['Nepristopen za avtomatizirano raziskovanje'],
    takeaway: 'Cloudflare je standard za velike SaaS — moramo upoštevati',
  },
]

const PATTERNS: DesignPattern[] = [
  {
    category: 'Barvna paleta',
    pattern: 'Bela osnova + ENA bold akcentna barva',
    examples: ['Square (modra)', 'Shopify (zelena)', 'Lightspeed (rdeča)', 'Restroworks (teal)', 'Lavu (zelena)'],
    recommendation:
      'Uporabi belo/cream osnovo z emerald (#10B981) ali teal (#0D9488) akcentom. Izbegni indigo/modro (prepovedano). Ena akcentna barva gradi brand prepoznavnost.',
  },
  {
    category: 'Tipografija',
    pattern: 'Inter ali Geist Sans, bold naslovi, regular body',
    examples: ['Lightspeed (Inter)', 'Shopify (custom)', 'Lavu (Inter)', 'Restroworks (Inter)'],
    recommendation:
      'Geist Sans je že nameščen — uporabi ga. Bold (700) za naslove, medium (500) za podnaslove, regular (400) za body. Velika hierarhija: 48px naslov, 18px body.',
  },
  {
    category: 'Hero sekcija',
    pattern: 'Bold naslov + 2 CTA + lifestyle fotografija ali UI mockup',
    examples: ['Square (lifestyle photo)', 'Shopify (POS device)', 'Lightspeed (blurred bg)', 'Lavu (data headline)'],
    recommendation:
      'Hero z bold naslovom (48-64px), podnaslovom (18-20px), dvema CTA gumboma (primary + secondary). Desno stran izkoristi za UI mockup ali lifestyle fotografijo.',
  },
  {
    category: 'Layout',
    pattern: 'Modularne kartice v 3-column grid-u z ample white space',
    examples: ['Square (feature cards)', 'Shopify (3-column)', 'Restroworks (modular)'],
    recommendation:
      '3-column grid za feature kartice. Ample white space (gap-8 do gap-12). Konsistentno padding (p-6 do p-8). Konsistentne višine kartic.',
  },
  {
    category: 'Social proof',
    pattern: 'Brand logotipi + testimonials s fotografijami + specifične številke',
    examples: ['Lightspeed (Five Guys, Alinea)', 'Restroworks (McDonald\'s, 25K+)', 'Lavu ($4,200)', 'Shopify (stats)'],
    recommendation:
      'Sekcija z "Trusted by" logotipi. Testimonial kartice z avatarjem, imenom, vlogo in citatom. Specifične številke (uporabniki, prihranek, rating).',
  },
  {
    category: 'Dark mode sekcije',
    pattern: 'Kontrastne dark sekcije za vizualne prelome',
    examples: ['Shopify (dark "Connected retail")', 'Petpooja (full dark)'],
    recommendation:
      'Vstavi 1-2 dark sekciji med light sekcijami za vizualni ritem. Dark bg (oklch 0.145), white text, accent color za CTA.',
  },
  {
    category: 'Pricing',
    pattern: '3-tier pricing kartice z jasno primerjavo',
    examples: ['Square (Free/Plus/Premium)', 'Shopify (3 tiers)'],
    recommendation:
      '3 pricing kartice (Starter/Pro/Enterprise). Srednja označena kot "Most popular". Čista tabela feature-ov. "Try free" CTA.',
  },
  {
    category: 'FAQ',
    pattern: 'Accordion razdelki za skeniranje',
    examples: ['Square (FAQ accordion)', 'GloriaFood (expandable)'],
    recommendation:
      'FAQ accordion na dnu. 5-8 pogostih vprašanj. + ikona za razširitev. Konsistenten styling z ostalimi sekcijami.',
  },
]

const RECOMMENDATIONS = [
  {
    priority: 'critical' as const,
    title: 'Zgradi hero sekcijo z bold naslovom in UI mockupom',
    description:
      'Trenutna stran je prazna (samo Z.ai logo). Potrebujemo hero z bold naslovom "POS blagajna za slovenske gostince", podnaslovom, dvema CTA gumboma (Demo, Prijava) in UI mockupom ali lifestyle fotografijo desno.',
    inspiration: ['Square', 'Shopify', 'Lightspeed'],
  },
  {
    priority: 'critical' as const,
    title: 'Definiraj brand barvno paleto',
    description:
      'Bela (#FFFFFF) ali cream (#FAF7F2) osnova. Emerald (#10B981) ali teal (#0D9488) kot primarni akcent. Dark gray (#0F172A) za besedilo. To gradi prepoznavnost in izstopa med slovenskimi POS sistemi.',
    inspiration: ['Shopify', 'Restroworks', 'Lavu'],
  },
  {
    priority: 'high' as const,
    title: 'Dodaj social proof sekcijo z logotipi in številkami',
    description:
      '"Zaupajo nam 500+ slovenskih restavracij" z logotipi. Testimonial kartice z avatarji. Specifične številke: "30% manj časa na račun", "2x več naročil v rush hour".',
    inspiration: ['Lavu', 'Restroworks', 'Lightspeed'],
  },
  {
    priority: 'high' as const,
    title: 'Ustvari feature grid z ikonami',
    description:
      '3-column grid z 6-9 feature karticami (Naročila, Mize, Kuhinja, Zaloge, FURS, Analitika). Vsaka kartica: ikona (lucide-react), naslov, kratek opis. Hover efekti.',
    inspiration: ['Square', 'Shopify', 'Restroworks'],
  },
  {
    priority: 'high' as const,
    title: 'Implementiraj pricing 3-tier kartice',
    description:
      'Starter (brezplačno), Pro (49€/mes), Enterprise (custom). Srednja označena "Priporočeno". Čista tabela feature-ov. "Brezplačni 30-dnevni preizkus" CTA.',
    inspiration: ['Square', 'Shopify'],
  },
  {
    priority: 'medium' as const,
    title: 'Dodaj dark mode sekcijo za vizualni ritem',
    description:
      '1-2 dark sekciji med light sekcijami (npr. "Zakaj izbrati nas" ali stats bar). Dark bg, white text, emerald accent za CTA. Ta kontrast je characteristic za najboljše SaaS.',
    inspiration: ['Shopify', 'Petpooja'],
  },
  {
    priority: 'medium' as const,
    title: 'Ustvari FAQ accordion sekcijo',
    description:
      '5-8 pogostih vprašanj (Kako deluje FURS? Ali podpira offline način? Katera strojna oprema?). + ikona za razširitev. Konsistenten styling.',
    inspiration: ['Square', 'GloriaFood'],
  },
  {
    priority: 'low' as const,
    title: 'Dodaj mikrointerakcije in animacije',
    description:
      'Framer Motion fade-in/slide-up ob scroll-u. Hover scale na karticah (1.02). Smooth scroll med sekcijami. Loading skeleton-i.',
    inspiration: ['Shopify', 'Lightspeed'],
  },
]

const COLOR_PALETTES = [
  {
    name: 'Emerald Professional (priporočeno)',
    primary: '#10B981',
    accent: '#059669',
    background: '#FFFFFF',
    foreground: '#0F172A',
    inspiredBy: 'Shopify + Lavu + Restroworks',
  },
  {
    name: 'Teal Enterprise',
    primary: '#0D9488',
    accent: '#0F766E',
    background: '#FAF7F2',
    foreground: '#1C1917',
    inspiredBy: 'Restroworks + BentoBox',
  },
  {
    name: 'Warm Restaurant',
    primary: '#F97316',
    accent: '#EA580C',
    background: '#FFFBF5',
    foreground: '#1C1917',
    inspiredBy: 'GloriaFood + Eats365',
  },
  {
    name: 'Dark Premium',
    primary: '#10B981',
    accent: '#34D399',
    background: '#0F172A',
    foreground: '#F8FAFC',
    inspiredBy: 'Petpooja + Shopify dark',
  },
]

export async function GET() {
  const data: ResearchData = {
    generatedAt: new Date().toISOString(),
    totalSystemsResearched: SYSTEMS.length,
    successfullyAnalyzed: SYSTEMS.filter((s) => s.status === 'analyzed').length,
    blockedByProtection: SYSTEMS.filter((s) => s.status === 'blocked').length,
    vlmAnalyses: SYSTEMS.filter((s) => s.status === 'analyzed').length,
    systems: SYSTEMS,
    patterns: PATTERNS,
    ourCurrentState: {
      screenshot: '/pos-research/00-our-app-current.png',
      vlmVerdict:
        'Extremely sparse — lacking navigation, branding context, or functional elements typical of a POS homepage. While the logo is clean, the overall layout feels unfinished and unpolished. Compared to production POS systems (Toast, Square, Lightspeed), which prioritize clarity, usability, and brand identity with structured layouts, this falls short. Appears more like a placeholder or early prototype than a professional, modern POS interface.',
      score: 2.0,
      issues: [
        'Ni navigacije (header/links)',
        'Ni brand identitete (ime, barve, font)',
        'Ni nobene funkcionalne sekcije (hero, features, pricing)',
      ],
    },
    recommendations: RECOMMENDATIONS,
    colorPalette: COLOR_PALETTES,
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
