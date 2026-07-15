import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  const form = await request.formData(); const file = form.get('file') as File | null; const folder = String(form.get('folder') || 'misc')
  if (!file || file.size > 10 * 1024 * 1024) return NextResponse.json({ error:'A valid file up to 10MB is required' },{status:400})
  const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
  const db = getAdminClient(); const { error } = await db.storage.from('hr-files').upload(path, file, { contentType:file.type, upsert:false })
  if(error) return NextResponse.json({error:error.message},{status:400})
  const protectedUrl = `/api/files/${path.split('/').map(encodeURIComponent).join('/')}`
  return NextResponse.json({ path, url: protectedUrl }, { headers: { 'Cache-Control': 'no-store' } })
}
