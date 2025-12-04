import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://wealthpath.duckdns.org'

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'vi']
  
  // Public routes (accessible without authentication)
  const publicRoutes = [
    '', // Landing page
    '/login',
    '/register',
  ]
  
  // Generate sitemap entries for public routes
  const publicEntries = locales.flatMap(locale =>
    publicRoutes.map(route => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1.0 : 0.8,
    }))
  )

  // App routes (for SEO discovery, though they require auth)
  // These help search engines understand the app structure
  const appRoutes = [
    '/dashboard',
    '/transactions',
    '/budgets',
    '/savings',
    '/recurring',
    '/debts',
    '/calculator',
  ]

  const appEntries = locales.flatMap(locale =>
    appRoutes.map(route => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '/dashboard' ? 0.9 : 0.7,
    }))
  )

  return [...publicEntries, ...appEntries]
}


