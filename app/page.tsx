// app/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) router.push('/login')
    else if (user.role === 'admin') router.push('/admin')
    else router.push('/game')
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 font-display">Yuklanmoqda...</p>
      </div>
    </div>
  )
}
