import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'

const orderedResources = ['applications','onboardings','training_enrollments','candidates','jobs','employees','onboarding_templates','trainings','departments'] as const

type TutorialRecord = { resource: typeof orderedResources[number], id: string }

export async function POST(request: NextRequest) {
  const { action, records = [] } = await request.json().catch(() => ({})) as { action?: string, records?: TutorialRecord[] }
  const db = getAdminClient()
  if (action === 'cleanup') {
    for (const resource of orderedResources) {
      const ids = records.filter(item => item.resource === resource && /^[0-9a-f-]{36}$/i.test(item.id)).map(item => item.id)
      if (ids.length) await db.from(resource).delete().in('id', ids)
    }
    return NextResponse.json({ ok: true, removed: records.length })
  }
  if (action !== 'seed') return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })

  const tag = crypto.randomUUID().slice(0, 6)
  const created: TutorialRecord[] = []
  try {
    const insert = async (resource: TutorialRecord['resource'], payload: Record<string, unknown>) => {
      const { data, error } = await db.from(resource).insert(payload).select().single()
      if (error) throw error
      created.push({ resource, id: data.id })
      return data
    }
    const department = await insert('departments', { name: `[Tutorial ${tag}] Produto & Pessoas`, description: 'Registro temporário criado pelo tour guiado.' })
    const employee = await insert('employees', { name: `[Tutorial ${tag}] Marina Alves`, job_title: 'People Partner', department_id: department.id, email: `tutorial.${tag}@dm.local`, hire_date: new Date().toISOString().slice(0,10), status: 'active' })
    const job = await insert('jobs', { title: `[Tutorial ${tag}] Analista de Produto`, description: 'Vaga temporária para demonstrar automações, pipeline e publicação multicanal.', department_id: department.id, status: 'open' })
    const candidate = await insert('candidates', { name: `[Tutorial ${tag}] Carlos Demo`, email: `candidato.${tag}@dm.local`, phone: '(11) 90000-0000', ai_summary: 'Perfil temporário criado exclusivamente para o tutorial guiado.' })
    await insert('applications', { candidate_id: candidate.id, job_id: job.id, stage: 'screening', match_score: 87, match_reason: 'Compatibilidade demonstrativa criada pelo tutorial.' })
    const template = await insert('onboarding_templates', { name: `[Tutorial ${tag}] Jornada 30 dias`, description: 'Template temporário demonstrativo.' })
    await insert('onboardings', { employee_id: employee.id, template_id: template.id, start_date: new Date().toISOString().slice(0,10), status: 'active' })
    const training = await insert('trainings', { name: `[Tutorial ${tag}] Cultura e Segurança`, category: 'Integração', mandatory: true, validity_days: 365, description: 'Treinamento temporário do tour.' })
    await insert('training_enrollments', { training_id: training.id, employee_id: employee.id, assigned_at: new Date().toISOString().slice(0,10), status: 'in_progress' })
    return NextResponse.json({ ok: true, records: created, tag })
  } catch (error) {
    for (const resource of orderedResources) {
      const ids = created.filter(item => item.resource === resource).map(item => item.id)
      if (ids.length) await db.from(resource).delete().in('id', ids)
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível preparar o tutorial.' }, { status: 500 })
  }
}
