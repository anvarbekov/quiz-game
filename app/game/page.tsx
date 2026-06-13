// app/game/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import {
  getActiveSessionId, subscribeSession, joinSession,
  submitPlayerAnswer, calculatePoints, getRankedPlayers, finishPlayer
} from '@/lib/gameHelpers'
import { GameSession, Player, PlayerAnswer, AVATARS, calcTotalTime } from '@/lib/types'
import WinnersScreen from '@/components/game/WinnersScreen'

export default function GamePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const [session, setSession] = useState<GameSession | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)

  // Per-question state
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  // Timer
  const [totalTimeLeft, setTotalTimeLeft] = useState(0)

  const prevIndexRef = useRef(-1)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role === 'admin') { router.push('/admin'); return }
  }, [user])

  // Find active session
  useEffect(() => {
    if (!user) return
    async function find() {
      const sid = await getActiveSessionId()
      if (sid) setSessionId(sid)
    }
    find()
    const iv = setInterval(find, 3000)
    return () => clearInterval(iv)
  }, [user])

  useEffect(() => {
    if (!sessionId) return
    return subscribeSession(sessionId, setSession)
  }, [sessionId])

  // Join
  useEffect(() => {
    if (!session || !user || joined) return
    if (session.status === 'finished') return
    const player: Player = {
      uid: user.uid,
      username: user.username,
      avatar: user.avatar || AVATARS[0],
      score: 0,
      answers: [],
      questionOrder: [],
      currentIndex: 0,
      finished: false,
      finishedAt: null,
      isOnline: true,
      joinedAt: Date.now(),
    }
    joinSession(sessionId!, player).then(() => setJoined(true))
  }, [session?.id, user, joined])

  // Total timer
  useEffect(() => {
    if (!session || session.status !== 'active' || !session.startedAt) return
    const tick = () => {
      const elapsed = Math.floor((Date.now() - session.startedAt!) / 1000)
      const left = Math.max(0, session.totalTime - elapsed)
      setTotalTimeLeft(left)
      // Auto-finish when time runs out
      if (left === 0 && sessionId && user) {
        finishPlayer(sessionId, user.uid)
      }
    }
    tick()
    const iv = setInterval(tick, 500)
    return () => clearInterval(iv)
  }, [session?.status, session?.startedAt])

  // Reset per-question state when player moves to next question
  const myPlayer = session?.players[user?.uid || '']
  const myCurrentIndex = myPlayer?.currentIndex ?? 0

  useEffect(() => {
    if (myCurrentIndex !== prevIndexRef.current) {
      setSelected(null)
      setAnswered(false)
      setQuestionStartTime(Date.now())
      prevIndexRef.current = myCurrentIndex
    }
  }, [myCurrentIndex])

  async function handleAnswer(optionIndex: number) {
    if (answered || !session || !user || !sessionId || !myPlayer) return
    if (session.status !== 'active') return
    if (myPlayer.finished) return

    setSelected(optionIndex)
    setAnswered(true)

    const order = myPlayer.questionOrder
    const qIdx = order[myCurrentIndex]
    const q = session.quiz.questions[qIdx]
    const timeSpent = Date.now() - questionStartTime
    const isCorrect = optionIndex === q.correctIndex
    const pts = calculatePoints(isCorrect, timeSpent, q.timeLimit, q.points)

    const newAnswer: PlayerAnswer = {
      questionId: q.id,
      selectedIndex: optionIndex,
      isCorrect,
      timeSpent,
      pointsEarned: pts,
    }
    const allAnswers = [...(myPlayer.answers || []), newAnswer]
    const newScore = (myPlayer.score || 0) + pts
    const nextIndex = myCurrentIndex + 1
    const isFinished = nextIndex >= order.length

    // Move to next question immediately
    await submitPlayerAnswer(sessionId, user.uid, newAnswer, newScore, allAnswers, nextIndex, isFinished)
  }

  async function handleFinish() {
    if (!sessionId || !user || !myPlayer) return
    await finishPlayer(sessionId, user.uid)
  }

  if (!user) return null

  if (!session) return <WaitingScreen username={user.username} avatar={user.avatar} />
  if (session.status === 'finished') {
    return <WinnersScreen session={session} isAdmin={false} onClose={() => router.push('/login')} />
  }

  const totalQ = session.quiz.questions.length
  const order = myPlayer?.questionOrder || []
  const qIdx = order[myCurrentIndex] ?? 0
  const currentQ = session.quiz.questions[qIdx]
  const isFinished = myPlayer?.finished === true && (myPlayer?.questionOrder?.length || 0) > 0
  const progressPct = totalQ > 0 ? (myCurrentIndex / totalQ) * 100 : 0
  const totalMin = Math.floor(totalTimeLeft / 60)
  const totalSec = totalTimeLeft % 60
  const timeWarning = totalTimeLeft < 30

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-brand-card/40 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">{user.avatar}</span>
          <span className="font-display font-bold text-white text-sm">{user.username}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Total timer */}
          {session.status === 'active' && (
            <div className={`px-3 py-1.5 rounded-xl border font-display font-bold text-sm ${
              timeWarning
                ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
                : 'bg-white/5 border-white/10 text-white'
            }`}>
              ⏱ {totalMin}:{totalSec.toString().padStart(2, '0')}
            </div>
          )}
          {myPlayer && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-1.5">
              <span className="font-display font-bold text-purple-300 text-sm">{myPlayer.score} ball</span>
            </div>
          )}
          <button onClick={() => signOut().then(() => router.push('/login'))} className="text-white/30 hover:text-white text-xs ml-1">
            Chiqish
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-5 max-w-2xl mx-auto w-full">

        {/* Waiting */}
        {session.status === 'waiting' && (
          <div className="text-center space-y-4">
            <div className="text-6xl animate-bounce">⏳</div>
            <h1 className="font-display text-2xl font-bold text-white">O'yin boshlanishini kuting</h1>
            <p className="text-white/40">{session.quiz.title}</p>
          </div>
        )}

        {/* Countdown */}
        {session.status === 'countdown' && (
          <div className="text-center">
            <div className="font-display text-9xl font-black text-white count-pulse" key={session.countdownValue}>
              {session.countdownValue === 0 ? '🚀' : session.countdownValue}
            </div>
            <p className="text-white/60 text-xl mt-4 font-display">Tayyor bo'ling!</p>
          </div>
        )}

        {/* Finished (player done, waiting for session end) */}
        {session.status === 'active' && isFinished && (
          <div className="text-center space-y-5 w-full">
            <div className="text-6xl">🎉</div>
            <h1 className="font-display text-3xl font-bold text-white">Barakalla!</h1>
            <p className="text-white/50">Barcha savollarni tugatdingiz</p>
            <div className="bg-gradient-card rounded-2xl p-6 inline-block">
              <p className="font-display text-5xl font-black text-purple-300">{myPlayer?.score}</p>
              <p className="text-white/40 text-sm mt-1">to'g'ri javob</p>
            </div>
            <p className="text-white/30 text-sm animate-pulse">Boshqalar tugatishini kuting...</p>
          </div>
        )}

        {/* Active question */}
        {session.status === 'active' && !isFinished && currentQ && (
          <div className="w-full space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="text-white/40 font-display text-sm whitespace-nowrap">
                {myCurrentIndex + 1}/{totalQ}
              </span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="bg-gradient-card rounded-2xl p-6 text-center">
              <p className="font-display text-xl font-bold text-white leading-relaxed">{currentQ.text}</p>
              <p className="text-white/30 text-sm mt-2">{currentQ.points} ball</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = selected === i
                const isCorrect = i === currentQ.correctIndex
                const COLORS = [
                  'from-purple-700 to-purple-600 border-purple-400',
                  'from-cyan-700 to-cyan-600 border-cyan-400',
                  'from-yellow-700 to-yellow-600 border-yellow-400',
                  'from-pink-700 to-pink-600 border-pink-400',
                ]
                let cls = ''
                if (answered) {
                  if (isCorrect) cls = 'bg-green-600 border-green-400 glow-green scale-[1.02]'
                  else if (isSelected) cls = 'bg-red-700/60 border-red-500 opacity-80'
                  else cls = 'bg-white/3 border-white/5 opacity-40'
                } else if (isSelected) {
                  cls = `bg-gradient-to-br ${COLORS[i]} border-2 glow-purple`
                } else {
                  cls = 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer'
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={answered}
                    className={`option-btn p-4 rounded-2xl text-left border transition-all ${cls}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display font-black text-sm w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 text-white/50 flex-shrink-0">
                        {['A','B','C','D'][i]}
                      </span>
                      <span className="font-display font-semibold text-white text-sm flex-1">{opt}</span>
                      {answered && isCorrect && <span className="text-green-200">✓</span>}
                      {answered && isSelected && !isCorrect && <span className="text-red-300">✗</span>}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Feedback */}
            {answered ? (
              <div className={`text-center py-3 rounded-2xl font-display font-bold text-sm ${
                selected === currentQ.correctIndex
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {selected === currentQ.correctIndex ? '🎉 To\'g\'ri! Keyingi savol...' : '❌ Noto\'g\'ri. Keyingi savol...'}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-white/30 text-sm">Javobni tanlang...</p>
                {myCurrentIndex > 0 && (
                  <button
                    onClick={handleFinish}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white font-display text-sm rounded-xl transition-all"
                  >
                    Tugatish →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function WaitingScreen({ username, avatar }: { username: string; avatar: string }) {
  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">{avatar || '🎯'}</div>
        <h1 className="font-display text-2xl font-bold text-white">Salom, {username}!</h1>
        <p className="text-white/50">O'qituvchi o'yinni boshlashini kuting...</p>
        <div className="flex items-center justify-center gap-2">
          {[0, 150, 300].map(d => (
            <span key={d} className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}