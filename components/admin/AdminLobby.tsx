// components/admin/AdminLobby.tsx
'use client'
import { GameSession } from '@/lib/types'

interface Props {
  session: GameSession
  onStart: () => void
  onEnd: () => void
}

export default function AdminLobby({ session, onStart, onEnd }: Props) {
  const players = Object.values(session.players)
  const isCountdown = session.status === 'countdown'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          O'yinchilar kutmoqda
        </h1>
        <p className="text-white/40 text-lg">{session.quiz.title}</p>
      </div>

      {/* Countdown overlay */}
      {isCountdown && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50">
          <div className="text-center">
            <div className="font-display text-9xl font-black text-white count-pulse glow-purple" key={session.countdownValue}>
              {session.countdownValue === 0 ? '🚀' : session.countdownValue}
            </div>
            <p className="text-white/60 text-2xl mt-4 font-display">
              {session.countdownValue === 0 ? 'O\'yin boshlandi!' : 'Tayyor bo\'ling...'}
            </p>
          </div>
        </div>
      )}

      {/* Session code */}
      <div className="bg-gradient-card rounded-2xl p-6 text-center glow-purple">
        <p className="text-white/40 text-sm font-display uppercase tracking-widest mb-2">Sessiya ID</p>
        <p className="font-display text-2xl font-bold text-purple-300 select-all">{session.id}</p>
        <p className="text-white/30 text-xs mt-2">O'quvchilar avtomatik ulanadi</p>
      </div>

      {/* Players grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white">
            Ulangan o'yinchilar
            <span className="ml-3 text-purple-400">{players.length}</span>
          </h2>
        </div>

        {players.length === 0 ? (
          <div className="bg-gradient-card rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4 animate-bounce">⏳</div>
            <p className="text-white/40 font-display text-lg">O'quvchilar ulanishini kuting...</p>
            <p className="text-white/20 text-sm mt-2">Ular quizgame.vercel.app ga kirib loginlarini kirishsin</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {players.map(player => (
              <div
                key={player.uid}
                className="bg-gradient-card rounded-2xl p-3 text-center player-card animate-slide-up"
              >
                <div className="text-3xl mb-1">{player.avatar}</div>
                <p className="font-display text-white text-xs font-semibold truncate">{player.username}</p>
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1.5 animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onEnd}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 font-display rounded-xl transition-all"
        >
          Bekor qilish
        </button>
        <button
          onClick={onStart}
          disabled={players.length === 0 || isCountdown}
          className="px-10 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400
            text-white font-display font-bold text-xl rounded-2xl transition-all
            disabled:opacity-50 disabled:cursor-not-allowed glow-green"
        >
          {isCountdown ? '🚀 Boshlanmoqda...' : `▶ O'yinni boshlash (${players.length} ta o'yinchi)`}
        </button>
      </div>
    </div>
  )
}
