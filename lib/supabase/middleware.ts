import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined
const supabaseOrigin = supabaseHostname ? `https://${supabaseHostname}` : ''

// per-request nonce so script-src avoids 'unsafe-inline' — strict-dynamic lets
// Next's own nonce'd bootstrap scripts load further chunks/RSC scripts
function buildCsp(nonce: string): string {
  // unsafe-eval only in dev, for HMR/fast refresh — never shipped to prod
  const scriptSrc = process.env.NODE_ENV === 'development'
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`

  return [
    `default-src 'self'`,
    scriptSrc,
    // unsafe-inline for styles — inline style="" attrs are common here and can't execute code
    `style-src 'self' 'unsafe-inline'`,
    // blob: for the logo preview before upload, data: for inline images
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

  // forwarded to app/layout.tsx via next/headers to stamp our inline <script>
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

  // server action POSTs carry this header — never redirect them, they do their own auth checks
  if (request.headers.has('next-action')) {
    return withSecurityHeaders(supabaseResponse)
  }

  function destinationFor(role: string | undefined) {
    if (role === 'admin') return '/admin/overview'
    if (role === 'teacher') return '/teacher/dashboard'
    return '/dashboard'
  }

  // relies on the temporary invite/recovery session — stay accessible either way
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
