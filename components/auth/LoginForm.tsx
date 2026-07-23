'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'
import { resolveLoginEmail } from '@/app/actions/auth'

function destinationFor(role: string | undefined) {
  if (role === 'admin') return '/admin/overview'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/dashboard'
}

interface Props {
  systemName: string
  logoUrl: string | null
}

export default function LoginForm({ systemName, logoUrl }: Props) {
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
      const email = await resolveLoginEmail(identifier)

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('banned')) {
          throw new Error('This account has been deactivated. Contact your admin.')
        }
        throw new Error('Incorrect email/ID or password')
      }

      // awaited so the session cookie settles before navigating — recordAuditLog never throws
      await recordAuditLog({ action: 'auth.login', description: 'logged in' })

      // full navigation, not router.push, so the destination always fetches fresh
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
        {logoUrl ? (
          <Image src={logoUrl} alt={systemName} width={56} height={56} className="mx-auto mb-2 h-14 w-14 object-contain" />
        ) : (
          <div className="mb-2 text-4xl">🤟</div>
        )}
        <CardTitle className="text-3xl text-[#694B26] font-black">{systemName}</CardTitle>
        <CardDescription>Your Partner in Learning Filipino Sign Language</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email or ID Number</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="ID number or you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
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
            Accounts are created by admin.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
