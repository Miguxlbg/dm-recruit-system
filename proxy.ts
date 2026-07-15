import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, sessionToken } from './lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/login' || pathname === '/api/auth/login' || pathname.startsWith('/_next') || pathname === '/favicon.ico') return NextResponse.next()
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token === await sessionToken()) return NextResponse.next()
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const login = new URL('/login', request.url)
  login.searchParams.set('next', pathname)
  return NextResponse.redirect(login)
}

export const config = { matcher: ['/((?!.*\\..*).*)'] }
