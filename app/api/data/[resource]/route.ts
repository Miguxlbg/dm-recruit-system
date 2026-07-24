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
function addDays(value: string, days: number) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const phaseOffset: Record<string, number> = { preboarding: -2, week1: 7, day30: 30, day60: 60, day90: 90 }
const defaultOnboardingTasks = [
  { title: 'Enviar documentos e dados de admissão', phase: 'preboarding', position: 1 },
  { title: 'Preparar acessos, equipamentos e boas-vindas', phase: 'preboarding', position: 2 },
  { title: 'Apresentar time, cultura e objetivos da função', phase: 'week1', position: 3 },
  { title: 'Realizar checkpoint de adaptação', phase: 'day30', position: 4 },
  { title: 'Revisar evolução e plano de desenvolvimento', phase: 'day60', position: 5 },
  { title: 'Concluir jornada e registrar feedback de 90 dias', phase: 'day90', position: 6 },
]

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
  if (resource === 'interviews' && !payload.meeting_link) payload.meeting_link = 'https://meet.google.com/new'
  if (resource === 'training_enrollments') {
    const assigned = String(payload.assigned_at || new Date().toISOString().slice(0, 10))
    payload.assigned_at = assigned
    if (!payload.due_date) payload.due_date = addDays(assigned, 30)
    if (payload.completed_at && payload.training_id && !payload.expires_at) {
      const { data: training } = await db.from('trainings').select('validity_days').eq('id', payload.training_id).maybeSingle()
      if (training?.validity_days) payload.expires_at = addDays(String(payload.completed_at), training.validity_days)
    }
  }
  const { data, error } = await db.from(resource).insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (resource === 'onboarding_templates') {
    await db.from('onboarding_template_tasks').insert(defaultOnboardingTasks.map(task => ({ ...task, template_id: data.id })))
  }
  if (resource === 'onboardings') {
    const source = data?.template_id
      ? await db.from('onboarding_template_tasks').select('title,phase').eq('template_id', data.template_id).order('position')
      : { data: defaultOnboardingTasks }
    if (source.data?.length) await db.from('onboarding_tasks').insert(source.data.map(task => ({ ...task, onboarding_id: data.id, due_date: addDays(data.start_date, phaseOffset[task.phase] ?? 7) })))
  }
  if (resource === 'trainings' && data?.mandatory) {
    const { data: employees } = await db.from('employees').select('id').eq('status', 'active')
    const assigned = new Date().toISOString().slice(0, 10)
    if (employees?.length) await db.from('training_enrollments').upsert(employees.map(employee => ({ training_id: data.id, employee_id: employee.id, assigned_at: assigned, due_date: addDays(assigned, 30), status: 'pending' })), { onConflict: 'training_id,employee_id', ignoreDuplicates: true })
  }
  return NextResponse.json(data, { status: 201 })
}
export async function PATCH(request: NextRequest, { params }: Context) {
  const resource = (await params).resource
  if (!isResource(resource)) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 })
  const body = await request.json(); const { id } = body
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  const db = getAdminClient()
  const payload = clean(resource, body)
  if (resource === 'training_enrollments' && payload.completed_at && body.training_id && !payload.expires_at) {
    const { data: training } = await db.from('trainings').select('validity_days').eq('id', body.training_id).maybeSingle()
    if (training?.validity_days) payload.expires_at = addDays(String(payload.completed_at), training.validity_days)
    payload.status = 'completed'
  }
  if (resource === 'onboarding_tasks' && payload.completed === true && !payload.completed_at) payload.completed_at = new Date().toISOString()
  const { data, error } = await db.from(resource).update(payload).eq('id', id).select().single()
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
