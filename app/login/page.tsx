'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BadgeCheck, Eye, EyeOff, Fingerprint, LockKeyhole, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [credential, setCredential] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ credential }),
    })
    if (response.ok) {
      const next = new URLSearchParams(window.location.search).get('next')
      router.replace(next || '/')
      router.refresh()
      return
    }
    setError('Acesso não reconhecido. Use o e-mail autorizado ou a senha do sistema.')
    setLoading(false)
  }

  return <main className="login-shell">
    <div className="login-aurora" aria-hidden="true"><i/><i/><i/><i/></div>
    <section className="login-brand">
      <div className="brand-mark"><UsersRound/></div>
      <div className="login-hero-copy">
        <p className="eyebrow"><Sparkles/> DM SYSTEM RECRUIT 2.0</p>
        <h1>Talentos em movimento.<br/><span>Decisões com clareza.</span></h1>
        <p>Seu cockpit completo para transformar recrutamento, pessoas e performance em uma operação inteligente.</p>
        <div className="login-highlights">
          <span><BadgeCheck/> Dados centralizados</span>
          <span><Fingerprint/> Acesso exclusivo</span>
          <span><ShieldCheck/> Privado por padrão</span>
        </div>
      </div>
      <aside className="login-status"><i/><div><span>SISTEMA OPERACIONAL</span><strong>Workspace protegido e pronto para você</strong></div><b>V2.0 BETA</b></aside>
    </section>
    <section className="login-panel">
      <form onSubmit={submit} className="login-card">
        <span className="login-icon"><LockKeyhole/></span>
        <p className="eyebrow">ACESSO INTERNO</p>
        <h2>Bem-vinda de volta</h2>
        <p>Entre com seu e-mail autorizado ou com a senha do sistema.</p>
        <input className="sr-only" type="email" name="username" autoComplete="username" value="dmmsb19@gmail.com" readOnly tabIndex={-1}/>
        <label htmlFor="credential">E-mail ou senha</label>
        <div className="credential-field">
          <input id="credential" type={show ? 'text' : 'password'} autoComplete="current-password" value={credential} onChange={event => setCredential(event.target.value)} required autoFocus placeholder="Digite seu acesso"/>
          <button type="button" onClick={() => setShow(value => !value)} aria-label={show ? 'Ocultar acesso' : 'Mostrar acesso'}>{show ? <EyeOff/> : <Eye/>}</button>
        </div>
        <div className="access-hint"><ShieldCheck/><span>Use <strong>dmmsb19@gmail.com</strong> ou sua senha configurada.</span></div>
        {error && <p className="form-error">{error}</p>}
        <button className="login-submit" disabled={loading}>{loading ? 'Validando acesso…' : 'Entrar no workspace'}<ArrowRight/></button>
        <small>DM System Recruit · Versão 2.0 Beta · Sessão segura por 12h</small>
      </form>
    </section>
  </main>
}
