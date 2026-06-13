// components/game/WinnersScreen.tsx
'use client'
import { useEffect, useState } from 'react'
import { GameSession } from '@/lib/types'
import { getRankedPlayers } from '@/lib/gameHelpers'

interface Props {
  session: GameSession
  isAdmin: boolean
  onClose: () => void
}

export default function WinnersScreen({ session, isAdmin, onClose }: Props) {
  const ranked = getRankedPlayers(session.players)
  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 300)
  }, [])

  const PODIUM_ORDER = [1, 0, 2] // 2nd, 1st, 3rd
  const PODIUM_HEIGHTS = ['h-24', 'h-36', 'h-16']
  const PODIUM_COLORS = ['bg-gray-400', 'bg-yellow-400', 'bg-amber-600']
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col items-center justify-start py-8 px-4 relative overflow-hidden">
      {/* Confetti-like floating elements */}
      {show && Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none text-2xl star-float"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            opacity: 0.3 + Math.random() * 0.4,
          }}
        >
          {['⭐', '🌟', '✨', '💫', '🎉', '🎊'][Math.floor(Math.random() * 6)]}
        </div>
      ))}

      {/* Header */}
      <div className={`text-center mb-8 transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-6xl mb-3">🏆</div>
        <h1 className="font-display text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500">
          O'YIN TUGADI!
        </h1>
        <p className="text-white/50 mt-2 font-display">{session.quiz.title}</p>
      </div>

      {/* Podium */}
      {top3.length >= 1 && (
        <div className={`flex items-end justify-center gap-4 mb-10 transition-all duration-700 delay-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {PODIUM_ORDER.map((idx) => {
            const player = top3[idx]
            if (!player) return <div key={idx} className="w-28" />
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="text-4xl">{player.avatar}</div>
                <div className="text-center">
                  <p className="font-display font-bold text-white text-sm">{player.username}</p>
                  <p className="font-display font-black text-purple-300">{player.score}</p>
                </div>
                <div className={`w-24 ${PODIUM_HEIGHTS[idx]} ${PODIUM_COLORS[idx]} rounded-t-xl flex items-start justify-center pt-2`}>
                  <span className="font-display font-black text-white text-2xl">{MEDALS[idx]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full rankings */}
      <div className={`w-full max-w-lg space-y-2 transition-all duration-700 delay-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="font-display font-bold text-white/60 text-sm uppercase tracking-wider mb-3 text-center">
          To'liq reyting
        </h2>
        {ranked.map((player, i) => (
          <div
            key={player.uid}
            className="bg-gradient-card rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <span className="font-display font-black text-lg w-8 text-center">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
            </span>
            <span className="text-2xl">{player.avatar}</span>
            <span className="font-display font-semibold text-white flex-1">{player.username}</span>
            <div className="text-right">
              <p className="font-display font-bold text-purple-300">{player.score} ball</p>
              <p className="text-white/30 text-xs">
                {player.answers.filter(a => a.isCorrect).length}/{session.quiz.questions.length} to'g'ri
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="mt-8 px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white font-display font-bold text-lg rounded-2xl transition-all glow-purple"
      >
        {isAdmin ? '← Boshqaruv paneliga' : '← Bosh sahifaga'}
      </button>
    </div>
  )
}
