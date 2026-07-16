import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { buildSignature, defaultProfile, passwordDigest, PROFILE_ID, type Profile } from '@/lib/profile'

export const dynamic = 'force-dynamic'

const profileFields = [
  'display_name', 'job_title', 'bio', 'professional_email', 'phone', 'linkedin_url',
  'instagram_url', 'website_url', 'avatar_url', 'logo_url', 'accent_color', 'theme',
  'timezone', 'language', 'login_email',
] as const

export async function GET() {
  try {
    const { data, error } = await getAdminClient().from('app_profile').select('*').eq('id', PROFILE_ID).maybeSingle()
    if (error) throw error
    const profile = { ...defaultProfile, ...(data || {}) } as Profile
    return NextResponse.json({ profile, signature: buildSignature(profile), persisted: Boolean(data) })
  } catch {
    return NextResponse.json({ profile: defaultProfile, signature: buildSignature(defaultProfile), persisted: false })
  }
}

export async function PATCH(request: NextRequest) {
  const input = await request.json().catch(() => ({})) as Record<string, unknown>
  const payload = Object.fromEntries(profileFields.flatMap(field => typeof input[field] === 'string' ? [[field, String(input[field]).trim()]] : []))
  if (payload.login_email && !/^\S+@\S+\.\S+$/.test(payload.login_email)) return NextResponse.json({ error: 'Informe um e-mail de acesso válido.' }, { status: 400 })
  if (payload.accent_color && !/^#[0-9a-f]{6}$/i.test(payload.accent_color)) return NextResponse.json({ error: 'Cor de destaque inválida.' }, { status: 400 })
  if (input.new_password) {
    if (String(input.new_password).length < 6) return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    payload.password_hash = await passwordDigest(String(input.new_password))
  }
  try {
    const { data, error } = await getAdminClient().from('app_profile').upsert({ id: PROFILE_ID, ...payload }, { onConflict: 'id' }).select().single()
    if (error) throw error
    const profile = { ...defaultProfile, ...data } as Profile
    return NextResponse.json({ profile, signature: buildSignature(profile), persisted: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar perfil.'
    return NextResponse.json({ error: `Perfil v2 ainda não foi preparado no Supabase. Execute supabase/schema.sql. ${message}` }, { status: 503 })
  }
}
