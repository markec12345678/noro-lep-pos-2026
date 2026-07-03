import type { MetadataRoute } from 'next'

/**
 * Dynamic Robots.txt (Next.js 16 App Router)
 *
 * Generira robots.txt dinamično. Dovoli vsem botom, blokiraj
 * API in interne poti, dovoli manifest in sitemap.
 */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://norolep-pos.si'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/', '/*.json$'],
      },
      // Specifični boti z eksplicitnim dovoljenjem
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
      {
        userAgent: 'LinkedInBot',
        allow: '/',
      },
      {
        userAgent: 'Slackbot',
        allow: '/',
      },
      {
        userAgent: 'Applebot',
        allow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
