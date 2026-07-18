import { AppShell } from '@/components/app-shell'
export default async function ProtectedPage({params}:{params:Promise<{section?:string[]}>}){ const resolved=await params; return <AppShell section={resolved.section?.[0]||'dashboard'}/> }
