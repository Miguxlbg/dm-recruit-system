'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, ChevronDown, CircleDashed, ExternalLink, Globe2, Link2, Loader2, Pause, Play, RefreshCw, Rocket, Send, Sparkles } from 'lucide-react'

type Job = { id: string, title: string, description: string, status: string, location?: string }
type Portal = { id: string, name: string, type: string, color: string, url: string, missing: string[], publication: null | { status: string, published_at?: string } }

export function PublicationHub({ lang, onEditJob }: { lang: 'pt'|'en', onEditJob?: () => void }) {
  const pt = lang === 'pt'
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobId, setJobId] = useState('')
  const [portals, setPortals] = useState<Portal[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState('')

  useEffect(() => {
    fetch('/api/data/jobs', { cache: 'no-store' }).then(response => response.ok ? response.json() : []).then((data: Job[]) => {
      setJobs(data)
      const open = data.find(job => job.status === 'open') || data[0]
      if (open) setJobId(open.id)
      else setLoading(false)
    })
  }, [])

  useEffect(() => { if (jobId) void load() }, [jobId])

  async function load() {
    setLoading(true)
    setError('')
    const response = await fetch(`/api/publications?jobId=${jobId}&_=${Date.now()}`, { cache: 'no-store' })
    const body = await response.json()
    if (response.ok) setPortals(body.portals || [])
    else setError(body.error)
    setLoading(false)
  }

  async function act(portal: Portal, action: 'publish'|'pause') {
    setBusy(portal.id)
    setNotice('')
    setError('')
    const response = await fetch('/api/publications', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jobId, portal: portal.id, action }) })
    const body = await response.json()
    if (!response.ok) setError(body.error)
    else {
      setNotice(body.warning ? `${body.message} ${body.warning}` : body.message)
      if (body.persistence === 'session') setPortals(current => current.map(item => item.id === portal.id ? { ...item, publication: body.publication } : item))
      else await load()
      if (body.requires_oauth && action === 'publish') window.open(body.external_url, '_blank', 'noopener,noreferrer')
    }
    setBusy('')
  }

  async function publishAll() {
    for (const portal of portals.filter(item => !item.missing.length && item.publication?.status !== 'ready')) await act(portal, 'publish')
  }

  const selected = jobs.find(job => job.id === jobId)
  const ready = portals.filter(portal => ['ready','published'].includes(portal.publication?.status || '')).length

  return <section className="publication-workspace" data-tour="publication-hub">
    <header className="publication-header"><div><span>MULTICHANNEL DISTRIBUTION</span><h2>{pt ? 'Publicar em portais' : 'Publish to job boards'}</h2><p>{pt ? 'Valide uma vez e prepare a vaga para todos os canais.' : 'Validate once and prepare the job for every channel.'}</p></div><button className="primary" onClick={publishAll} disabled={!portals.length || Boolean(busy)}><Rocket/>{pt ? 'Preparar todos os canais' : 'Prepare all channels'}</button></header>
    <div className="publication-layout">
      <aside className="job-context"><small>VAGA SELECIONADA</small>{jobs.length ? <><label><span>{pt ? 'Escolha a vaga' : 'Choose a job'}</span><select value={jobId} onChange={event => setJobId(event.target.value)}>{jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label><div className="job-context-card"><span>{selected?.status === 'open' ? <CheckCircle2/> : <Pause/>}</span><div><b>{selected?.title}</b><p>{selected?.location || (pt ? 'Localização ainda não definida' : 'Location not set')}</p></div></div><dl><div><dt>{pt ? 'Canais preparados' : 'Ready channels'}</dt><dd>{ready}/{portals.length || 5}</dd></div><div><dt>{pt ? 'Completude' : 'Completeness'}</dt><dd>{portals[0]?.missing.length ? `${Math.max(25, 100 - portals[0].missing.length * 25)}%` : '100%'}</dd></div></dl><button onClick={onEditJob} disabled={!onEditJob}><Sparkles/>{pt ? 'Otimizar vaga com IA' : 'Optimize with AI'}</button></> : <div className="job-context-empty"><CircleDashed/><b>{pt ? 'Nenhuma vaga cadastrada' : 'No jobs yet'}</b><p>{pt ? 'Crie uma vaga para liberar os canais.' : 'Create a job to unlock channels.'}</p></div>}</aside>
      <div className="portal-area">
        <div className="portal-filters"><div><Globe2/><span>{pt ? 'País dos portais' : 'Portal country'}</span><b>Brasil</b></div><div className="publication-score"><span><i style={{ width: `${portals.length ? ready / portals.length * 100 : 0}%` }}/></span><b>{ready} {pt ? 'prontos' : 'ready'}</b></div><button onClick={load}><RefreshCw/></button></div>
        {notice && <div className="success-banner"><Check/>{notice}</div>}
        {error && <div className="error-banner"><span>{error}</span></div>}
        {loading ? <div className="portal-loading"><Loader2 className="spin"/>{pt ? 'Verificando canais e requisitos…' : 'Checking channels and requirements…'}</div> : portals.map(portal => {
          const status = portal.publication?.status || 'not_connected'
          const hasErrors = portal.missing.length > 0
          return <article className={`portal-card portal-${status}`} key={portal.id} style={{ '--portal-color': portal.color } as React.CSSProperties}>
            <div className="portal-main"><span className="portal-logo">{portal.name.split(/\s+/).map(word => word[0]).join('').slice(0,2)}</span><div className="portal-name"><b>{portal.name}</b><small>{portal.type}</small></div><div className="portal-account"><span>{pt ? 'Conta vinculada' : 'Linked account'}</span><a href={portal.url} target="_blank" rel="noreferrer"><Link2/>{pt ? 'Conectar conta oficial' : 'Connect official account'}</a></div><div className="portal-status">{hasErrors ? <><AlertTriangle/><span>{pt ? 'Requer ajustes' : 'Needs changes'}</span></> : status === 'ready' ? <><CheckCircle2/><span>{pt ? 'Pronta para envio' : 'Ready to send'}</span></> : status === 'paused' ? <><Pause/><span>{pt ? 'Pausada' : 'Paused'}</span></> : <><CircleDashed/><span>{pt ? 'Não publicada' : 'Not published'}</span></>}</div><div className="portal-actions">{status === 'ready' ? <button onClick={() => act(portal, 'pause')} disabled={busy === portal.id}><Pause/>{pt ? 'Pausar' : 'Pause'}</button> : <button className="publish" onClick={() => act(portal, 'publish')} disabled={busy === portal.id || hasErrors}>{busy === portal.id ? <Loader2 className="spin"/> : <Send/>}{pt ? 'Preparar' : 'Prepare'}</button>}<button className="expand" onClick={() => setExpanded(expanded === portal.id ? '' : portal.id)}><ChevronDown/></button></div></div>
            {hasErrors && <div className="portal-warning"><AlertTriangle/><span>{pt ? 'A vaga ainda não cumpre todos os requisitos do portal.' : 'The job does not meet all portal requirements yet.'}</span><b>{portal.missing.join(' · ')}</b></div>}
            {expanded === portal.id && <div className="portal-details"><div><b>{pt ? 'Fluxo automatizado' : 'Automated workflow'}</b><p>{pt ? 'O DM valida os campos, registra o status e abre o ambiente oficial para conexão segura da conta.' : 'DM validates fields, saves status and opens the official provider environment.'}</p></div><a href={portal.url} target="_blank" rel="noreferrer">{pt ? 'Abrir portal oficial' : 'Open official portal'}<ExternalLink/></a></div>}
          </article>
        })}
        <div className="integration-disclaimer"><ArrowUpRight/><p><b>{pt ? 'Integração segura e transparente' : 'Safe and transparent integration'}</b><span>{pt ? 'LinkedIn, Indeed e outros portais exigem contrato/OAuth próprio. O sistema prepara e valida tudo; a publicação externa só é confirmada após conectar sua conta oficial.' : 'External portals require their own OAuth or contract. The system prepares everything before official account connection.'}</span></p></div>
      </div>
    </div>
  </section>
}
