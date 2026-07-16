import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, sessionToken } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase'
import { DEFAULT_APP_PASSWORD, DEFAULT_LOGIN_EMAIL, passwordDigest, PROFILE_ID } from '@/lib/profile'

export async function POST(request: NextRequest) {
  const { credential = '' } = await request.json().catch(() => ({ credential: '' }))
  const normalized = String(credential).trim()
  let loginEmail = process.env.APP_LOGIN_EMAIL || DEFAULT_LOGIN_EMAIL
  let storedPasswordHash = ''

  try {
    const { data } = await getAdminClient().from('app_profile').select('login_email,password_hash').eq('id', PROFILE_ID).maybeSingle()
    if (data?.login_email) loginEmail = data.login_email
    if (data?.password_hash) storedPasswordHash = data.password_hash
  } catch {
    // Version 1 databases continue to authenticate through environment defaults.
  }

  const configuredPassword = process.env.APP_PASSWORD || DEFAULT_APP_PASSWORD
  const suppliedHash = await passwordDigest(normalized)
  const validEmail = normalized.toLowerCase() === loginEmail.trim().toLowerCase()
  const validPassword = storedPasswordHash ? suppliedHash === storedPasswordHash : normalized === configuredPassword
  if (!normalized || (!validEmail && !validPassword)) return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 })

  const response = NextResponse.json({ ok: true, method: validEmail ? 'email' : 'password' })
  response.cookies.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12,
    path: '/',
  })
  return response
}
