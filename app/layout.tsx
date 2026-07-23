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
        {/* runs before hydration so saved font-size applies immediately, no flash */}
        {/* suppressHydrationWarning: browsers scrub the nonce attribute after parsing */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{var f=localStorage.getItem('fontSize');if(f)document.documentElement.setAttribute('data-font-size',f);}catch(e){}`,
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
