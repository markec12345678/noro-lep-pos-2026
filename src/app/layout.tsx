import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Noro Lep POS — Najlepša slovenska restavracijska blagajna 2026",
    template: "%s | Noro Lep POS",
  },
  description: "Noro Lep POS je najlepša slovenska POS blagajna z avtomatskim FURS, AI predikcijo prometa in kuhinjskim zaslonom. TEXT za natakarje, SLIKE za goste.",
  keywords: ["POS", "blagajna", "FURS", "restavracija", "kuhinjski zaslon", "AI", "rezervacije", "zaloge", "Slovenija", "restaurant", "point of sale"],
  authors: [{ name: "Noro Lep POS" }],
  creator: "Noro Lep POS Team",
  publisher: "Noro Lep POS",
  metadataBase: new URL("https://chat.z.ai"),
  alternates: {
    canonical: "/",
    languages: {
      "sl-SI": "/",
      "en-US": "/en",
      "de-DE": "/de",
      "it-IT": "/it",
    },
  },
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
    apple: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Noro Lep POS",
  },
  openGraph: {
    title: "Noro Lep POS — Najlepša slovenska restavracijska blagajna",
    description: "AI-poganjana POS blagajna z avtomatskim FURS in kuhinjskim zaslonom. 542 restavracij že zaupa nam.",
    url: "https://chat.z.ai",
    siteName: "Noro Lep POS",
    type: "website",
    locale: "sl_SI",
    alternateLocale: ["en_US", "de_DE", "it_IT"],
    images: [
      {
        url: "/og/og-image.png",
        width: 1344,
        height: 768,
        alt: "Noro Lep POS — Najlepša slovenska restavracijska blagajna 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noro Lep POS — Najlepša slovenska blagajna",
    description: "AI-poganjana POS blagajna z avtomatskim FURS in kuhinjskim zaslonom.",
    creator: "@noroleppos",
    images: ["/og/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://chat.z.ai/#organization",
      name: "Noro Lep POS",
      url: "https://chat.z.ai",
      logo: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
      description: "Najlepša slovenska restavracijska blagajna z avtomatskim FURS in AI predikcijo prometa.",
      foundingDate: "2026",
      founders: [{ "@type": "Person", name: "Noro Lep POS Team" }],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "info@norolep-pos.si",
        availableLanguage: ["Slovenian", "English", "German", "Italian"],
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "SI",
        addressRegion: "Ljubljana",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://chat.z.ai/#software",
      name: "Noro Lep POS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Android, iOS, Windows, macOS",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "EUR",
          description: "Za majhne bife in kioske",
        },
        {
          "@type": "Offer",
          name: "Professional",
          price: "49",
          priceCurrency: "EUR",
          description: "Za restavracije in lokale",
        },
        {
          "@type": "Offer",
          name: "Enterprise",
          price: "Po meri",
          priceCurrency: "EUR",
          description: "Za verige in franšize",
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "542",
        bestRating: "5",
        worstRating: "1",
      },
      featureList: [
        "FURS ZOI/EOR avtomatsko",
        "AI predikcija prometa",
        "Kuhinjski zaslon (KDS)",
        "QR naročanje za goste",
        "Offline način",
        "Vernostni program",
        "Real-time sync (POS→KDS→Analitika)",
        "ROI kalkulator",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://chat.z.ai/#website",
      url: "https://chat.z.ai",
      name: "Noro Lep POS",
      publisher: { "@id": "https://chat.z.ai/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://chat.z.ai/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Kako hitro lahko začnem uporabljati Noro Lep POS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Registracija traja 2 minuti. Po namestitvi vneseš meni, aktiviraš FURS podatke in si pripravljen za prvi račun v 15 minutah.",
          },
        },
        {
          "@type": "Question",
          name: "Ali sistem deluje brez internetne povezave?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Da. Vsi naročila in računi se shranjujejo lokalno in se samodejno sinhronizirajo s FURS takoj, ko je povezava spet na voljo.",
          },
        },
        {
          "@type": "Question",
          name: "Kakšna je FURS skladnost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Noro Lep je polno skladen z ZDavPR. Avtomatsko generira ZOI in pridobiva EOR od FURS v realnem času. QR koda na računu je vključena.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl-SI" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
