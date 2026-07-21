import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined
const supabaseOrigin = supabaseHostname ? `https://${supabaseHostname}` : ''

/**
 * Builds a Content-Security-Policy with a fresh per-request nonce, so
 * script-src can require 'nonce-<value>' instead of 'unsafe-inline'.
 * 'strict-dynamic' is what makes this actually work with Next.js: it lets
 * the app's own nonce'd bootstrap scripts load further scripts (webpack/
 * turbopack chunks, the RSC streaming/hydration scripts Next injects per
 * page) without each of those needing their own nonce or a static hash —
 * this is Next.js's documented CSP pattern, not a workaround.
 */
function buildCsp(nonce: string): string {
  // Next's dev server (Turbopack/webpack HMR, React DevTools call-stack
  // reconstruction) uses eval() for fast refresh — 'unsafe-eval' is needed
  // in development only. React never uses eval() in production, and this
  // branch never runs in a deployed build, so it doesn't weaken prod CSP.
  const scriptSrc = process.env.NODE_ENV === 'development'
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`

  return [
    `default-src 'self'`,
    scriptSrc,
    // 'unsafe-inline' stays for styles — inline style="" attributes (progress
    // bars, dynamic branding colors) are pervasive in this app and, unlike
    // script injection, inline style injection can't execute arbitrary code.
    `style-src 'self' 'unsafe-inline'`,
    // blob: covers the logo preview in BrandingSettingsForm (URL.createObjectURL)
    // before it's uploaded; data: covers any inline SVG/data-URI images.
    `img-src 'self' data: blob: ${supabaseOrigin}`,
    `media-src 'self' ${supabaseOrigin}`,
    `connect-src 'self' ${supabaseOrigin}`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ')
}

export async function updateSession(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  // Forwarded to the app as a request header so Server Components (the root
  // layout) can read it back via next/headers and stamp the same nonce onto
  // the one inline <script> we author ourselves.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  function withSecurityHeaders(response: NextResponse) {
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Server Action invocations POST to the same URL as the calling page and
  // carry this header. Redirecting that request (e.g. the public-route
  // bounce below, once a session cookie has just been set mid-action) breaks
  // Next.js's expected action-response format and throws "An unexpected
  // response was received from the server" client-side. Actions do their
  // own auth checks internally, so middleware should never intercept them.
  if (request.headers.has('next-action')) {
    return withSecurityHeaders(supabaseResponse)
  }

  function destinationFor(role: string | undefined) {
    if (role === 'admin') return '/admin/overview'
    if (role === 'teacher') return '/teacher/dashboard'
    return '/dashboard'
  }

  // /setup-password relies on the temporary session created by an invite/recovery
  // link, so it must stay accessible whether or not `user` is set — never bounce.
  if (pathname === '/setup-password') {
    return withSecurityHeaders(supabaseResponse)
  }

  // Routes that don't require auth
  const publicRoutes = ['/login', '/forgot-password']
  if (publicRoutes.includes(pathname)) {
    if (user) {
      return withSecurityHeaders(NextResponse.redirect(new URL(destinationFor(user.user_metadata?.role), request.url)))
    }
    return withSecurityHeaders(supabaseResponse)
  }

  // Unauthenticated → login
  if (!user) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
  }

  // Root path always sends signed-in users to their role's landing page
  if (pathname === '/') {
    return withSecurityHeaders(NextResponse.redirect(new URL(destinationFor(user.user_metadata?.role), request.url)))
  }

  // Only teachers can access /teacher routes
  if (pathname.startsWith('/teacher')) {
    if (user.user_metadata?.role !== 'teacher') {
      return withSecurityHeaders(NextResponse.redirect(new URL(destinationFor(user.user_metadata?.role), request.url)))
    }
  }

  // Only admin can access /admin routes
  if (pathname.startsWith('/admin')) {
    if (user.user_metadata?.role !== 'admin') {
      return withSecurityHeaders(NextResponse.redirect(new URL(destinationFor(user.user_metadata?.role), request.url)))
    }
  }

  return withSecurityHeaders(supabaseResponse)
}
