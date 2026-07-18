'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronDown, ClipboardCheck, GraduationCap, History, Languages, LayoutDashboard, LogOut, Menu, Moon, Palette, Rocket, Search, Settings, Sparkles, Sun, UserCircle, UserPlus, Users, UsersRound, X } from 'lucide-react'
import { Dashboard } from './dashboard'
import { ModuleView } from './module-view'
import { ProfileView } from './profile-view'
import { cn } from '@/lib/utils'
import { defaultProfile, type Profile } from '@/lib/profile'

const nav = [
  ['dashboard', LayoutDashboard, 'Dashboard', 'Dashboard'],
  ['employees', Users, 'Funcionários', 'Employees'],
  ['onboarding', UserPlus, 'Onboarding', 'Onboarding'],
  ['performance', ClipboardCheck, 'Avaliações', 'Reviews'],
  ['attendance', CalendarDays, 'Escalas & Presença', 'Shift & Attendance'],
  ['recruitment', BriefcaseBusiness, 'Recrutamento', 'Recruitment'],
  ['training', GraduationCap, 'Treinamentos', 'Training'],
] as const

const titles: Record<string, [string, string]> = {
  ...Object.fromEntries(nav.map(item => [item[0], [item[2], item[3]]])),
  profile: ['Meu Perfil', 'My Profile'],
}

export function AppShell({ section }: { section: string }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [lang, setLang] = useState<'pt' | 'en'>('pt')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [profileMenu, setProfileMenu] = useState(false)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [profile, setProfile] = useState<Profile>(defaultProfile)

  useEffect(() => {
    const saved = localStorage.getItem('dm-lang')
    if (saved === 'en') setLang('en')
    fetch('/api/profile', { cache: 'no-store' }).then(response => response.json()).then(body => {
      if (!body.profile) return
      const loaded = { ...defaultProfile, ...body.profile }
      setProfile(loaded)
      document.documentElement.style.setProperty('--accent', loaded.accent_color)
      if (!saved && loaded.language) setLang(loaded.language)
    }).catch(() => undefined)
  }, [])

  function toggleLang() {
    const next = lang === 'pt' ? 'en' : 'pt'
    setLang(next)
    localStorage.setItem('dm-lang', next)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const title = titles[section]?.[lang === 'pt' ? 0 : 1] || titles.dashboard[0]
  const initials = profile.display_name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase()

  return <div className="app-frame">
    <aside className={cn('sidebar', open && 'sidebar-open')}>
      <div className="sidebar-head">
        <Link href="/" className="logo"><span>{profile.logo_url ? <img src={profile.logo_url} alt=""/> : <UsersRound/>}</span><b>DM <em>Recruit</em><small>2.0 BETA</small></b></Link>
        <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Fechar menu"><X/></button>
      </div>
      <p className="nav-label">{lang === 'pt' ? 'ESPAÇO DE TRABALHO' : 'WORKSPACE'}</p>
      <nav>{nav.map(([slug, Icon, pt, en]) => <Link key={slug} href={slug === 'dashboard' ? '/' : `/${slug}`} className={cn('nav-item', section === slug && 'active')} onClick={() => setOpen(false)}><Icon/><span>{lang === 'pt' ? pt : en}</span>{slug === 'recruitment' && <i className="nav-live"/>}</Link>)}</nav>
      <div className="sidebar-foot">
        <button className="upgrade-card" onClick={() => setReleaseOpen(true)}><span><Sparkles/></span><div><small>VERSÃO ATUAL</small><strong>2.0 Beta</strong><p>{lang === 'pt' ? 'Ver novidades' : 'See what is new'}</p></div><Rocket/></button>
        <button onClick={logout} className="logout"><LogOut/>{lang === 'pt' ? 'Encerrar sessão' : 'Sign out'}</button>
      </div>
    </aside>
    {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Fechar menu"/>}

    <section className="workspace">
      <header className="topbar">
        <div className="title-wrap"><button className="menu-button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu/></button><div><span>{lang === 'pt' ? 'WORKSPACE / VISÃO GERAL' : 'WORKSPACE / OVERVIEW'}</span><h1>{title}</h1></div></div>
        <div className="top-actions">
          <label className="search"><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={lang === 'pt' ? 'Buscar nesta página…' : 'Search this page…'}/><kbd>⌘ K</kbd></label>
          <button onClick={toggleLang} title="Language"><Languages/><span>{lang.toUpperCase()}</span></button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Theme">{theme === 'dark' ? <Sun/> : <Moon/>}</button>
          <button className="notification" title="Notifications" onClick={() => setReleaseOpen(true)}><Bell/><i>1</i></button>
          <div className="profile-control">
            <button className="profile-trigger" onClick={() => setProfileMenu(value => !value)} aria-expanded={profileMenu}>
              <span className="user-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt=""/> : initials}</span>
              <span><strong>{profile.display_name}</strong><small>{profile.job_title}</small></span><ChevronDown/>
            </button>
            {profileMenu && <div className="profile-popover">
              <header><span className="user-avatar large">{profile.avatar_url ? <img src={profile.avatar_url} alt=""/> : initials}</span><div><strong>{profile.display_name}</strong><small>{profile.professional_email}</small></div></header>
              <Link href="/profile" onClick={() => setProfileMenu(false)}><UserCircle/><span><b>{lang === 'pt' ? 'Meu perfil' : 'My profile'}</b><small>{lang === 'pt' ? 'Identidade e assinatura' : 'Identity and signature'}</small></span></Link>
              <Link href="/profile" onClick={() => setProfileMenu(false)}><Palette/><span><b>{lang === 'pt' ? 'Aparência' : 'Appearance'}</b><small>{lang === 'pt' ? 'Tema, cor e marca' : 'Theme, color and brand'}</small></span></Link>
              <Link href="/profile" onClick={() => setProfileMenu(false)}><Settings/><span><b>{lang === 'pt' ? 'Acesso e segurança' : 'Access & security'}</b><small>{lang === 'pt' ? 'Alterar e-mail ou senha' : 'Change email or password'}</small></span></Link>
              <button onClick={logout}><LogOut/><span><b>{lang === 'pt' ? 'Sair' : 'Sign out'}</b></span></button>
            </div>}
          </div>
        </div>
      </header>
      <main className="page-content">{section === 'dashboard' ? <Dashboard lang={lang}/> : section === 'profile' ? <ProfileView lang={lang} onProfileChange={setProfile}/> : <ModuleView section={section} lang={lang} search={query}/>}</main>
    </section>

    <button className="release-fab" onClick={() => setReleaseOpen(true)}><span><History/></span><div><small>UPDATE LOG</small><strong>v2.0 Beta</strong></div><i/></button>
    {releaseOpen && <div className="release-overlay" onMouseDown={event => event.target === event.currentTarget && setReleaseOpen(false)}><aside className="release-panel"><header><div><span><Rocket/> RELEASE NOTES</span><h2>DM Recruit 2.0 Beta</h2><p>16 de julho de 2026</p></div><button onClick={() => setReleaseOpen(false)}><X/></button></header><div className="release-body"><section className="release-feature"><Sparkles/><div><b>NOVA EXPERIÊNCIA</b><h3>Seu workspace evoluiu.</h3><p>Interface refinada, mais contexto visual, animações otimizadas e navegação mais clara.</p></div></section>{['Login por e-mail exclusivo ou senha','Perfil profissional 100% personalizável','Foto e logotipo por upload ou URL','Tema, idioma, fuso e cor de destaque','Assinatura automática pronta para exportar','Dashboard e HUD visual aprimorados'].map(item => <p className="release-item" key={item}><CheckCircle2/>{item}</p>)}</div></aside></div>}
  </div>
}
