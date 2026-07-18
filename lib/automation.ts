export type AutomationSuggestion = Record<string, string | number | boolean>

const today = () => new Date().toISOString().slice(0, 10)
const inDays = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function smartDefaults(resource: string): AutomationSuggestion {
  const defaults: Record<string, AutomationSuggestion> = {
    employees: { status: 'active', hire_date: today() },
    onboardings: { status: 'active', start_date: today() },
    onboarding_template_tasks: { phase: 'week1', position: 1 },
    onboarding_tasks: { phase: 'week1', due_date: inDays(7), completed: false },
    review_cycles: { start_date: today(), end_date: inDays(30), status: 'draft' },
    review_questions: { question_type: 'scale', position: 1 },
    reviews: { review_type: 'manager', status: 'pending' },
    shifts: { start_time: '09:00', end_time: '18:00', color: '#695cff' },
    shift_assignments: { shift_date: today() },
    leave_requests: { leave_type: 'vacation', start_date: inDays(15), end_date: inDays(29), status: 'pending' },
    jobs: { status: 'open', employment_type: 'full_time', work_model: 'hybrid' },
    applications: { stage: 'screening' },
    interviews: { status: 'scheduled', scheduled_at: `${inDays(1)}T10:00` },
    trainings: { mandatory: false, validity_days: 365 },
    training_enrollments: { assigned_at: today(), due_date: inDays(30), status: 'pending' },
  }
  return defaults[resource] || {}
}

export const automationPrompts: Record<string, string> = {
  jobs: 'Descreva o cargo, senioridade, cidade e principais responsabilidades. A IA cria a vaga completa.',
  employees: 'Cole uma assinatura de e-mail, mini currículo ou descreva a pessoa para preencher o cadastro.',
  trainings: 'Informe o tema e público-alvo. A IA estrutura o treinamento e sugere validade.',
  onboarding_templates: 'Descreva o tipo de contratação. A IA cria um template de jornada.',
  candidates: 'Cole um resumo do currículo para extrair nome, contato e resumo profissional.',
  review_cycles: 'Informe o objetivo do ciclo e o período desejado.',
}

export function heuristicSuggestion(resource: string, prompt: string): AutomationSuggestion {
  const clean = prompt.trim()
  if (resource === 'jobs') return { ...smartDefaults(resource), title: clean.split(/[,.\n]/)[0].slice(0, 90), description: clean, requirements: 'Experiência compatível com a função; boa comunicação; organização e colaboração.' }
  if (resource === 'trainings') return { ...smartDefaults(resource), name: clean.split(/[,.\n]/)[0].slice(0, 90), category: 'Desenvolvimento', description: clean }
  if (resource === 'onboarding_templates') return { name: `Onboarding · ${clean.split(/[,.\n]/)[0].slice(0, 60)}`, description: clean }
  if (resource === 'review_cycles') return { ...smartDefaults(resource), name: clean.split(/[,.\n]/)[0].slice(0, 80) || 'Novo ciclo de performance' }
  return smartDefaults(resource)
}
