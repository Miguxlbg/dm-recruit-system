import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export async function GET() {
  const db = getAdminClient(); const today = new Date().toISOString(); const month = today.slice(5,7)
  const [employees,jobs,onboardings,trainings,interviews,departments,applications] = await Promise.all([
    db.from('employees').select('id,name,birth_date,hire_date,department_id,status').eq('status','active'),
    db.from('jobs').select('id,title,status').eq('status','open'),
    db.from('onboardings').select('id,status').eq('status','active'),
    db.from('training_enrollments').select('id,status,due_date').or(`status.eq.expired,and(due_date.lt.${today.slice(0,10)},status.neq.completed)`),
    db.from('interviews').select('*,applications(candidate_id,job_id)').gte('scheduled_at',today).order('scheduled_at').limit(6),
    db.from('departments').select('id,name'), db.from('applications').select('id,stage')])
  const firstError = [employees,jobs,onboardings,trainings,interviews,departments,applications].find(r=>r.error)?.error
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 })
  const deptCounts = (departments.data||[]).map(d=>({ name:d.name, value:(employees.data||[]).filter(e=>e.department_id===d.id).length })).filter(d=>d.value)
  const stages = ['screening','interview','offer','hired','rejected'].map(stage=>({ name:stage, value:(applications.data||[]).filter(a=>a.stage===stage).length }))
  return NextResponse.json({ counts:{ employees:employees.data?.length||0,jobs:jobs.data?.length||0,onboardings:onboardings.data?.length||0,trainings:trainings.data?.length||0,birthdays:(employees.data||[]).filter(employee=>employee.birth_date?.slice(5,7)===month).length,interviews:interviews.data?.length||0 }, departmentData:deptCounts, stageData:stages, interviews:interviews.data||[], month })
}
