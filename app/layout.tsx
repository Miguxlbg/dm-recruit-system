import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets:['latin'], display:'swap' })
export const metadata: Metadata = { title:'DM System Recruit 2.0 Beta | Gestão de RH', description:'Cockpit completo de recrutamento, gestão de pessoas e performance' }
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR" suppressHydrationWarning><body className={inter.className}><Providers>{children}</Providers></body></html> }
