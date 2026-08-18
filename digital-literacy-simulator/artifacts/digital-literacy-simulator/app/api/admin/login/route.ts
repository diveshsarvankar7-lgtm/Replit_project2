import { NextResponse } from 'next/server'
import { COOKIE_NAME, MAX_AGE_SECONDS, createAdminSession } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const configuredPassword = process.env.ADMIN_PASSWORD
  if (!configuredPassword) {
    return NextResponse.json({ error: 'Admin password is not configured.' }, { status: 500 })
  }

  const body = await request.json().catch(() => null) as { password?: unknown } | null
  if (typeof body?.password !== 'string' || body.password !== configuredPassword) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  const response = NextResponse.json({ authenticated: true })
  response.cookies.set(COOKIE_NAME, await createAdminSession(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  })
  return response
}