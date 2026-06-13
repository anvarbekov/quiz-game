// components/admin/AdminMonitor.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { GameSession, Player, Question } from '@/lib/types'
import { getRankedPlayers, nextQuestion, revealAnswer, showLeaderboard } from '@/lib/gameHelpers'

interface Props {
  session: GameSession
  onRevealAnswer: () => void
  onShowLeaderboard: () => void
  onNextQuestion: () => void
  onEndSession: () => void
}

export default function AdminMonitor({ session, onRevealAnswer, onShowLeaderboard, onNextQuestion, onEndSession }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const autoAdvanceRef = useRef(false)
  const rankedPlayers = getRankedPlayers(session.players)
  const q = session.quiz.questions[session.currentQuestionIndex]
  const isLast = session.currentQuestionIndex >= session.quiz.questions.length - 1
  const totalPlayers = rankedPlayers.length

  // Timer
  useEffect(() => {
    if (session.status !== 'question' || !session.questionStartTime) return
    autoAdvanceRef.current = false
    const interval = setInterval(() => {
      const e = Math.floor((Date.now() - session.questionStartTime!) / 1000)
      setElapsed(e)
    }, 500)
    return () => clearInterval(interval)
  }, [session.questionStartTime, session.status])

  // Reset elapsed on new question
  useEffect(() => {
    setElapsed(0)
    autoAdvanceRef.current = false
  }, [session.currentQuestionIndex])

  // Auto-advance: when time runs out OR all players answered
  useEffect(() => {
    if (session.status !== 'question' || autoAdvanceRef.current) return
    const timeLeft = Math.max(0, q.timeLimit - elapsed)
    const answeredCount = rankedPlayers.filter(p => p.answers.some(a => a.questionId === q.id)).length
    const allAnswered = totalPlayers > 0 && answeredCount >= totalPlayers

    if (timeLeft === 0 || allAnswered) {
      autoAdvanceRef.current = true
      onRevealAnswer()
    }
  }, [elapsed, session.status, rankedPlayers])

  // Auto-advance from answer_reveal → leaderboard after 3s
  useEffect(() => {
    if (session.status !== 'answer_reveal') return
    const t = setTimeout(() => onShowLeaderboard(), 3000)
    return () => clearTimeout(t)
  }, [session.status])

  // Auto-advance from leaderboard → next question after 4s
  useEffect(() => {
    if (session.status !== 'leaderboard') return
    const t = setTimeout(() => onNextQuestion(), 4000)
    return () => clearTimeout(t)
  }, [session.status, session.currentQuestionIndex])

  const timeLeft = Math.max(0, q.timeLimit - elapsed)
  const timerPct = (timeLeft / q.timeLimit) * 100
  const timerColor = timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'

  // Count answers per option
  const optionCounts = [0, 0, 0, 0]
  rankedPlayers.forEach(p => {
    const ans = p.answers.find(a => a.questionId === q.id)
    if (ans && ans.selectedIndex !== null) optionCounts[ans.selectedIndex]++
  })

  const answeredCount = rankedPlayers.filter(p => p.answers.some(a => a.questionId === q.id)).length

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`px-3 py-1.5 rounded-full text-sm font-display font-semibold ${
          session.status === 'question' ? 'bg-green-500/20 text-green-300' :
          session.status === 'answer_reveal' ? 'bg-yellow-500/20 text-yellow-300' :
          'bg-purple-500/20 text-purple-300'
        }`}>
          {session.status === 'question' ? '⏱ Javob kutilmoqda' :
           session.status === 'answer_reveal' ? '✅ Javob ko\'rsatildi — 3s...' :
           '🏆 Reyting — 4s...'}
        </span>
        <span className="text-white/40 text-sm">
          Savol {session.currentQuestionIndex + 1}/{session.quiz.questions.length}
        </span>
        <span className="text-white/40 text-sm">
          {answeredCount}/{totalPlayers} javob berdi
        </span>
        <button
          onClick={onEndSession}
          className="ml-auto px-4 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 font-display text-sm rounded-xl border border-red-500/30 transition-all"
        >
          To'xtat
        </button>
      </div>

      {/* Question card */}
      <div className="bg-gradient-card rounded-2xl p-5">
        <h2 className="font-display text-xl font-bold text-white mb-4">{q.text}</h2>

        {/* Timer */}
        {session.status === 'question' && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${timerColor} rounded-full transition-all`}
                style={{ width: `${timerPct}%`, transitionDuration: '1s' }}
              />
            </div>
            <span className={`font-display font-black text-2xl w-10 text-right ${
              timeLeft > 10 ? 'text-green-400' : timeLeft > 5 ? 'text-yellow-400' : 'text-red-400 animate-pulse'
            }`}>{timeLeft}</span>
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-2 gap-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIndex
            const pct = totalPlayers ? Math.round((optionCounts[i] / totalPlayers) * 100) : 0
            const colors = ['border-purple-500/40 bg-purple-500/10', 'border-cyan-500/40 bg-cyan-500/10', 'border-yellow-500/40 bg-yellow-500/10', 'border-pink-500/40 bg-pink-500/10']
            return (
              <div key={i} className={`rounded-xl p-3 border relative overflow-hidden ${
                session.status === 'answer_reveal' && isCorrect
                  ? 'border-green-500/70 bg-green-500/20'
                  : colors[i]
              }`}>
                <div className="absolute inset-y-0 left-0 bg-white/10 rounded-xl" style={{ width: `${pct}%` }} />
                <div className="relative flex items-center gap-2">
                  <span className="font-display font-bold text-white/50 text-xs w-5">{['A','B','C','D'][i]}</span>
                  <span className="text-white text-sm flex-1 truncate">{opt}</span>
                  <span className="font-display font-bold text-white/70 text-sm">{optionCounts[i]}</span>
                  {session.status === 'answer_reveal' && isCorrect && <span className="text-green-400">✓</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Player cards grid */}
      <div>
        <h3 className="font-display font-bold text-white mb-3">
          O'yinchilar
          <span className="text-white/40 font-normal text-sm ml-2">(real-time)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {rankedPlayers.map((player, i) => {
            const answered = player.answers.find(a => a.questionId === q.id)
            const isCorrect = answered?.isCorrect
            const totalCorrect = player.answers.filter(a => a.isCorrect).length
            const accuracy = player.answers.length > 0
              ? Math.round((totalCorrect / player.answers.length) * 100)
              : 0

            return (
              <PlayerCard
                key={player.uid}
                player={player}
                rank={i + 1}
                answered={!!answered}
                isCorrect={isCorrect}
                accuracy={accuracy}
                currentQuestion={session.currentQuestionIndex}
                totalQuestions={session.quiz.questions.length}
                status={session.status}
              />
            )
          })}
        </div>
      </div>

      {/* Leaderboard top 5 */}
      <div>
        <h3 className="font-display font-bold text-white mb-3">Top reyting</h3>
        <div className="space-y-2">
          {rankedPlayers.slice(0, 5).map((player, i) => (
            <div key={player.uid} className="bg-gradient-card rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="font-display font-black text-lg w-8 text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
              </span>
              <span className="text-2xl">{player.avatar}</span>
              <span className="font-display font-semibold text-white flex-1">{player.username}</span>
              <span className="font-display font-bold text-purple-300 text-lg">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Player Card Component ──────────────────────────────────────
interface PlayerCardProps {
  player: Player
  rank: number
  answered: boolean
  isCorrect: boolean | undefined
  accuracy: number
  currentQuestion: number
  totalQuestions: number
  status: string
}

function PlayerCard({ player, rank, answered, isCorrect, accuracy, currentQuestion, totalQuestions, status }: PlayerCardProps) {
  const progressPct = (currentQuestion / totalQuestions) * 100

  let statusBg = 'bg-white/5 border-white/10'
  let statusIcon = '⏳'
  let statusText = 'Javob bermoqda...'

  if (answered) {
    if (isCorrect) {
      statusBg = 'bg-green-500/10 border-green-500/30'
      statusIcon = '✅'
      statusText = "To'g'ri!"
    } else {
      statusBg = 'bg-red-500/10 border-red-500/30'
      statusIcon = '❌'
      statusText = "Noto'g'ri"
    }
  }

  if (status === 'leaderboard' || status === 'answer_reveal') {
    statusIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
    statusText = `${player.score} ball`
    statusBg = rank <= 3 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'
  }

  return (
    <div className={`rounded-2xl p-4 border transition-all ${statusBg}`}>
      {/* Avatar + rank */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-3xl">{player.avatar}</span>
        <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full ${
          rank === 1 ? 'bg-yellow-500/20 text-yellow-300' :
          rank === 2 ? 'bg-gray-400/20 text-gray-300' :
          rank === 3 ? 'bg-amber-600/20 text-amber-400' :
          'bg-white/10 text-white/50'
        }`}>
          #{rank}
        </span>
      </div>

      {/* Name */}
      <p className="font-display font-bold text-white text-sm truncate mb-1">{player.username}</p>

      {/* Score */}
      <p className="font-display text-purple-300 font-bold text-lg leading-none mb-2">{player.score}</p>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full mb-2">
        <div
          className="h-full bg-purple-500 rounded-full transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{accuracy}% to'g'ri</span>
        <span className="text-lg">{statusIcon}</span>
      </div>

      {/* Status text */}
      <p className="text-xs text-white/50 mt-1 truncate">{statusText}</p>
    </div>
  )
}