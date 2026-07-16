'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Check, Clipboard, Download, ExternalLink, ImagePlus, KeyRound, Loader2, Mail, Palette, Save, ShieldCheck, Sparkles, UploadCloud, UserRound } from 'lucide-react'
import { buildSignature, defaultProfile, type Profile } from '@/lib/profile'
import { initials } from '@/lib/utils'

type Tab = 'identity' | 'brand' | 'access' | 'signature'

export function ProfileView({ lang, onProfileChange }: { lang: 'pt' | 'en', onProfileChange?: (profile: Profile) => void }) {
  const pt = lang === 'pt'
  const { setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [tab, setTab] = useState<Tab>('identity')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const avatarInput = useRef<HTMLInputElement>(null)
  const logoInput = useRef<HTMLInputElement>(null)
  const signature = useMemo(() => buildSignature(profile), [profile])

  useEffect(() => {
    fetch('/api/profile', { cache: 'no-store' }).then(response => response.json()).then(body => {
      if (body.profile) setProfile({ ...defaultProfile, ...body.profile })
    }).catch(() => setError(pt ? 'Não foi possível carregar o perfil.' : 'Could not load profile.')).finally(() => setLoading(false))
  }, [pt])

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile(current => ({ ...current, [key]: value }))
    if (key === 'accent_color') document.documentElement.style.setProperty('--accent', String(value))
    if (key === 'theme') setTheme(String(value))
  }

  async function upload(file: File, target: 'avatar_url' | 'logo_url') {
    setUploading(target)
    setError('')
    const form = new FormData()
    form.append('file', file)
    form.append('folder', target === 'avatar_url' ? 'profile' : 'brand')
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: form })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      update(target, body.url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Upload indisponível.')
    } finally { setUploading('') }
  }

  async function save() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...profile, new_password: newPassword || undefined }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setProfile(body.profile)
      setNewPassword('')
      setMessage(pt ? 'Perfil e preferências salvos com sucesso.' : 'Profile and preferences saved.')
      onProfileChange?.(body.profile)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  async function copySignature() {
    await navigator.clipboard.writeText(signature)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function download(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = name
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="page-state"><Loader2 className="spin"/><h2>{pt ? 'Preparando seu perfil…' : 'Preparing your profile…'}</h2></div>

  const tabs: { id: Tab, label: string, icon: typeof UserRound }[] = [
    { id: 'identity', label: pt ? 'Identidade' : 'Identity', icon: UserRound },
    { id: 'brand', label: pt ? 'Marca & aparência' : 'Brand & appearance', icon: Palette },
    { id: 'access', label: pt ? 'Acesso' : 'Access', icon: KeyRound },
    { id: 'signature', label: pt ? 'Assinatura' : 'Signature', icon: Mail },
  ]

  return <div className="profile-page">
    <section className="profile-hero">
      <div className="profile-cover-grid"/>
      <div className="profile-avatar-xl">{profile.avatar_url ? <img src={profile.avatar_url} alt=""/> : initials(profile.display_name)}</div>
      <div><span><Sparkles/> PERFIL DO WORKSPACE</span><h2>{profile.display_name}</h2><p>{profile.job_title}</p></div>
      <button className="primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="spin"/> : <Save/>}{pt ? 'Salvar alterações' : 'Save changes'}</button>
    </section>

    <div className="profile-layout">
      <aside className="profile-tabs">{tabs.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><item.icon/><span>{item.label}</span></button>)}</aside>
      <section className="profile-editor">
        {message && <div className="success-banner"><Check/>{message}</div>}
        {error && <div className="error-banner"><span>{error}</span></div>}

        {tab === 'identity' && <>
          <EditorTitle eyebrow="IDENTIDADE PROFISSIONAL" title={pt ? 'Como você aparece no sistema' : 'How you appear in the system'} description={pt ? 'Esses dados personalizam o workspace e todas as comunicações.' : 'These details personalize your workspace and communications.'}/>
          <div className="media-upload-row">
            <div className="profile-avatar-preview">{profile.avatar_url ? <img src={profile.avatar_url} alt=""/> : initials(profile.display_name)}</div>
            <div><strong>{pt ? 'Foto de perfil' : 'Profile photo'}</strong><p>PNG, JPG ou WEBP · máximo 10 MB</p><div className="inline-actions"><button onClick={() => avatarInput.current?.click()}><UploadCloud/>{uploading === 'avatar_url' ? 'Enviando…' : 'Upload'}</button><input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event => event.target.files?.[0] && upload(event.target.files[0], 'avatar_url')}/></div></div>
          </div>
          <div className="profile-form-grid">
            <Field label={pt ? 'Nome de exibição' : 'Display name'} value={profile.display_name} onChange={value => update('display_name', value)}/>
            <Field label={pt ? 'Cargo ou título' : 'Job title'} value={profile.job_title} onChange={value => update('job_title', value)}/>
            <Field label="E-mail profissional" type="email" value={profile.professional_email} onChange={value => update('professional_email', value)}/>
            <Field label={pt ? 'Telefone profissional' : 'Professional phone'} value={profile.phone} onChange={value => update('phone', value)}/>
            <Field wide label={pt ? 'Bio curta / assinatura de mensagens' : 'Short bio'} value={profile.bio} onChange={value => update('bio', value)} textarea/>
            <Field label="LinkedIn" type="url" value={profile.linkedin_url} onChange={value => update('linkedin_url', value)}/>
            <Field label="Instagram" type="url" value={profile.instagram_url} onChange={value => update('instagram_url', value)}/>
            <Field label="Website" type="url" value={profile.website_url} onChange={value => update('website_url', value)}/>
          </div>
        </>}

        {tab === 'brand' && <>
          <EditorTitle eyebrow="BRAND STUDIO" title={pt ? 'Sua marca, seu workspace' : 'Your brand, your workspace'} description={pt ? 'Aplique identidade própria aos relatórios, propostas e interface.' : 'Apply your identity to reports, proposals and the interface.'}/>
          <div className="brand-preview" style={{ '--preview-accent': profile.accent_color } as React.CSSProperties}><div>{profile.logo_url ? <img src={profile.logo_url} alt=""/> : <ImagePlus/>}<span><small>POWERED BY</small><strong>{profile.display_name}</strong></span></div><i/><i/><b>RELATÓRIO DE TALENTOS · 2.0</b></div>
          <div className="profile-form-grid">
            <Field label={pt ? 'URL do logotipo' : 'Logo URL'} type="url" value={profile.logo_url} onChange={value => update('logo_url', value)}/>
            <label className="profile-field"><span>{pt ? 'Ou envie seu logotipo' : 'Or upload your logo'}</span><button className="upload-button" onClick={() => logoInput.current?.click()}><UploadCloud/>{uploading === 'logo_url' ? 'Enviando…' : 'Selecionar arquivo'}</button><input ref={logoInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event => event.target.files?.[0] && upload(event.target.files[0], 'logo_url')}/></label>
            <label className="profile-field color-field"><span>{pt ? 'Cor de destaque' : 'Accent color'}</span><div><input type="color" value={profile.accent_color} onChange={event => update('accent_color', event.target.value)}/><input value={profile.accent_color} onChange={event => update('accent_color', event.target.value)}/></div></label>
            <label className="profile-field"><span>{pt ? 'Tema visual' : 'Visual theme'}</span><select value={profile.theme} onChange={event => update('theme', event.target.value as Profile['theme'])}><option value="light">Claro</option><option value="dark">Escuro</option><option value="system">Automático</option></select></label>
            <label className="profile-field"><span>{pt ? 'Idioma da interface' : 'Interface language'}</span><select value={profile.language} onChange={event => update('language', event.target.value as Profile['language'])}><option value="pt">Português (Brasil)</option><option value="en">English</option></select></label>
            <label className="profile-field"><span>{pt ? 'Fuso horário' : 'Timezone'}</span><select value={profile.timezone} onChange={event => update('timezone', event.target.value)}><option value="America/Sao_Paulo">Brasília · GMT-3</option><option value="America/Manaus">Manaus · GMT-4</option><option value="America/Rio_Branco">Rio Branco · GMT-5</option><option value="Europe/Lisbon">Lisboa</option><option value="UTC">UTC</option></select></label>
          </div>
        </>}

        {tab === 'access' && <>
          <EditorTitle eyebrow="SEGURANÇA" title={pt ? 'Acesso exclusivo' : 'Exclusive access'} description={pt ? 'Somente este e-mail ou a senha definida poderão abrir o sistema.' : 'Only this email or the defined password can open the system.'}/>
          <div className="security-status"><ShieldCheck/><div><strong>{pt ? 'Proteção ativa' : 'Protection active'}</strong><p>{pt ? 'Sessões seguras expiram automaticamente após 12 horas.' : 'Secure sessions automatically expire after 12 hours.'}</p></div><span>ATIVO</span></div>
          <div className="profile-form-grid">
            <Field wide label={pt ? 'Único e-mail autorizado para acesso' : 'Only authorized login email'} type="email" value={profile.login_email} onChange={value => update('login_email', value)}/>
            <Field wide label={pt ? 'Nova senha (deixe vazio para manter)' : 'New password (leave blank to keep)'} type="password" value={newPassword} onChange={setNewPassword} placeholder="Mínimo de 6 caracteres"/>
          </div>
          <div className="security-note"><KeyRound/><span>{pt ? 'Você sempre poderá entrar usando o e-mail autorizado ou a senha atual.' : 'You can always sign in with the authorized email or current password.'}</span></div>
        </>}

        {tab === 'signature' && <>
          <EditorTitle eyebrow="ASSINATURA AUTOMÁTICA" title={pt ? 'Pronta para cada contato' : 'Ready for every contact'} description={pt ? 'Gerada automaticamente com seus dados e pronta para e-mail ou WhatsApp.' : 'Automatically generated from your details.'}/>
          <div className="signature-preview" dangerouslySetInnerHTML={{ __html: signature }}/>
          <div className="signature-actions"><button className="primary" onClick={copySignature}>{copied ? <Check/> : <Clipboard/>}{copied ? 'Copiado!' : 'Copiar HTML'}</button><button onClick={() => download('assinatura-dm-recruit.html', signature, 'text/html')}><Download/>Baixar assinatura</button><button onClick={() => download('perfil-dm-recruit.json', JSON.stringify(profile, null, 2), 'application/json')}><Download/>Exportar perfil</button></div>
          <p className="signature-help"><ExternalLink/>{pt ? 'A assinatura será a base dos disparos automáticos e pode ser colada no Gmail, Outlook e ferramentas de mensagem.' : 'This signature is used by automatic outreach and can be pasted into Gmail or Outlook.'}</p>
        </>}
      </section>
    </div>
  </div>
}

function EditorTitle({ eyebrow, title, description }: { eyebrow: string, title: string, description: string }) {
  return <header className="profile-editor-head"><span>{eyebrow}</span><h3>{title}</h3><p>{description}</p></header>
}

function Field({ label, value, onChange, type = 'text', wide, textarea, placeholder }: { label: string, value: string, onChange: (value: string) => void, type?: string, wide?: boolean, textarea?: boolean, placeholder?: string }) {
  return <label className={`profile-field${wide ? ' wide' : ''}`}><span>{label}</span>{textarea ? <textarea rows={4} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/> : <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/>}</label>
}
