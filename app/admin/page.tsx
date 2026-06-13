// app/admin/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import {
  getQuizzes, saveQuiz, deleteQuiz, createSession,
  startCountdown, endSession, subscribeSession, getActiveSessionId
} from '@/lib/gameHelpers'
import { Quiz, GameSession } from '@/lib/types'
import QuizEditor from '@/components/admin/QuizEditor'
import AdminLobby from '@/components/admin/AdminLobby'
import AdminMonitor from '@/components/admin/AdminMonitor'
import WinnersScreen from '@/components/game/WinnersScreen'
import UsersManager from '@/components/admin/UsersManager'
import QuizImporter from '@/components/admin/QuizImporter'

type AdminView = 'dashboard' | 'create-quiz' | 'lobby' | 'monitor' | 'winners' | 'users' | 'import'

export default function AdminPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [view, setView] = useState<AdminView>('dashboard')
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [activeSession, setActiveSession] = useState<GameSession | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/game')
    if (!user) router.push('/login')
  }, [user])

  useEffect(() => {
    if (!user) return
    getQuizzes().then(setQuizzes)
  }, [user])

  useEffect(() => {
    if (!user) return
    getActiveSessionId().then(sid => { if (sid) setSessionId(sid) })
  }, [user])

  useEffect(() => {
    if (!sessionId) return
    return subscribeSession(sessionId, (s) => {
      setActiveSession(s)
      if (s.status === 'waiting' || s.status === 'countdown') setView('lobby')
      else if (s.status === 'finished') setView('winners')
      else if (s.status === 'active') setView('monitor')
    })
  }, [sessionId])

  async function handleStartGame(quiz: Quiz) {
    const sid = await createSession(quiz, user!.uid)
    setSessionId(sid)
    setView('lobby')
  }

  async function handleSaveQuiz(quiz: Quiz) {
    await saveQuiz(quiz)
    setQuizzes(await getQuizzes())
    setView('dashboard')
    setEditingQuiz(null)
  }

  async function handleDeleteQuiz(quizId: string) {
    if (!confirm('Bu viktorinani o\'chirishni tasdiqlaysizmi?')) return
    await deleteQuiz(quizId)
    setQuizzes(prev => prev.filter(q => q.id !== quizId))
  }

  if (!user) return null

  const NAV = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: '🏠' },
    { id: 'users', label: 'Foydalanuvchilar', icon: '👥' },
    { id: 'import', label: 'Fayl yuklash', icon: '📂' },
  ]

  return (
    <div className="min-h-screen bg-gradient-game">
      <header className="border-b border-white/5 bg-brand-card/50 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <span className="font-display font-bold text-white text-lg">
              Quiz<span className="text-purple-400">Battle</span>
              <span className="ml-2 text-xs text-white/40 font-normal">Admin</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(item => (
              <button key={item.id} onClick={() => setView(item.id as AdminView)}
                className={`px-4 py-2 rounded-xl font-display text-sm font-semibold transition-all ${
                  view === item.id ? 'bg-purple-600/30 text-purple-300' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {activeSession && activeSession.status === 'active' && (
            <button onClick={() => setView('monitor')}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1 hover:bg-green-500/20 transition-all">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-display">Faol o'yin</span>
            </button>
          )}
          <button onClick={() => signOut().then(() => router.push('/login'))} className="text-white/40 hover:text-white text-sm transition-colors">
            Chiqish
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">

        {view === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-white mb-1">Boshqaruv paneli</h1>
              <p className="text-white/40">Viktorinalarni boshqaring va o'yin boshlang</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Viktorinalar', value: quizzes.length, icon: '📚' },
                { label: 'Jami savollar', value: quizzes.reduce((a, q) => a + q.questions.length, 0), icon: '❓' },
                { label: 'Faol o\'yin', value: activeSession && activeSession.status === 'active' ? 1 : 0, icon: '🎮' },
                { label: 'Ishtirokchilar', value: activeSession ? Object.keys(activeSession.players).length : 0, icon: '👥' },
              ].map(stat => (
                <div key={stat.label} className="bg-gradient-card rounded-2xl p-5">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="font-display text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/40 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {activeSession && activeSession.status === 'active' && (
              <div className="bg-gradient-to-r from-green-600/20 to-cyan-600/20 border border-green-500/30 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-white">Faol o'yin: {activeSession.quiz.title}</p>
                  <p className="text-white/50 text-sm mt-1">
                    {Object.values(activeSession.players).filter(p => p.finished).length}/
                    {Object.keys(activeSession.players).length} ta tugatdi
                  </p>
                </div>
                <button onClick={() => setView('monitor')} className="bg-green-500 hover:bg-green-400 text-white font-display font-bold px-5 py-2.5 rounded-xl transition-all">
                  Monitorga →
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="font-display text-xl font-bold text-white">Viktorinalar</h2>
                <div className="flex gap-2">
                  <button onClick={() => setView('import')}
                    className="bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-400 font-display font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
                    📂 Fayl yuklash
                  </button>
                  <button onClick={() => { setEditingQuiz(null); setView('create-quiz') }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-display font-semibold px-5 py-2.5 rounded-xl transition-all">
                    + Yangi viktorina
                  </button>
                </div>
              </div>

              {quizzes.length === 0 ? (
                <div className="bg-gradient-card rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">📝</div>
                  <p className="text-white/40 font-display">Hali viktorina yo'q</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quizzes.map(quiz => (
                    <div key={quiz.id} className="bg-gradient-card rounded-2xl p-5 hover:border-purple-500/50 transition-all border border-transparent">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-display font-bold text-white">{quiz.title}</h3>
                          <p className="text-white/40 text-sm mt-0.5">{quiz.subject}</p>
                        </div>
                        <span className="bg-purple-500/20 text-purple-300 text-xs font-display px-2 py-1 rounded-lg">
                          {quiz.questions.length} savol
                        </span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleStartGame(quiz)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-display font-semibold py-2 rounded-xl text-sm transition-all">
                          ▶ Boshlash
                        </button>
                        <button onClick={() => { setEditingQuiz(quiz); setView('create-quiz') }} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all text-sm">✏️</button>
                        <button onClick={() => handleDeleteQuiz(quiz.id)} className="px-3 py-2 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-xl transition-all text-sm">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'users' && <UsersManager />}

        {view === 'import' && (
          <div className="space-y-6">
            <button onClick={() => setView('dashboard')} className="text-white/40 hover:text-white transition-colors">← Orqaga</button>
            <QuizImporter onImported={async () => setQuizzes(await getQuizzes())} />
          </div>
        )}

        {view === 'create-quiz' && (
          <QuizEditor quiz={editingQuiz} onSave={handleSaveQuiz} onCancel={() => { setView('dashboard'); setEditingQuiz(null) }} />
        )}

        {view === 'lobby' && activeSession && sessionId && (
          <AdminLobby
            session={activeSession}
            onStart={() => startCountdown(sessionId, activeSession.quiz)}
            onEnd={() => { endSession(sessionId); setView('dashboard') }}
          />
        )}

        {view === 'monitor' && activeSession && sessionId && (
          <AdminMonitor
            session={activeSession}
            onEndSession={() => { endSession(sessionId) }}
          />
        )}

        {view === 'winners' && activeSession && (
          <WinnersScreen
            session={activeSession}
            isAdmin
            onClose={() => { setView('dashboard'); setSessionId(null); setActiveSession(null) }}
          />
        )}
      </main>
    </div>
  )
}