import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, sessionToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({ password: '' }))
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, await sessionToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 12, path: '/' })
  return response
}
