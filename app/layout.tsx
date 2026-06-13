// app/layout.tsx
import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/authContext'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'QuizBattle — Bilim Musobaqasi',
  description: 'Maktab o\'quvchilari uchun real-time viktorina o\'yini',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-brand-dark text-white font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
