import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets:['latin'], display:'swap' })
export const metadata: Metadata = { title:'DM System Recruit | Gestão de RH', description:'Sistema interno completo de recrutamento e gestão de pessoas' }
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR" suppressHydrationWarning><body className={inter.className}><Providers>{children}</Providers></body></html> }
