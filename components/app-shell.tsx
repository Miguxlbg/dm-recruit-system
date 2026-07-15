'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, UserPlus, ClipboardCheck, CalendarDays, BriefcaseBusiness, GraduationCap, Search, Bell, Sun, Moon, Languages, LogOut, Menu, X, UsersRound } from 'lucide-react'
import { Dashboard } from './dashboard'
import { ModuleView } from './module-view'
import { cn } from '@/lib/utils'

const nav = [
  ['dashboard',LayoutDashboard,'Dashboard','Dashboard'],['employees',Users,'Funcionários','Employees'],['onboarding',UserPlus,'Onboarding','Onboarding'],['performance',ClipboardCheck,'Avaliações','Reviews'],['attendance',CalendarDays,'Escalas & Presença','Shift & Attendance'],['recruitment',BriefcaseBusiness,'Recrutamento','Recruitment'],['training',GraduationCap,'Treinamentos','Training']
] as const
const titles:Record<string,[string,string]>=Object.fromEntries(nav.map(n=>[n[0],[n[2],n[3]]]))
export function AppShell({section}:{section:string}){
 const router=useRouter(); const {theme,setTheme}=useTheme(); const [lang,setLang]=useState<'pt'|'en'>('pt'); const [open,setOpen]=useState(false); const [query,setQuery]=useState('');
 useEffect(()=>{const saved=localStorage.getItem('dm-lang');if(saved==='en')setLang('en')},[])
 function toggleLang(){const next=lang==='pt'?'en':'pt';setLang(next);localStorage.setItem('dm-lang',next)}
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.push('/login');router.refresh()}
 const title=titles[section]?.[lang==='pt'?0:1]||titles.dashboard[0]
 return <div className="app-frame">
  <aside className={cn('sidebar',open&&'sidebar-open')}><div className="sidebar-head"><Link href="/" className="logo"><span><UsersRound/></span><b>DM <em>System Recruit</em></b></Link><button className="mobile-close" onClick={()=>setOpen(false)} aria-label="Fechar menu"><X/></button></div><p className="nav-label">{lang==='pt'?'NAVEGAÇÃO':'NAVIGATION'}</p><nav>{nav.map(([slug,Icon,pt,en])=><Link key={slug} href={slug==='dashboard'?'/':`/${slug}`} className={cn('nav-item',section===slug&&'active')} onClick={()=>setOpen(false)}><Icon/><span>{lang==='pt'?pt:en}</span></Link>)}</nav><div className="sidebar-foot"><div className="privacy-card"><span>DM</span><div><strong>{lang==='pt'?'Ambiente privado':'Private workspace'}</strong><small>{lang==='pt'?'Dados protegidos':'Protected HR data'}</small></div></div><button onClick={logout} className="logout"><LogOut/>{lang==='pt'?'Sair':'Sign out'}</button></div></aside>
  {open&&<button className="backdrop" onClick={()=>setOpen(false)} aria-label="Fechar menu"/>}
  <section className="workspace"><header className="topbar"><div className="title-wrap"><button className="menu-button" onClick={()=>setOpen(true)} aria-label="Abrir menu"><Menu/></button><div><span>{lang==='pt'?'VISÃO GERAL':'OVERVIEW'}</span><h1>{title}</h1></div></div><div className="top-actions"><label className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={lang==='pt'?'Buscar nesta página…':'Search this page…'}/></label><button onClick={toggleLang} title="Language"><Languages/><span>{lang.toUpperCase()}</span></button><button onClick={()=>setTheme(theme==='dark'?'light':'dark')} title="Theme">{theme==='dark'?<Sun/>:<Moon/>}</button><button className="notification" title="Notifications"><Bell/><i>0</i></button><span className="user-avatar">DS</span></div></header>
  <main className="page-content">{section==='dashboard'?<Dashboard lang={lang}/>:<ModuleView section={section} lang={lang} search={query}/>}</main></section>
 </div>
}
