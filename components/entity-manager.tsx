'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bot, Check, ChevronDown, ChevronUp, ExternalLink, FileText, Loader2, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, UploadCloud, WandSparkles, X, Zap } from 'lucide-react'
import { formatDate, initials } from '@/lib/utils'
import { automationPrompts, smartDefaults } from '@/lib/automation'

export type Field = {
  name: string
  labelPt: string
  labelEn: string
  type?: 'text'|'email'|'url'|'date'|'datetime-local'|'time'|'textarea'|'select'|'number'|'checkbox'|'file'
  required?: boolean
  options?: { value: string, labelPt: string, labelEn: string }[]
  relation?: string
  fileFolder?: string
  uploadTarget?: string
  accept?: string
  helpPt?: string
  helpEn?: string
}
export type EntityConfig = {
  resource: string
  titlePt: string
  titleEn: string
  singularPt: string
  singularEn: string
  descriptionPt: string
  descriptionEn: string
  fields: Field[]
  primary: string
  secondary?: string
  dateField?: string
  statusField?: string
}
type Row = Record<string, any>
const formSchema = z.record(z.any())

export function EntityManager({ config, lang, globalSearch = '', compact = false, onChanged }: { config: EntityConfig, lang: 'pt'|'en', globalSearch?: string, compact?: boolean, onChanged?: () => void }) {
  const pt = lang === 'pt'
  const [rows, setRows] = useState<Row[]>([])
  const [relations, setRelations] = useState<Record<string, Row[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantPrompt, setAssistantPrompt] = useState('')
  const [assistantBusy, setAssistantBusy] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null)
  const { register, handleSubmit, reset, setValue, watch } = useForm<Row>({ resolver: zodResolver(formSchema) })
  const watched = watch()

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/data/${config.resource}?_=${Date.now()}`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setRows(body)
      const relationNames = [...new Set(config.fields.map(field => field.relation).filter(Boolean))] as string[]
      const entries = await Promise.all(relationNames.map(async relation => {
        const response = await fetch(`/api/data/${relation}?_=${Date.now()}`, { cache: 'no-store' })
        return [relation, response.ok ? await response.json() : []]
      }))
      setRelations(Object.fromEntries(entries))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os dados.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [config.resource])
  const filtered = useMemo(() => {
    const query = (globalSearch || search).toLowerCase()
    return !query ? rows : rows.filter(row => JSON.stringify(row).toLowerCase().includes(query))
  }, [rows, search, globalSearch])

  const requiredFields = config.fields.filter(field => field.required && field.type !== 'file')
  const completion = requiredFields.length ? Math.round(requiredFields.filter(field => watched?.[field.name] !== '' && watched?.[field.name] != null).length / requiredFields.length * 100) : 100
  const essential = config.fields.filter(field => field.required || ['description','photo_upload','resume_url','certificate_url'].includes(field.name))
  const optional = config.fields.filter(field => !essential.includes(field))

  function open(row?: Row) {
    const base = Object.fromEntries(config.fields.map(field => [field.name, field.type === 'checkbox' ? false : '']))
    setEditing(row || null)
    reset(row || { ...base, ...smartDefaults(config.resource) })
    setAdvanced(Boolean(row))
    setAssistantOpen(false)
    setAssistantPrompt('')
    setNotice('')
    setModal(true)
  }

  async function submit(values: Row) {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/data/${config.resource}`, {
        method: editing ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editing ? { ...values, id: editing.id } : values),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setModal(false)
      setNotice(pt ? 'Registro salvo e sincronizado com sucesso.' : 'Record saved and synchronized.')
      await load()
      onChanged?.()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.')
    } finally { setSaving(false) }
  }

  async function remove() {
    if (!deleteTarget) return
    const response = await fetch(`/api/data/${config.resource}?id=${deleteTarget.id}`, { method: 'DELETE' })
    const body = await response.json()
    if (!response.ok) setError(body.error)
    else {
      setNotice(pt ? 'Registro excluído.' : 'Record deleted.')
      setDeleteTarget(null)
      await load()
      onChanged?.()
    }
  }

  async function upload(file: File, field: Field) {
    setUploading(field.name)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', field.fileFolder || config.resource)
      const response = await fetch('/api/upload', { method: 'POST', body: form, cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      const target = field.uploadTarget || field.name
      setValue(target, body.url, { shouldDirty: true })
      if (config.fields.some(item => item.name === target.replace('_url', '_path'))) setValue(target.replace('_url', '_path'), body.path)
      setNotice(pt ? 'Arquivo lido e anexado automaticamente.' : 'File read and attached automatically.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha no upload.')
    } finally { setUploading('') }
  }

  async function runAssistant() {
    if (!assistantPrompt.trim()) return
    setAssistantBusy(true)
    setError('')
    try {
      const response = await fetch('/api/ai/autofill', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ resource: config.resource, prompt: assistantPrompt }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      Object.entries(body.values || {}).forEach(([key, value]) => {
        if (config.fields.some(field => field.name === key)) setValue(key, value, { shouldDirty: true, shouldValidate: true })
      })
      setAdvanced(true)
      setNotice(body.warning || (pt ? 'Campos preenchidos pela automação. Revise e salve.' : 'Fields filled by automation. Review and save.'))
      setAssistantOpen(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Copiloto indisponível.')
    } finally { setAssistantBusy(false) }
  }

  async function quickAdvance(row: Row) {
    const field = config.statusField
    if (!field) return open(row)
    const current = row[field]
    const next: Record<string, any> = { draft: 'active', pending: 'approved', active: 'completed', screening: 'interview', interview: 'offer', offer: 'hired', scheduled: 'completed', in_progress: 'completed', false: true }
    if (!(String(current) in next)) return open(row)
    const response = await fetch(`/api/data/${config.resource}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: row.id, [field]: next[String(current)], ...(field === 'completed' ? { completed_at: new Date().toISOString() } : {}) }) })
    if (response.ok) {
      setNotice(pt ? 'Etapa avançada automaticamente.' : 'Stage advanced automatically.')
      await load()
    } else setError((await response.json()).error)
  }

  function relationLabel(item: Row, relation = '') {
    if (item._label) return item._label
    if (item.candidates?.name || item.jobs?.title) return `${item.candidates?.name || ''}${item.jobs?.title ? ` · ${item.jobs.title}` : ''}`
    if (item.employees?.name || item.trainings?.name) return `${item.employees?.name || ''}${item.trainings?.name ? ` · ${item.trainings.name}` : ''}`
    return item.name || item.title || item.email || `${relation.replaceAll('_', ' ')} ${String(item.id || '').slice(0, 8)}`
  }

  function display(field: string, value: any) {
    const configField = config.fields.find(item => item.name === field)
    if (value == null || value === '') return '—'
    if (configField?.relation) {
      const item = relations[configField.relation]?.find(candidate => candidate.id === value)
      return item ? relationLabel(item, configField.relation) : value.slice?.(0, 8) || value
    }
    if (configField?.type === 'date' || configField?.type === 'datetime-local') return formatDate(value, pt ? 'pt-BR' : 'en-US')
    if (typeof value === 'boolean') return value ? (pt ? 'Sim' : 'Yes') : (pt ? 'Não' : 'No')
    return String(value)
  }

  function renderField(field: Field) {
    const label = pt ? field.labelPt : field.labelEn
    return <label key={field.name} className={field.type === 'textarea' || field.type === 'file' ? 'wide' : ''}>
      <span>{label}{field.required && ' *'}</span>
      {field.helpPt && <small>{pt ? field.helpPt : field.helpEn}</small>}
      {field.type === 'textarea' ? <textarea {...register(field.name, { required: field.required })} rows={4}/>
        : field.type === 'select' ? <select {...register(field.name, { required: field.required })}><option value="">{pt ? 'Selecione…' : 'Select…'}</option>{field.options?.map(option => <option key={option.value} value={option.value}>{pt ? option.labelPt : option.labelEn}</option>)}{field.relation && relations[field.relation]?.filter(item => item.id !== editing?.id).map(item => <option key={item.id} value={item.id}>{relationLabel(item, field.relation)}</option>)}</select>
        : field.type === 'checkbox' ? <span className="checkbox"><input type="checkbox" {...register(field.name)}/>{pt ? 'Ativar' : 'Enable'}</span>
        : field.type === 'file' ? <><span className="file-input"><UploadCloud/>{uploading === field.name ? (pt ? 'Processando…' : 'Processing…') : (pt ? 'Arraste ou selecione o arquivo' : 'Drop or choose a file')}<small>{pt ? 'Upload seguro e preenchimento automático quando disponível' : 'Secure upload with automatic processing'}</small><input type="file" accept={field.accept || '.pdf,image/png,image/jpeg,image/webp'} disabled={!!uploading} onChange={event => event.target.files?.[0] && upload(event.target.files[0], field)}/></span>{watch(field.uploadTarget || field.name) && <a className="file-link" href={watch(field.uploadTarget || field.name)} target="_blank"><ExternalLink/>{pt ? 'Visualizar arquivo' : 'View file'}</a>}<input type="hidden" {...register(field.name)}/></>
        : <input type={field.type || 'text'} {...register(field.name, { required: field.required, valueAsNumber: field.type === 'number' })}/>} 
    </label>
  }

  return <section className={compact ? 'entity compact' : 'entity'} data-tour="entity-manager">
    <header className="entity-head"><div><span>{config.resource.replaceAll('_', ' ').toUpperCase()}</span><h2>{pt ? config.titlePt : config.titleEn}</h2><p>{pt ? config.descriptionPt : config.descriptionEn}</p></div><div className="entity-actions">{!globalSearch && <label><Search/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={pt ? 'Buscar…' : 'Search…'}/></label>}<button className="primary" onClick={() => open()} data-tour="new-record"><Plus/>{pt ? `Novo ${config.singularPt}` : `New ${config.singularEn}`}</button></div></header>
    {notice && <div className="success-banner"><Check/>{notice}<button onClick={() => setNotice('')}><X/></button></div>}
    {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError('')}><X/></button></div>}
    {loading ? <div className="table-state"><Loader2 className="spin"/>{pt ? 'Sincronizando…' : 'Syncing…'}</div>
      : filtered.length === 0 ? <div className="empty-state"><span>{initials(config.singularPt)}</span><h3>{pt ? 'Tudo pronto para começar' : 'Ready to get started'}</h3><p>{pt ? 'Use o copiloto para criar o primeiro registro sem preencher tudo manualmente.' : 'Use the copilot to create your first record without filling everything manually.'}</p><button onClick={() => open()}><WandSparkles/>{pt ? 'Criar com automação' : 'Create with automation'}</button></div>
      : <div className="data-list">{filtered.map(row => <article key={row.id} className="data-row"><span className="person-avatar">{row.photo_url ? <img src={row.photo_url} alt=""/> : initials(String(row[config.primary] || config.singularPt))}</span><div className="row-main"><strong>{display(config.primary, row[config.primary])}</strong><small>{config.secondary ? display(config.secondary, row[config.secondary]) : formatDate(row.created_at, pt ? 'pt-BR' : 'en-US')}</small></div>{config.dateField && <div className="row-meta"><span>{pt ? 'Data' : 'Date'}</span><b>{display(config.dateField, row[config.dateField])}</b></div>}{config.statusField && <span className={`status-pill status-${row[config.statusField]}`}>{String(row[config.statusField] ?? '—')}</span>}<div className="row-actions">{config.statusField && <button onClick={() => quickAdvance(row)} title={pt ? 'Avançar automaticamente' : 'Advance automatically'}><Zap/></button>}<button onClick={() => open(row)} title={pt ? 'Editar' : 'Edit'}><Pencil/></button><button onClick={() => setDeleteTarget(row)} title={pt ? 'Excluir' : 'Delete'}><Trash2/></button><button className="more"><MoreHorizontal/></button></div></article>)}</div>}

    {modal && <div className="modal-backdrop" onMouseDown={event => event.currentTarget === event.target && setModal(false)}><section className="modal smart-modal" role="dialog" aria-modal="true"><header><div><span>{editing ? (pt ? 'EDITAR REGISTRO' : 'EDIT RECORD') : (pt ? 'FLUXO INTELIGENTE' : 'SMART FLOW')}</span><h2>{editing ? display(config.primary, editing[config.primary]) : (pt ? `Novo ${config.singularPt}` : `New ${config.singularEn}`)}</h2></div><div className="form-progress"><span>{completion}%</span><i><b style={{ width: `${completion}%` }}/></i></div><button onClick={() => setModal(false)}><X/></button></header>
      <form onSubmit={handleSubmit(submit)}>
        {automationPrompts[config.resource] && <section className="copilot-box"><div><span><Bot/></span><div><b>DM Copilot</b><p>{automationPrompts[config.resource]}</p></div><button type="button" onClick={() => setAssistantOpen(value => !value)}>{assistantOpen ? <ChevronUp/> : <Sparkles/>}{assistantOpen ? (pt ? 'Fechar' : 'Close') : (pt ? 'Preencher com IA' : 'Fill with AI')}</button></div>{assistantOpen && <div className="copilot-input"><textarea autoFocus value={assistantPrompt} onChange={event => setAssistantPrompt(event.target.value)} rows={3} placeholder={pt ? 'Ex.: Analista financeiro pleno, híbrido em São Paulo, responsável por fechamento e indicadores…' : 'Describe what you need…'}/><button type="button" onClick={runAssistant} disabled={assistantBusy || !assistantPrompt.trim()}>{assistantBusy ? <Loader2 className="spin"/> : <WandSparkles/>}{pt ? 'Gerar e preencher' : 'Generate and fill'}</button></div>}</section>}
        <div className="smart-section-title"><span>1</span><div><b>{pt ? 'Informações essenciais' : 'Essential information'}</b><small>{pt ? 'Somente o necessário para concluir' : 'Only what is needed to finish'}</small></div></div>
        <div className="form-grid">{essential.map(renderField)}</div>
        {optional.length > 0 && <><button type="button" className="advanced-toggle" onClick={() => setAdvanced(value => !value)}>{advanced ? <ChevronUp/> : <ChevronDown/>}<span><b>{pt ? 'Detalhes opcionais' : 'Optional details'}</b><small>{pt ? 'A automação já sugeriu valores quando possível' : 'Automation suggested values where possible'}</small></span></button>{advanced && <div className="form-grid advanced-fields">{optional.map(renderField)}</div>}</>}
        <footer><button type="button" onClick={() => setModal(false)}>{pt ? 'Cancelar' : 'Cancel'}</button><button className="primary" disabled={saving}>{saving ? <Loader2 className="spin"/> : <Check/>}{pt ? 'Salvar e sincronizar' : 'Save and sync'}</button></footer>
      </form>
    </section></div>}

    {deleteTarget && <div className="modal-backdrop"><section className="confirm-dialog"><span><Trash2/></span><h3>{pt ? 'Excluir este registro?' : 'Delete this record?'}</h3><p>{display(config.primary, deleteTarget[config.primary])}</p><div><button onClick={() => setDeleteTarget(null)}>{pt ? 'Cancelar' : 'Cancel'}</button><button onClick={remove}>{pt ? 'Excluir definitivamente' : 'Delete permanently'}</button></div></section></div>}
  </section>
}
