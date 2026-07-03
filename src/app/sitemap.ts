import type { MetadataRoute } from 'next'

/**
 * Dynamic Sitemap (Next.js 16 App Router)
 *
 * Generira sitemap.xml dinamično. Za single-page landing app
 * uporablja root URL z hreflang alternates.
 *
 * Google ne indeksira #anchor URL-jev kot separate pages,
 * zato vključujemo samo root + jezikovne različice.
 */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://norolep-pos.si'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Root URL — glavna landing stran
  const rootEntry: MetadataRoute.Sitemap[number] = {
    url: BASE_URL,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1.0,
    alternates: {
      languages: {
        'sl-SI': BASE_URL,
        'en-US': `${BASE_URL}/en`,
        'de-DE': `${BASE_URL}/de`,
        'it-IT': `${BASE_URL}/it`,
      },
    },
  }

  // API health check endpoint (ni za indeksiranje, a za crawl reference)
  const apiEntry: MetadataRoute.Sitemap[number] = {
    url: `${BASE_URL}/api/dashboard/overview`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.3,
  }

  return [rootEntry, apiEntry]
}
