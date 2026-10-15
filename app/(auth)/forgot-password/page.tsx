'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { requestPasswordResetAction } from '@/app/actions/auth'
import { MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await requestPasswordResetAction(email)
      setSent(true)
    } catch {
      // Always show the generic success state — avoid leaking account existence
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-sm shadow-lg text-center">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <MailCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a reset link.
            </p>
          </div>
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <Image src="/kamay-aral-logo.png" alt="Kamay Aral" width={56} height={56} className="mx-auto mb-2 h-14 w-14 object-contain" />
        <CardTitle className="text-xl font-bold">Forgot password</CardTitle>
        <CardDescription>
          Enter the email on file for the account (for students, this is the email your teacher/admin used when creating the account).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              inputMode="email"
            />
          </div>
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
