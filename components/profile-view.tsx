'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { BookOpen, Camera, Check, Clipboard, Download, ExternalLink, Globe2, ImagePlus, KeyRound, Loader2, Mail, MonitorSmartphone, Palette, Save, ShieldCheck, Sparkles, UploadCloud, UserRound } from 'lucide-react'
import { buildSignature, defaultProfile, type Profile } from '@/lib/profile'
import { initials } from '@/lib/utils'

export function ProfileView({ lang, onProfileChange }: { lang: 'pt' | 'en', onProfileChange?: (profile: Profile) => void }) {
  const pt = lang === 'pt'
  const { setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile>(defaultProfile)
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

  if (loading) return <div className="page-state"><Loader2 className="spin"/><h2>{pt ? 'Preparando seu profile studio…' : 'Preparing your profile studio…'}</h2></div>

  const completionFields = [profile.display_name, profile.job_title, profile.professional_email, profile.phone, profile.bio, profile.avatar_url, profile.logo_url, profile.linkedin_url]
  const completion = Math.round(completionFields.filter(Boolean).length / completionFields.length * 100)
  const startTutorial = () => window.dispatchEvent(new CustomEvent('dm:start-tutorial'))

  return <div className="profile-page profile-studio-v2" data-tour="profile-studio">
    <section className="profile-command">
      <div className="profile-command-copy"><span><Sparkles/> IDENTITY CONTROL CENTER</span><h2>{pt ? 'Seu perfil, marca e acesso em um só lugar' : 'Your profile, brand and access in one place'}</h2><p>{pt ? 'Edite com contexto, acompanhe a completude e veja o resultado antes de salvar.' : 'Edit with context, track completeness and preview the result before saving.'}</p></div>
      <div className="profile-completion"><div><b>{completion}%</b><span>{pt ? 'perfil completo' : 'profile complete'}</span></div><i><b style={{ width: `${completion}%` }}/></i></div>
      <button className="primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="spin"/> : <Save/>}{pt ? 'Salvar tudo' : 'Save all'}</button>
    </section>

    {message && <div className="success-banner"><Check/>{message}</div>}
    {error && <div className="error-banner"><span>{error}</span></div>}

    <div className="profile-studio-grid">
      <aside className="profile-live-card">
        <div className="profile-live-cover" style={{ background: `linear-gradient(135deg,#171a2a,${profile.accent_color})` }}><span>LIVE PREVIEW</span></div>
        <button className="profile-live-avatar" onClick={() => avatarInput.current?.click()} aria-label={pt ? 'Alterar foto' : 'Change photo'}>{profile.avatar_url ? <img src={profile.avatar_url} alt=""/> : initials(profile.display_name)}<i><Camera/></i></button>
        <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event => event.target.files?.[0] && upload(event.target.files[0], 'avatar_url')}/>
        <div className="profile-live-copy"><h3>{profile.display_name || (pt ? 'Seu nome' : 'Your name')}</h3><p>{profile.job_title || (pt ? 'Seu cargo' : 'Your role')}</p><span>{profile.bio || (pt ? 'Adicione uma bio para apresentar sua atuação profissional.' : 'Add a bio to introduce your professional work.')}</span></div>
        <div className="profile-live-meta"><span><Mail/>{profile.professional_email || 'email@empresa.com'}</span><span><Globe2/>{profile.timezone}</span></div>
        <nav className="profile-jump"><a href="#identity"><UserRound/>{pt ? 'Identidade' : 'Identity'}</a><a href="#brand"><Palette/>{pt ? 'Marca e aparência' : 'Brand'}</a><a href="#security"><ShieldCheck/>{pt ? 'Acesso seguro' : 'Security'}</a><a href="#signature"><Mail/>{pt ? 'Assinatura' : 'Signature'}</a></nav>
      </aside>

      <main className="profile-workbench">
        <section id="identity" className="profile-work-card">
          <EditorTitle eyebrow="01 · IDENTIDADE" title={pt ? 'Presença profissional' : 'Professional presence'} description={pt ? 'Os dados usados no workspace, relatórios e comunicações.' : 'Details used across the workspace and communications.'}/>
          <div className="profile-upload-strip"><div className="profile-avatar-preview">{profile.avatar_url ? <img src={profile.avatar_url} alt=""/> : initials(profile.display_name)}</div><div><b>{pt ? 'Foto do perfil' : 'Profile photo'}</b><span>PNG, JPG ou WEBP · 10 MB</span></div><button onClick={() => avatarInput.current?.click()}><UploadCloud/>{uploading === 'avatar_url' ? (pt ? 'Enviando…' : 'Uploading…') : (pt ? 'Trocar foto' : 'Change photo')}</button></div>
          <div className="profile-form-grid"><Field label={pt ? 'Nome de exibição' : 'Display name'} value={profile.display_name} onChange={value => update('display_name', value)}/><Field label={pt ? 'Cargo ou título' : 'Job title'} value={profile.job_title} onChange={value => update('job_title', value)}/><Field label="E-mail profissional" type="email" value={profile.professional_email} onChange={value => update('professional_email', value)}/><Field label={pt ? 'Telefone profissional' : 'Professional phone'} value={profile.phone} onChange={value => update('phone', value)}/><Field wide label={pt ? 'Bio profissional' : 'Professional bio'} value={profile.bio} onChange={value => update('bio', value)} textarea/><Field label="LinkedIn" type="url" value={profile.linkedin_url} onChange={value => update('linkedin_url', value)}/><Field label="Instagram" type="url" value={profile.instagram_url} onChange={value => update('instagram_url', value)}/><Field label="Website" type="url" value={profile.website_url} onChange={value => update('website_url', value)}/></div>
        </section>

        <section id="brand" className="profile-work-card">
          <EditorTitle eyebrow="02 · BRAND STUDIO" title={pt ? 'Marca e experiência' : 'Brand and experience'} description={pt ? 'Personalize a interface agora e prepare relatórios com sua identidade.' : 'Personalize the interface and prepare branded reports.'}/>
          <div className="brand-preview" style={{ '--preview-accent': profile.accent_color } as React.CSSProperties}><div>{profile.logo_url ? <img src={profile.logo_url} alt=""/> : <ImagePlus/>}<span><small>POWERED BY</small><strong>{profile.display_name}</strong></span></div><i/><i/><b>RELATÓRIO DE TALENTOS · 2.1</b></div>
          <div className="profile-form-grid"><Field label={pt ? 'URL do logotipo' : 'Logo URL'} type="url" value={profile.logo_url} onChange={value => update('logo_url', value)}/><label className="profile-field"><span>{pt ? 'Arquivo da marca' : 'Brand file'}</span><button className="upload-button" onClick={() => logoInput.current?.click()}><UploadCloud/>{uploading === 'logo_url' ? (pt ? 'Enviando…' : 'Uploading…') : (pt ? 'Enviar logotipo' : 'Upload logo')}</button><input ref={logoInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event => event.target.files?.[0] && upload(event.target.files[0], 'logo_url')}/></label><label className="profile-field color-field"><span>{pt ? 'Cor de destaque' : 'Accent color'}</span><div><input type="color" value={profile.accent_color} onChange={event => update('accent_color', event.target.value)}/><input value={profile.accent_color} onChange={event => update('accent_color', event.target.value)}/></div></label><label className="profile-field"><span>{pt ? 'Tema visual' : 'Visual theme'}</span><select value={profile.theme} onChange={event => update('theme', event.target.value as Profile['theme'])}><option value="light">{pt ? 'Claro' : 'Light'}</option><option value="dark">{pt ? 'Escuro' : 'Dark'}</option><option value="system">{pt ? 'Automático' : 'System'}</option></select></label><label className="profile-field"><span>{pt ? 'Idioma' : 'Language'}</span><select value={profile.language} onChange={event => update('language', event.target.value as Profile['language'])}><option value="pt">Português (Brasil)</option><option value="en">English</option></select></label><label className="profile-field"><span>{pt ? 'Fuso horário' : 'Timezone'}</span><select value={profile.timezone} onChange={event => update('timezone', event.target.value)}><option value="America/Sao_Paulo">Brasília · GMT-3</option><option value="America/Manaus">Manaus · GMT-4</option><option value="America/Rio_Branco">Rio Branco · GMT-5</option><option value="Europe/Lisbon">Lisboa</option><option value="UTC">UTC</option></select></label></div>
        </section>

        <section id="security" className="profile-work-card security-work-card">
          <EditorTitle eyebrow="03 · SEGURANÇA" title={pt ? 'Acesso exclusivo' : 'Exclusive access'} description={pt ? 'Controle a credencial sem depender de um fluxo tradicional de login.' : 'Control credentials without a traditional login flow.'}/>
          <div className="security-status"><ShieldCheck/><div><strong>{pt ? 'Proteção ativa' : 'Protection active'}</strong><p>{pt ? 'Cookie HttpOnly e expiração automática em 12 horas.' : 'HttpOnly cookie and automatic 12-hour expiration.'}</p></div><span>{pt ? 'ATIVO' : 'ACTIVE'}</span></div>
          <div className="profile-form-grid"><Field wide label={pt ? 'Único e-mail autorizado' : 'Only authorized email'} type="email" value={profile.login_email} onChange={value => update('login_email', value)}/><Field wide label={pt ? 'Nova senha (opcional)' : 'New password (optional)'} type="password" value={newPassword} onChange={setNewPassword} placeholder={pt ? 'Mínimo de 6 caracteres' : 'At least 6 characters'}/></div><div className="security-note"><KeyRound/><span>{pt ? 'O e-mail autorizado ou a senha atual, digitados isoladamente, liberam o acesso.' : 'Either the authorized email or current password grants access.'}</span></div>
        </section>

        <section id="signature" className="profile-work-card">
          <EditorTitle eyebrow="04 · ASSINATURA" title={pt ? 'Comunicação pronta para uso' : 'Communication ready to use'} description={pt ? 'Pré-visualize e exporte uma assinatura segura com seus dados atuais.' : 'Preview and export a safe signature with your current details.'}/>
          <div className="signature-preview" dangerouslySetInnerHTML={{ __html: signature }}/><div className="signature-actions"><button className="primary" onClick={copySignature}>{copied ? <Check/> : <Clipboard/>}{copied ? (pt ? 'Copiado!' : 'Copied!') : (pt ? 'Copiar HTML' : 'Copy HTML')}</button><button onClick={() => download('assinatura-dm-recruit.html', signature, 'text/html')}><Download/>{pt ? 'Baixar assinatura' : 'Download signature'}</button><button onClick={() => download('perfil-dm-recruit.json', JSON.stringify(profile, null, 2), 'application/json')}><Download/>{pt ? 'Exportar perfil' : 'Export profile'}</button></div><p className="signature-help"><ExternalLink/>{pt ? 'Compatível com Gmail, Outlook e ferramentas de mensagem.' : 'Compatible with Gmail, Outlook and messaging tools.'}</p>
        </section>

        <section className="tutorial-center-card" data-tour="tutorial-center"><div><span><BookOpen/></span><div><small>DM ACADEMY</small><h3>{pt ? 'Aprenda fazendo, não lendo manuais' : 'Learn by doing, not by reading manuals'}</h3><p>{pt ? 'O tour abre cada módulo, destaca os controles e pode criar exemplos temporários que são apagados ao final.' : 'The tour opens every module and can create temporary examples removed at the end.'}</p></div></div><button onClick={startTutorial}><MonitorSmartphone/>{pt ? 'Iniciar tutorial guiado' : 'Start guided tutorial'}</button></section>
      </main>
    </div>
    <div className="profile-save-dock"><div><span>{completion}%</span><p><b>{pt ? 'Alterações locais' : 'Local changes'}</b><small>{pt ? 'Salve para sincronizar em todos os dispositivos.' : 'Save to sync across devices.'}</small></p></div><button className="primary" onClick={save} disabled={saving}>{saving ? <Loader2 className="spin"/> : <Save/>}{pt ? 'Salvar configurações' : 'Save settings'}</button></div>
  </div>
}

function EditorTitle({ eyebrow, title, description }: { eyebrow: string, title: string, description: string }) {
  return <header className="profile-editor-head"><span>{eyebrow}</span><h3>{title}</h3><p>{description}</p></header>
}

function Field({ label, value, onChange, type = 'text', wide, textarea, placeholder }: { label: string, value: string, onChange: (value: string) => void, type?: string, wide?: boolean, textarea?: boolean, placeholder?: string }) {
  return <label className={`profile-field${wide ? ' wide' : ''}`}><span>{label}</span>{textarea ? <textarea rows={4} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/> : <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/>}</label>
}
