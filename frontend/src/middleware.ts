import createMiddleware from 'next-intl/middleware'
import { locales } from './i18n'

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Always use locale prefix in URLs
  localePrefix: 'always'
})

export const config = {
  // Match only internationalized pathnames
  // Exclude API routes, static files, Next.js internals, and admin panel
  matcher: ['/', '/(vi|en)/:path*', '/((?!api|admin|_next|_vercel|.*\\..*).*)']
}

