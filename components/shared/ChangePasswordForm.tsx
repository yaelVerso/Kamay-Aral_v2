'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { PASSWORD_MIN_LENGTH, PASSWORD_HINT, PASSWORD_PLACEHOLDER, isPasswordValid } from '@/lib/passwordPolicy'

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated')
      setPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={PASSWORD_PLACEHOLDER}
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
        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
        <Input
          id="confirm-new-password"
          type={showPass ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          required
          minLength={PASSWORD_MIN_LENGTH}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Updating…' : 'Update Password'}
      </Button>
    </form>
  )
}
