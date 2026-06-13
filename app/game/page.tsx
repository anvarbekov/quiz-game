// app/game/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import {
  getActiveSessionId, subscribeSession, joinSession,
  submitPlayerAnswer, calculatePoints, getRankedPlayers
} from '@/lib/gameHelpers'
import { GameSession, Player, PlayerAnswer, AVATARS } from '@/lib/types'
import WinnersScreen from '@/components/game/WinnersScreen'

export default function GamePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const [session, setSession] = useState<GameSession | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [joined, setJoined] = useState(false)
  const prevQuestionRef = useRef<number>(-1)
  const prevStatusRef = useRef<string>('')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role === 'admin') { router.push('/admin'); return }
  }, [user])

  // Find active session
  useEffect(() => {
    if (!user) return
    async function findSession() {
      const sid = await getActiveSessionId()
      if (sid) setSessionId(sid)
    }
    findSession()
    const interval = setInterval(findSession, 3000)
    return () => clearInterval(interval)
  }, [user])

  // Subscribe to session
  useEffect(() => {
    if (!sessionId) return
    const unsub = subscribeSession(sessionId, setSession)
    return unsub
  }, [sessionId])

  // Join session when available
  useEffect(() => {
    if (!session || !user || joined) return
    if (session.status === 'finished') return
    const player: Player = {
      uid: user.uid,
      username: user.username,
      avatar: user.avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)],
      score: 0,
      answers: [],
      isOnline: true,
      joinedAt: Date.now(),
    }
    joinSession(sessionId!, player).then(() => setJoined(true))
  }, [session?.id, user, joined])

  // Reset answer state on new question
  useEffect(() => {
    if (!session) return
    const qIdx = session.currentQuestionIndex
    const status = session.status

    if (status === 'question' && (qIdx !== prevQuestionRef.current || prevStatusRef.current !== 'question')) {
      setSelected(null)
      setAnswered(false)
      prevQuestionRef.current = qIdx
    }
    prevStatusRef.current = status
  }, [session?.currentQuestionIndex, session?.status])

  // Timer
  useEffect(() => {
    if (!session || session.status !== 'question' || !session.questionStartTime) return
    const q = session.quiz.questions[session.currentQuestionIndex]
    const tick = () => {
      const left = Math.max(0, q.timeLimit - Math.floor((Date.now() - session.questionStartTime!) / 1000))
      setTimeLeft(left)
    }
    tick()
    const interval = setInterval(tick, 300)
    return () => clearInterval(interval)
  }, [session?.questionStartTime, session?.status, session?.currentQuestionIndex])

  async function handleAnswer(optionIndex: number) {
    if (answered || !session || !user || !sessionId) return
    if (session.status !== 'question') return

    setSelected(optionIndex)
    setAnswered(true)

    const q = session.quiz.questions[session.currentQuestionIndex]
    const timeSpent = Date.now() - (session.questionStartTime || Date.now())
    const isCorrect = optionIndex === q.correctIndex
    const pts = calculatePoints(isCorrect, timeSpent, q.timeLimit, q.points)

    const myPlayer = session.players[user.uid]
    const prevAnswers: PlayerAnswer[] = myPlayer?.answers || []
    const newAnswer: PlayerAnswer = {
      questionId: q.id,
      selectedIndex: optionIndex,
      isCorrect,
      timeSpent,
      pointsEarned: pts,
    }
    await submitPlayerAnswer(sessionId, user.uid, newAnswer, (myPlayer?.score || 0) + pts, [...prevAnswers, newAnswer])
  }

  if (!user) return null

  if (!session || (session.status === 'finished' && !joined)) {
    return <WaitingScreen username={user.username} avatar={user.avatar} />
  }

  if (session.status === 'finished') {
    return <WinnersScreen session={session} isAdmin={false} onClose={() => router.push('/login')} />
  }

  const myPlayer = joined ? session.players[user.uid] : null
  const rankedPlayers = getRankedPlayers(session.players)
  const myRank = rankedPlayers.findIndex(p => p.uid === user.uid) + 1

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col">
      {/* Top bar */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-brand-card/40 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xl">{user.avatar || '🎯'}</span>
          <span className="font-display font-bold text-white text-sm">{user.username}</span>
        </div>
        <div className="flex items-center gap-3">
          {myPlayer && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-1">
              <span className="font-display font-bold text-purple-300 text-sm">{myPlayer.score} ball</span>
            </div>
          )}
          {myRank > 0 && (
            <div className="bg-white/5 rounded-xl px-3 py-1">
              <span className="text-white/50 text-sm">#{myRank}</span>
            </div>
          )}
          <button onClick={() => signOut().then(() => router.push('/login'))} className="text-white/30 hover:text-white text-xs">
            Chiqish
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6 max-w-2xl mx-auto w-full">

        {/* Waiting */}
        {session.status === 'waiting' && (
          <div className="text-center space-y-4">
            <div className="text-6xl animate-bounce">⏳</div>
            <h1 className="font-display text-2xl font-bold text-white">O'yin boshlanishini kuting</h1>
            <p className="text-white/40">{session.quiz.title}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {Object.values(session.players).map(p => (
                <div key={p.uid} className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5">
                  <span>{p.avatar}</span>
                  <span className="text-white/70 text-sm font-display">{p.username}</span>
                </div>
              ))}
            </div>
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

        {/* Question */}
        {(session.status === 'question' || session.status === 'answer_reveal') && (() => {
          const q = session.quiz.questions[session.currentQuestionIndex]
          const isReveal = session.status === 'answer_reveal'

          // Option styles — only colored when selected or revealing
          const OPTION_BASE = [
            { selected: 'from-purple-700 to-purple-600 border-purple-400', neutral: 'bg-white/5 border-white/10' },
            { selected: 'from-cyan-700 to-cyan-600 border-cyan-400', neutral: 'bg-white/5 border-white/10' },
            { selected: 'from-yellow-700 to-yellow-600 border-yellow-400', neutral: 'bg-white/5 border-white/10' },
            { selected: 'from-pink-700 to-pink-600 border-pink-400', neutral: 'bg-white/5 border-white/10' },
          ]

          return (
            <div className="w-full space-y-4">
              {/* Progress + timer */}
              <div className="flex items-center gap-3">
                <span className="text-white/40 font-display text-sm whitespace-nowrap">
                  {session.currentQuestionIndex + 1}/{session.quiz.questions.length}
                </span>
                <div className="flex-1 h-2 bg-white/10 rounded-full">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${((session.currentQuestionIndex + 1) / session.quiz.questions.length) * 100}%` }}
                  />
                </div>
                {!isReveal && (
                  <span className={`font-display font-bold text-lg w-8 text-right ${
                    timeLeft > 10 ? 'text-green-400' : timeLeft > 5 ? 'text-yellow-400' : 'text-red-400 animate-pulse'
                  }`}>{timeLeft}</span>
                )}
              </div>

              {/* Question */}
              <div className="bg-gradient-card rounded-2xl p-6 text-center">
                <p className="font-display text-xl font-bold text-white leading-relaxed">{q.text}</p>
                <p className="text-white/40 text-sm mt-2">{q.points} ball • {q.timeLimit} sek</p>
              </div>

              {/* Options — neutral until user taps */}
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex
                  const isSelected = selected === i
                  let cls = ''

                  if (isReveal) {
                    if (isCorrect) cls = 'bg-green-600 border-green-400 scale-[1.02] glow-green'
                    else if (isSelected) cls = 'bg-red-700/60 border-red-500 opacity-80'
                    else cls = 'bg-white/3 border-white/5 opacity-40'
                  } else if (isSelected) {
                    cls = `bg-gradient-to-br ${OPTION_BASE[i].selected} border-2 glow-purple`
                  } else {
                    // Neutral — no color until tapped
                    cls = `${OPTION_BASE[i].neutral} border ${!answered ? 'hover:bg-white/10 cursor-pointer' : 'opacity-60'}`
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={answered || isReveal}
                      className={`option-btn p-4 rounded-2xl text-left transition-all border ${cls}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-display font-black text-sm w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0 ${
                          isSelected && !isReveal ? 'bg-white/20 text-white' :
                          isReveal && isCorrect ? 'bg-white/20 text-white' :
                          'bg-white/10 text-white/40'
                        }`}>
                          {['A','B','C','D'][i]}
                        </span>
                        <span className="font-display font-semibold text-white text-sm flex-1">{opt}</span>
                        {isReveal && isCorrect && <span className="text-green-200 text-lg flex-shrink-0">✓</span>}
                        {isReveal && isSelected && !isCorrect && <span className="text-red-300 text-lg flex-shrink-0">✗</span>}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Feedback */}
              {answered && !isReveal && (
                <div className={`text-center py-3 rounded-2xl font-display font-bold ${
                  selected === q.correctIndex
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {selected === q.correctIndex ? '🎉 To\'g\'ri! Keyingi savol kutilmoqda...' : '❌ Noto\'g\'ri. Keyingi savol kutilmoqda...'}
                </div>
              )}
              {!answered && !isReveal && (
                <p className="text-center text-white/30 text-sm">Javobni tanlang...</p>
              )}

              {/* Reveal feedback */}
              {isReveal && (
                <div className="text-center py-2 text-white/40 text-sm font-display animate-pulse">
                  Keyingi savolga o'tilmoqda...
                </div>
              )}
            </div>
          )
        })()}

        {/* Leaderboard */}
        {session.status === 'leaderboard' && (
          <div className="w-full space-y-3">
            <h2 className="font-display text-2xl font-bold text-center text-white">🏆 Reyting</h2>
            <div className="space-y-2">
              {rankedPlayers.slice(0, 10).map((player, i) => (
                <div
                  key={player.uid}
                  className={`rounded-xl px-4 py-3 flex items-center gap-3 transition-all ${
                    player.uid === user.uid
                      ? 'bg-purple-600/30 border border-purple-500/50'
                      : 'bg-gradient-card'
                  }`}
                >
                  <span className="font-display font-black text-lg w-8 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
                  </span>
                  <span className="text-2xl">{player.avatar}</span>
                  <span className="font-display font-semibold text-white flex-1">
                    {player.username}
                    {player.uid === user.uid && <span className="text-purple-400 text-xs ml-2">(Sen)</span>}
                  </span>
                  <span className="font-display font-bold text-purple-300">{player.score}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-white/30 text-sm animate-pulse">Keyingi savol kelmoqda...</p>
          </div>
        )}
      </main>
    </div>
  )
}

function WaitingScreen({ username, avatar }: { username: string, avatar: string }) {
  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">{avatar || '🎯'}</div>
        <h1 className="font-display text-2xl font-bold text-white">Salom, {username}!</h1>
        <p className="text-white/50">O'qituvchi o'yinni boshlashini kuting...</p>
        <div className="flex items-center justify-center gap-2 text-white/30">
          <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}