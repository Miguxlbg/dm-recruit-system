'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, Check, ChevronRight, Loader2, Play, RotateCcw, Sparkles, Trash2, X } from 'lucide-react'

type TutorialRecord = { resource: string, id: string }
type Step = { route: string, selector: string, title: string, description: string, tip: string }
const steps: Step[] = [
  { route: '/', selector: '[data-tour="dashboard-welcome"]', title: 'Seu centro de comando', description: 'O dashboard reúne indicadores reais e destaca o que precisa de atenção agora.', tip: 'Os gráficos se atualizam automaticamente com os registros do Supabase.' },
  { route: '/', selector: '[data-tour="global-search"]', title: 'Busca instantânea', description: 'Encontre pessoas, vagas e registros sem navegar por várias telas.', tip: 'Use a busca no topo em qualquer módulo.' },
  { route: '/employees', selector: '[data-tour="entity-manager"]', title: 'Gestão de pessoas sem planilhas', description: 'Cadastros, estrutura e ações rápidas ficam concentrados em uma única visão.', tip: 'Clique no raio para avançar um status sem abrir formulários.' },
  { route: '/employees', selector: '[data-tour="new-record"]', title: 'Formulários inteligentes', description: 'O sistema preenche datas e status sozinho. Nos módulos compatíveis, o copiloto transforma uma descrição em formulário completo.', tip: 'Você revisa somente o essencial antes de salvar.' },
  { route: '/recruitment', selector: '[data-tour="recruitment-tabs"]', title: 'ATS profissional', description: 'Pipeline, vagas, candidatos, entrevistas e publicação trabalham como um fluxo único.', tip: 'O tutorial criou uma candidatura temporária para você visualizar.' },
  { route: '/recruitment', selector: '[data-tour="publication-hub"]', title: 'Publicação multicanal', description: 'Valide a vaga e prepare a publicação no Google Jobs, LinkedIn, Indeed, Glassdoor e Facebook.', tip: 'Portais externos exigem conectar a conta oficial antes do envio final.' },
  { route: '/profile', selector: '[data-tour="profile-studio"]', title: 'Seu perfil e sua marca', description: 'Foto, logo, assinatura, preferências e segurança ficam em um studio organizado por objetivos.', tip: 'As alterações de tema são visualizadas antes de salvar.' },
  { route: '/profile', selector: '[data-tour="tutorial-center"]', title: 'Tutorial sempre disponível', description: 'Você pode repetir esta experiência quando quiser. Os registros demonstrativos são removidos automaticamente no final.', tip: 'Nenhum dado real é alterado pelo tutorial.' },
]

export function GuidedTour({ lang }: { lang: 'pt'|'en' }) {
  const pt = lang === 'pt'
  const router = useRouter()
  const pathname = usePathname()
  const [launcher, setLauncher] = useState(false)
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<TutorialRecord[]>([])
  const [message, setMessage] = useState('')

  const locate = useCallback(() => {
    if (!active) return
    const element = document.querySelector(steps[step].selector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setRect(element.getBoundingClientRect()), 350)
    } else setRect(null)
  }, [active, step])

  useEffect(() => {
    const open = () => setLauncher(true)
    window.addEventListener('dm:start-tutorial', open)
    return () => window.removeEventListener('dm:start-tutorial', open)
  }, [])

  useEffect(() => {
    if (!active) return
    if (pathname !== steps[step].route) {
      router.push(steps[step].route)
      return
    }
    const timer = window.setInterval(locate, 250)
    locate()
    window.addEventListener('resize', locate)
    return () => { window.clearInterval(timer); window.removeEventListener('resize', locate) }
  }, [active, step, pathname, router, locate])

  async function start(withExamples: boolean) {
    setLoading(true)
    setMessage('')
    if (withExamples) {
      const response = await fetch('/api/tutorial', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'seed' }) })
      const body = await response.json()
      if (!response.ok) {
        setMessage(body.error || 'Não foi possível criar os exemplos.')
        setLoading(false)
        return
      }
      setRecords(body.records || [])
    }
    setLauncher(false)
    setStep(0)
    setActive(true)
    setLoading(false)
  }

  async function finish() {
    setLoading(true)
    if (records.length) await fetch('/api/tutorial', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cleanup', records }) })
    setRecords([])
    setActive(false)
    setRect(null)
    setLoading(false)
    router.push('/')
  }

  async function returnToLauncher() {
    setLoading(true)
    if (records.length) await fetch('/api/tutorial', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cleanup', records }) })
    setRecords([])
    setActive(false)
    setRect(null)
    setStep(0)
    setLauncher(true)
    setLoading(false)
  }

  function next() {
    if (step === steps.length - 1) void finish()
    else { setRect(null); setStep(value => value + 1) }
  }

  if (!launcher && !active) return null

  return <>
    {launcher && <div className="tour-launcher-backdrop"><section className="tour-launcher"><button className="tour-close" onClick={() => setLauncher(false)}><X/></button><span className="tour-orbit"><Sparkles/><i/><i/></span><small>DM ACADEMY</small><h2>{pt ? 'Como você quer conhecer a plataforma?' : 'How would you like to explore?'}</h2><p>{pt ? 'O guia navega pelo sistema, explica cada área e pode criar exemplos temporários para você ver tudo funcionando.' : 'The guide navigates the system and can create temporary examples.'}</p>{message && <div className="error-banner">{message}</div>}<div className="tour-options"><button onClick={() => start(true)} disabled={loading}><span><Bot/></span><div><b>{pt ? 'Tour interativo completo' : 'Full interactive tour'}</b><p>{pt ? 'Cria exemplos, demonstra os fluxos e apaga tudo no final.' : 'Creates examples and removes everything at the end.'}</p></div><ChevronRight/></button><button onClick={() => start(false)} disabled={loading}><span><Play/></span><div><b>{pt ? 'Somente explicação' : 'Explanation only'}</b><p>{pt ? 'Passeia pelas telas sem criar nenhum registro.' : 'Visits screens without creating records.'}</p></div><ChevronRight/></button></div>{loading && <p className="tour-loading"><Loader2 className="spin"/> Preparando uma experiência segura…</p>}</section></div>}
    {active && <div className="tour-layer">
      {rect && <><div className="tour-shade top" style={{ height: Math.max(0, rect.top - 8) }}/><div className="tour-shade left" style={{ top: Math.max(0, rect.top - 8), width: Math.max(0, rect.left - 8), height: rect.height + 16 }}/><div className="tour-shade right" style={{ top: Math.max(0, rect.top - 8), left: rect.right + 8, height: rect.height + 16 }}/><div className="tour-shade bottom" style={{ top: rect.bottom + 8 }}/><div className="tour-focus" style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}/></>}
      {!rect && <div className="tour-shade full"><Loader2 className="spin"/></div>}
      <section className="tour-tooltip" style={rect ? { top: Math.min(window.innerHeight - 310, Math.max(18, rect.bottom + 18)), left: Math.min(window.innerWidth - 390, Math.max(18, rect.left)) } : undefined}><header><span>PASSO {step + 1} DE {steps.length}</span><button onClick={finish}><X/></button></header><div className="tour-progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }}/></div><h3>{steps[step].title}</h3><p>{steps[step].description}</p><aside><Sparkles/><span>{steps[step].tip}</span></aside><footer><button onClick={() => step ? setStep(value => value - 1) : void returnToLauncher()}><RotateCcw/>{pt ? 'Voltar' : 'Back'}</button><button onClick={next}>{loading ? <Loader2 className="spin"/> : step === steps.length - 1 ? <Trash2/> : <Check/>}{step === steps.length - 1 ? (pt ? 'Concluir e limpar testes' : 'Finish and clean up') : (pt ? 'Entendi, continuar' : 'Got it, continue')}</button></footer></section>
    </div>}
  </>
}
