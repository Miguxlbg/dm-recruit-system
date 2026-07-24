import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'

const portals = [
  { id: 'google_jobs', name: 'Google for Jobs', type: 'Agregador', color: '#4285f4', url: 'https://jobs.google.com/' },
  { id: 'linkedin', name: 'LinkedIn', type: 'Rede profissional', color: '#0a66c2', url: 'https://www.linkedin.com/talent/post-a-job' },
  { id: 'indeed', name: 'Indeed', type: 'Portal premium', color: '#2557a7', url: 'https://employers.indeed.com/' },
  { id: 'glassdoor', name: 'Glassdoor', type: 'Marca empregadora', color: '#0caa41', url: 'https://www.glassdoor.com/employers/' },
  { id: 'facebook', name: 'Facebook', type: 'Rede social', color: '#1877f2', url: 'https://www.facebook.com/business/' },
]

export async function GET(request: NextRequest) {
  const jobId = new URL(request.url).searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'Selecione uma vaga.' }, { status: 400 })
  const db = getAdminClient()
  const [{ data: job, error }, { data: saved }] = await Promise.all([
    db.from('jobs').select('*').eq('id', jobId).single(),
    db.from('job_publications').select('*').eq('job_id', jobId),
  ])
  if (error || !job) return NextResponse.json({ error: error?.message || 'Vaga não encontrada.' }, { status: 404 })
  const missing = [!job.title && 'Título', !job.description && 'Descrição', !job.department_id && 'Departamento'].filter(Boolean)
  return NextResponse.json({ job, portals: portals.map(portal => ({ ...portal, publication: saved?.find(item => item.portal === portal.id) || null, missing })) })
}

export async function POST(request: NextRequest) {
  const { jobId, portal, action } = await request.json().catch(() => ({}))
  const provider = portals.find(item => item.id === portal)
  if (!jobId || !provider || !['publish','pause'].includes(action)) return NextResponse.json({ error: 'Solicitação inválida.' }, { status: 400 })
  const db = getAdminClient()
  const { data: job, error } = await db.from('jobs').select('*').eq('id', jobId).single()
  if (error || !job) return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 })
  const missing = [!job.title && 'título', !job.description && 'descrição', !job.department_id && 'departamento'].filter(Boolean)
  if (action === 'publish' && missing.length) return NextResponse.json({ error: `Complete antes: ${missing.join(', ')}.` }, { status: 422 })
  const status = action === 'publish' ? 'ready' : 'paused'
  const { data, error: saveError } = await db.from('job_publications').upsert({ job_id: jobId, portal, status, external_url: provider.url, published_at: action === 'publish' ? new Date().toISOString() : null }, { onConflict: 'job_id,portal' }).select().single()
  if (saveError) {
    const migrationPending = saveError.message.includes('job_publications') || saveError.code === 'PGRST205'
    if (!migrationPending) return NextResponse.json({ error: saveError.message }, { status: 503 })
    return NextResponse.json({
      publication: { job_id: jobId, portal, status, external_url: provider.url, published_at: action === 'publish' ? new Date().toISOString() : null },
      external_url: provider.url,
      requires_oauth: action === 'publish',
      persistence: 'session',
      warning: 'A migration v2.1 ainda não foi aplicada. O status funciona nesta sessão e será persistido após executar a migration.',
      message: action === 'publish' ? 'Vaga validada e preparada. Conecte a conta oficial para concluir.' : 'Publicação pausada nesta sessão.',
    })
  }
  return NextResponse.json({ publication: data, external_url: provider.url, requires_oauth: action === 'publish', persistence: 'supabase', message: action === 'publish' ? 'Vaga validada e preparada. Conecte a conta do portal para concluir a publicação externa.' : 'Publicação pausada.' })
}
