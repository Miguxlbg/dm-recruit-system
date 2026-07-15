import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const storagePath = path.map(decodeURIComponent).join('/')
  if (!storagePath || storagePath.includes('..')) return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  const { data, error } = await getAdminClient().storage.from('hr-files').download(storagePath)
  if (error || !data) return NextResponse.json({ error: error?.message || 'File not found' }, { status: 404 })
  return new NextResponse(data, { headers: { 'Content-Type': data.type || 'application/octet-stream', 'Cache-Control': 'private, no-store, max-age=0', 'Content-Disposition': 'inline' } })
}
