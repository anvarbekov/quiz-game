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
  const [phase, setPhase] = useState(0)
  // phase 0: blank, 1: show 3rd, 2: show 2nd, 3: show 1st, 4: show all + confetti

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1100),
      setTimeout(() => setPhase(3), 1900),
      setTimeout(() => setPhase(4), 2800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  const totalQ = session.quiz.questions.length

  // Podium order: [2nd, 1st, 3rd]
  const podiumSlots = [
    { player: top3[1], rank: 2, height: 'h-28', color: 'from-slate-400 to-slate-500', glow: 'shadow-slate-400/40', medal: '🥈', showAt: 2, labelColor: 'text-slate-200' },
    { player: top3[0], rank: 1, height: 'h-44', color: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-400/60', medal: '🥇', showAt: 3, labelColor: 'text-yellow-200' },
    { player: top3[2], rank: 3, height: 'h-20', color: 'from-amber-600 to-amber-700', glow: 'shadow-amber-600/40', medal: '🥉', showAt: 1, labelColor: 'text-amber-200' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start py-8 px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.3) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(6,182,212,0.2) 0%, transparent 50%), #0D0D1A' }}>

      {/* Confetti particles */}
      {phase >= 4 && <Confetti />}

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className={`text-center mb-10 transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="text-7xl mb-3 animate-bounce">🏆</div>
        <h1 className="font-display text-6xl font-black tracking-tight"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24, #FDE68A, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          O'YIN TUGADI!
        </h1>
        <p className="text-white/40 mt-2 font-display text-lg">{session.quiz.title}</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 mb-12 w-full max-w-lg">
        {podiumSlots.map((slot, si) => (
          <div key={si} className="flex flex-col items-center gap-3 flex-1">
            {/* Player info above podium */}
            <div className={`text-center transition-all duration-700 ${phase >= slot.showAt ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
              style={{ transitionDelay: `${slot.showAt * 100}ms` }}>
              {slot.player ? (
                <>
                  {/* Crown for 1st */}
                  {slot.rank === 1 && (
                    <div className="text-3xl mb-1 animate-bounce">👑</div>
                  )}
                  {/* Avatar with glow */}
                  <div className={`relative w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-4xl
                    bg-gradient-to-br ${slot.color} shadow-xl ${slot.glow}
                    ${slot.rank === 1 ? 'w-20 h-20 text-5xl ring-4 ring-yellow-400/50' : ''}`}>
                    {slot.player.avatar}
                  </div>
                  <p className={`font-display font-bold text-sm ${slot.rank === 1 ? 'text-white text-base' : 'text-white/80'}`}>
                    {slot.player.username}
                  </p>
                  <p className={`font-display font-black text-xl ${slot.labelColor}`}>
                    {slot.player.score}
                    <span className="text-xs font-normal text-white/40 ml-1">ball</span>
                  </p>
                </>
              ) : (
                <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center text-white/20 text-2xl mb-2">—</div>
              )}
            </div>

            {/* Podium block */}
            <div className={`w-full ${slot.height} rounded-t-2xl relative overflow-hidden
              bg-gradient-to-b ${slot.color} shadow-2xl ${slot.glow}
              transition-all duration-700
              ${phase >= slot.showAt ? 'opacity-100' : 'opacity-0'}
              `}
              style={{
                transitionDelay: `${slot.showAt * 150}ms`,
                transform: phase >= slot.showAt ? 'scaleY(1)' : 'scaleY(0)',
                transformOrigin: 'bottom',
              }}>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              {/* Medal */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-2xl">{slot.medal}</div>
              {/* Rank number */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-display font-black text-white/50 text-3xl">
                {slot.rank}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full leaderboard */}
      <div className={`w-full max-w-lg space-y-2 transition-all duration-700 ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="font-display font-bold text-white/50 text-xs uppercase tracking-widest text-center mb-4">
          To'liq reyting
        </h2>
        {ranked.map((player, i) => (
          <div key={player.uid}
            className={`rounded-2xl px-5 py-3.5 flex items-center gap-4 transition-all
              ${i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30' :
                i === 1 ? 'bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20' :
                i === 2 ? 'bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-600/20' :
                'bg-white/5 border border-white/5'}`}>
            <span className="font-display font-black text-xl w-8 text-center">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
            </span>
            <span className="text-3xl">{player.avatar}</span>
            <span className="font-display font-bold text-white flex-1">{player.username}</span>
            <div className="text-right">
              <p className={`font-display font-black text-lg ${i === 0 ? 'text-yellow-300' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-500' : 'text-purple-300'}`}>
                {player.score} ball
              </p>
              <p className="text-white/30 text-xs">
                {player.answers.filter(a => a.isCorrect).length}/{totalQ} to'g'ri
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className={`mt-10 px-12 py-4 font-display font-black text-lg text-white rounded-2xl transition-all
          bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400
          shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105
          ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
        {isAdmin ? '← Boshqaruv paneliga' : '← Bosh sahifaga'}
      </button>
    </div>
  )
}

// ── Confetti ───────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2 + Math.random() * 3}s`,
    color: ['#F59E0B', '#7C3AED', '#06B6D4', '#EC4899', '#10B981', '#FBBF24'][i % 6],
    size: 6 + Math.random() * 8,
    shape: i % 3 === 0 ? 'rounded-full' : i % 3 === 1 ? 'rounded-sm rotate-45' : '',
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map(p => (
        <div
          key={p.id}
          className={`absolute ${p.shape}`}
          style={{
            left: p.left,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `fall ${p.duration} ${p.delay} linear infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}