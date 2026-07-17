'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'

function destinationFor(role: string | undefined) {
  if (role === 'admin') return '/admin/overview'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/dashboard'
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient({ persist: rememberMe })
      const email = identifier.trim()

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('banned')) {
          throw new Error('This account has been deactivated. Contact your admin.')
        }
        throw new Error('Incorrect email or password')
      }

      // Awaited on purpose: firing this concurrently with the redirect races
      // the login's session-cookie write against this Server Action's own
      // request, which can hit middleware before the new session cookie is
      // in place and throw "refresh token not found". Awaiting first
      // guarantees the cookie is settled before this (or the navigation)
      // fires. recordAuditLog never throws, so this can't block on error.
      await recordAuditLog({ action: 'auth.login', description: 'logged in' })

      // Full page navigation, not router.push — a soft client-side
      // navigation here was intermittently rendering with a stale
      // pre-login router cache, requiring a manual refresh to show the
      // destination dashboard. A real navigation always fetches fresh.
      window.location.href = destinationFor(data.user.user_metadata?.role)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 text-center pb-4">
        <div className="mb-2 text-4xl">🤟</div>
        <CardTitle className="text-3xl text-[#694B26] font-black">Kamay Aral</CardTitle>
        <CardDescription>Your Partner in Learning Filipino Sign Language</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email</Label>
            <Input
              id="identifier"
              type="email"
              placeholder="you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="email"
              className='bg-w'
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="font-medium text-[#FFA93C] hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full p-5 bg-[#0BC2D7] hover:bg-[#00ADC0] shadow-[0_3px_0_#149AA9] font-bold text-base"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Accounts are created by your teacher or admin.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
