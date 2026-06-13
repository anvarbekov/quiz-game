// app/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'

export default function LoginPage() {
  const { signIn, user } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(username.trim(), password)
      // redirect handled by page.tsx on user change
    } catch (err: any) {
      setError('Login yoki parol noto\'g\'ri. Qaytadan urinib ko\'ring.')
    } finally {
      setLoading(false)
    }
  }

  // redirect if already logged in
  if (user) {
    if (user.role === 'admin') router.push('/admin')
    else router.push('/game')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating stars */}
      {['⭐','🌟','✨','💫','⭐'].map((s, i) => (
        <span
          key={i}
          className="star-float absolute text-2xl pointer-events-none select-none"
          style={{
            top: `${[15, 70, 30, 80, 50][i]}%`,
            left: `${[5, 90, 85, 8, 50][i]}%`,
            animationDelay: `${i * 0.6}s`,
            opacity: 0.4,
          }}
        >{s}</span>
      ))}

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 border-glow">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            Quiz<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Battle</span>
          </h1>
          <p className="text-white/50 text-sm">Bilim musobaqasiga kirish</p>
        </div>

        {/* Card */}
        <div className="bg-gradient-card rounded-2xl p-8 glow-purple">
          <h2 className="font-display text-xl font-semibold text-white mb-6 text-center">
            Tizimga kirish
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2 font-display">Foydalanuvchi nomi</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="login"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/8 transition-all font-body"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2 font-display">Parol</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all font-body"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-display font-bold text-white text-lg
                bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all glow-purple active:scale-95"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kirish...
                </span>
              ) : 'Kirish →'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Login va parolni o'qituvchingizdan oling
        </p>
      </div>
    </div>
  )
}
