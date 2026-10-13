import { NextResponse } from 'next/server'
import { checkLoginLockout } from '@/app/actions/auth'
import { rateLimit, clientIp } from '@/lib/rateLimit'

export async function POST(request: Request) {
  const { allowed } = rateLimit(`check-login-lockout:${clientIp(request)}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ locked: false }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const identifier = typeof body?.identifier === 'string' ? body.identifier : ''
  if (!identifier.trim()) {
    return NextResponse.json({ locked: false }, { status: 200 })
  }

  const result = await checkLoginLockout(identifier)
  return NextResponse.json(result, { status: 200 })
}
