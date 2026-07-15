import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { isResource, resources } from '@/lib/resources'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ resource: string }> }
function clean(resource: keyof typeof resources, body: Record<string, unknown>) {
  const payload = Object.fromEntries(Object.entries(body).filter(([key, value]) => resources[resource].includes(key as never) && value !== ''))
  if (resource === 'reviews' && typeof payload.responses === 'string') {
    try { payload.responses = JSON.parse(payload.responses) } catch { payload.responses = { notes: payload.responses } }
  }
  return payload
}
function selectFor(resource: keyof typeof resources) {
  const joined: Partial<Record<keyof typeof resources, string>> = {
    applications: '*,candidates(name,email,resume_url),jobs(title)',
    interviews: '*,applications(id,candidates(name),jobs(title)),employees(name)',
    onboardings: '*,employees(name),onboarding_templates(name)',
    onboarding_tasks: '*,onboardings(id,employees(name))',
    shift_assignments: '*,employees(name),shifts(name,start_time,end_time,color)',
    leave_requests: '*,employees(name)',
    training_enrollments: '*,employees(name),trainings(name)'
  }
  return joined[resource] || '*'
}
export async function GET(request: NextRequest, { params }: Context) {
  const resource = (await params).resource
  if (!isResource(resource)) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  const url = new URL(request.url); const id = url.searchParams.get('id')
  let query = getAdminClient().from(resource).select(selectFor(resource)).order('created_at', { ascending: false })
  if (id) query = query.eq('id', id)
  const { data, error } = await query.limit(500)
  return error ? NextResponse.json({ error: error.message, hint: error.hint }, { status: 500 }) : NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
export async function POST(request: NextRequest, { params }: Context) {
  const resource = (await params).resource
  if (!isResource(resource)) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  const payload = clean(resource, await request.json())
  const db = getAdminClient()
  const { data, error } = await db.from(resource).insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (resource === 'onboardings' && data?.template_id) {
    const { data: templateTasks } = await db.from('onboarding_template_tasks').select('title,phase').eq('template_id', data.template_id).order('position')
    if (templateTasks?.length) await db.from('onboarding_tasks').insert(templateTasks.map(task => ({ ...task, onboarding_id: data.id })))
  }
  return NextResponse.json(data, { status: 201 })
}
export async function PATCH(request: NextRequest, { params }: Context) {
  const resource = (await params).resource
  if (!isResource(resource)) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  const body = await request.json(); const { id } = body
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  const { data, error } = await getAdminClient().from(resource).update(clean(resource, body)).eq('id', id).select().single()
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data)
}
export async function DELETE(request: NextRequest, { params }: Context) {
  const resource = (await params).resource
  if (!isResource(resource)) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  const { error } = await getAdminClient().from(resource).delete().eq('id', id)
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true })
}
