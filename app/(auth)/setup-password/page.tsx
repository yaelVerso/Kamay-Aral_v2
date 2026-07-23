'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { PASSWORD_MIN_LENGTH, PASSWORD_HINT, isPasswordValid } from '@/lib/passwordPolicy'

function destinationFor(role: string | undefined) {
  if (role === 'admin') return '/admin/overview'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/dashboard'
}

export default function SetupPasswordPage() {
  const router = useRouter()
  const clientRef = useRef<SupabaseClient<Database> | null>(null)
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function processLink() {
      // detectSessionInUrl off — must act on this link's token, not an already-active session
      const supabase = createClient({ detectSessionInUrl: false })
      clientRef.current = supabase

      await supabase.auth.signOut()

      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        setValid(!error)
        setChecking(false)
        return
      }

      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        setValid(!error)
        setChecking(false)
        return
      }

      setValid(false)
      setChecking(false)
    }
    processLink()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isPasswordValid(password)) {
      toast.error(PASSWORD_HINT)
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    const supabase = clientRef.current
    if (!supabase) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()
      toast.success('Password set successfully')
      router.push(destinationFor(user?.user_metadata?.role))
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
          Checking link…
        </CardContent>
      </Card>
    )
  }

  if (!valid) {
    return (
      <Card className="w-full max-w-sm shadow-lg text-center">
        <CardContent className="pt-8 pb-8">
          <h2 className="text-xl font-bold mb-2">Invalid or expired link</h2>
          <p className="text-sm text-muted-foreground">
            This link is invalid or has expired. Ask your admin or teacher to send a new invite.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mb-2 text-4xl">🤟</div>
        <CardTitle className="text-xl font-bold">Set your password</CardTitle>
        <CardDescription>Choose a password to finish setting up your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={PASSWORD_HINT}
                required
                minLength={PASSWORD_MIN_LENGTH}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? 'Setting password…' : 'Set password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
