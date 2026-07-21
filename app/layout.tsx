import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { headers } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { getBranding } from '@/lib/queries/branding'
import './globals.css'

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })

export async function generateMetadata(): Promise<Metadata> {
  const { systemName } = await getBranding()
  return {
    title: systemName,
    description: 'Learn Filipino Sign Language — interactive lessons and activities.',
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: systemName,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0BC2D7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { primaryColor, secondaryColor } = await getBranding()
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en" className={`${nunito.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Runs before hydration so saved font-size and theme preferences
            apply immediately instead of flashing at the defaults first.
            nonce lets this pass the CSP script-src set in middleware.ts
            without needing 'unsafe-inline'. suppressHydrationWarning is
            required here: browsers deliberately scrub the `nonce` DOM
            property back to "" after parsing (to stop it being read/
            exfiltrated via JS), so React always sees server "<value>" vs
            client "" on this one attribute — harmless, since the browser
            already applied the real nonce from the HTML before that
            happens, so the script still passes CSP and runs normally. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{var f=localStorage.getItem('fontSize');if(f)document.documentElement.setAttribute('data-font-size',f);var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
        {(primaryColor || secondaryColor) && (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{${primaryColor ? `--brand-primary:${primaryColor};` : ''}${secondaryColor ? `--brand-secondary:${secondaryColor};` : ''}}`,
            }}
          />
        )}
      </head>
      <body className="min-h-full bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
