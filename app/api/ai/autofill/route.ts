import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { heuristicSuggestion, smartDefaults } from '@/lib/automation'

const schemas: Record<string, string[]> = {
  jobs: ['title','description','requirements','location','employment_type','work_model','salary_range','status'],
  employees: ['name','job_title','email','phone','hire_date','status'],
  trainings: ['name','category','mandatory','validity_days','description'],
  onboarding_templates: ['name','description'],
  candidates: ['name','email','phone','ai_summary'],
  review_cycles: ['name','start_date','end_date','status'],
}

export async function POST(request: NextRequest) {
  const { resource, prompt } = await request.json().catch(() => ({}))
  if (!schemas[resource] || !String(prompt || '').trim()) return NextResponse.json({ error: 'Informe uma descrição para a automação.' }, { status: 400 })
  const fallback = heuristicSuggestion(resource, String(prompt))
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ values: fallback, source: 'smart-defaults' })
  try {
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-3.1-flash-lite' })
    const instruction = `Você é um copiloto de RH no Brasil. Transforme a descrição em dados estruturados para o recurso ${resource}. Retorne APENAS JSON válido, sem markdown. Campos permitidos: ${schemas[resource].join(', ')}. Não invente e-mail ou telefone se não estiverem no texto. Datas em YYYY-MM-DD. Status e enums em inglês. Descrição do usuário: ${String(prompt).slice(0, 6000)}`
    const result = await model.generateContent(instruction)
    const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim())
    const allowed = Object.fromEntries(Object.entries(parsed).filter(([key]) => schemas[resource].includes(key)))
    return NextResponse.json({ values: { ...smartDefaults(resource), ...allowed }, source: 'gemini' })
  } catch {
    return NextResponse.json({ values: fallback, source: 'smart-defaults', warning: 'A IA não respondeu; aplicamos sugestões automáticas locais.' })
  }
}
