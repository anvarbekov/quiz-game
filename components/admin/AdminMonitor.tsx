// components/admin/AdminMonitor.tsx
'use client'
import { useState, useEffect } from 'react'
import { GameSession, Player } from '@/lib/types'
import { getRankedPlayers, endSession } from '@/lib/gameHelpers'

interface Props {
  session: GameSession
  onEndSession: () => void
}

export default function AdminMonitor({ session, onEndSession }: Props) {
  const [totalTimeLeft, setTotalTimeLeft] = useState(0)
  const rankedPlayers = getRankedPlayers(session.players)
  const totalQ = session.quiz.questions.length
  const finishedCount = rankedPlayers.filter(p => p.finished).length
  const allFinished = rankedPlayers.length > 0 && finishedCount === rankedPlayers.length

  // Total timer
  useEffect(() => {
    if (session.status !== 'active' || !session.startedAt) return
    const tick = () => {
      const elapsed = Math.floor((Date.now() - session.startedAt!) / 1000)
      setTotalTimeLeft(Math.max(0, session.totalTime - elapsed))
    }
    tick()
    const iv = setInterval(tick, 500)
    return () => clearInterval(iv)
  }, [session.status, session.startedAt])

  // Auto-end when all finished or time runs out
  useEffect(() => {
    if (session.status !== 'active') return
    if (allFinished || totalTimeLeft === 0) {
      onEndSession()
    }
  }, [allFinished, totalTimeLeft, session.status])

  const totalMin = Math.floor(totalTimeLeft / 60)
  const totalSec = totalTimeLeft % 60
  const timeWarning = totalTimeLeft < 30
  const timePct = session.totalTime > 0 ? (totalTimeLeft / session.totalTime) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{session.quiz.title}</h1>
          <p className="text-white/40 text-sm mt-1">
            {finishedCount}/{rankedPlayers.length} ta o'quvchi tugatdi
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Total timer */}
          <div className={`px-5 py-3 rounded-2xl border font-display font-black text-3xl ${
            timeWarning
              ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
              : 'bg-white/5 border-white/10 text-white'
          }`}>
            {totalMin}:{totalSec.toString().padStart(2, '0')}
          </div>
          <button
            onClick={onEndSession}
            className="px-5 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 font-display font-semibold rounded-2xl transition-all"
          >
            O'yinni tugatish
          </button>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${timeWarning ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-cyan-500'}`}
          style={{ width: `${timePct}%`, transitionDuration: '1s' }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Jami o\'yinchilar', value: rankedPlayers.length, icon: '👥' },
          { label: 'Tugatdi', value: finishedCount, icon: '✅' },
          { label: 'Ishlayapti', value: rankedPlayers.length - finishedCount, icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="bg-gradient-card rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-display text-2xl font-bold text-white">{s.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Player cards */}
      <div>
        <h3 className="font-display font-bold text-white mb-3">
          O'yinchilar <span className="text-white/40 font-normal text-sm">(real-time)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {rankedPlayers.map((player, i) => (
            <PlayerCard
              key={player.uid}
              player={player}
              rank={i + 1}
              totalQ={totalQ}
            />
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h3 className="font-display font-bold text-white mb-3">Joriy reyting</h3>
        <div className="space-y-2">
          {rankedPlayers.slice(0, 8).map((player, i) => (
            <div key={player.uid} className="bg-gradient-card rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="font-display font-black text-lg w-8 text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
              </span>
              <span className="text-2xl">{player.avatar}</span>
              <span className="font-display font-semibold text-white flex-1">{player.username}</span>
              <div className="text-right">
                <p className="font-display font-bold text-purple-300">{player.score}</p>
                <p className="text-white/30 text-xs">{player.currentIndex}/{totalQ} savol</p>
              </div>
              {player.finished && <span className="text-green-400 text-xs font-display">✓ Tugadi</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlayerCard({ player, rank, totalQ }: { player: Player; rank: number; totalQ: number }) {
  const answered = player.answers.filter(a => a.isCorrect).length
  const progressPct = totalQ > 0 ? (player.currentIndex / totalQ) * 100 : 0
  const accuracy = player.answers.length > 0
    ? Math.round((player.answers.filter(a => a.isCorrect).length / player.answers.length) * 100)
    : 0

  return (
    <div className={`rounded-2xl p-4 border transition-all ${
      player.finished
        ? 'bg-green-500/10 border-green-500/30'
        : 'bg-gradient-card border-white/10'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-3xl">{player.avatar}</span>
        <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full ${
          rank === 1 ? 'bg-yellow-500/20 text-yellow-300' :
          rank === 2 ? 'bg-gray-400/20 text-gray-300' :
          rank === 3 ? 'bg-amber-600/20 text-amber-400' :
          'bg-white/10 text-white/50'
        }`}>#{rank}</span>
      </div>

      <p className="font-display font-bold text-white text-sm truncate mb-0.5">{player.username}</p>
      <p className="font-display text-purple-300 font-bold text-xl leading-none mb-3">{player.score}</p>

      {/* Progress */}
      <div className="h-1.5 bg-white/10 rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${player.finished ? 'bg-green-500' : 'bg-purple-500'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40">{player.currentIndex}/{totalQ}</span>
        <span className="text-white/40">{accuracy}% ✓</span>
      </div>

      {player.finished && (
        <div className="mt-2 text-center text-green-400 text-xs font-display font-bold">
          ✅ Tugatdi
        </div>
      )}
    </div>
  )
}