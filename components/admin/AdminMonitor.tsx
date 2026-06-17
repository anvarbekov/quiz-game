// components/admin/AdminMonitor.tsx
'use client'
import { useState, useEffect } from 'react'
import { GameSession, Player } from '@/lib/types'
import { getRankedPlayers, endSession } from '@/lib/gameHelpers'

interface Props {
  session: GameSession
  onEndSession: () => void
}

type Tab = 'monitor' | 'results'

export default function AdminMonitor({ session, onEndSession }: Props) {
  const [totalTimeLeft, setTotalTimeLeft] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [tab, setTab] = useState<Tab>('monitor')
  const rankedPlayers = getRankedPlayers(session.players)
  const totalQ = session.quiz.questions.length
  const finishedCount = rankedPlayers.filter(p => p.finished).length
  const allFinished = rankedPlayers.length > 0 && finishedCount === rankedPlayers.length
  const isFinished = session.status === 'finished'

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

  useEffect(() => {
    if (session.status !== 'active') return
    if (allFinished) { onEndSession(); return }
    if (totalTimeLeft === 0 && session.startedAt && (Date.now() - session.startedAt) > 5000) {
      onEndSession()
    }
  }, [allFinished, totalTimeLeft, session.status])

  // Switch to results tab when game ends
  useEffect(() => {
    if (isFinished) setTab('results')
  }, [isFinished])

  // Sync selected player
  useEffect(() => {
    if (selectedPlayer) {
      const updated = session.players[selectedPlayer.uid]
      if (updated) setSelectedPlayer({ ...updated })
    }
  }, [session.players])

  const totalMin = Math.floor(totalTimeLeft / 60)
  const totalSec = totalTimeLeft % 60
  const timeWarning = totalTimeLeft < 30
  const timePct = session.totalTime > 0 ? (totalTimeLeft / session.totalTime) * 100 : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{session.quiz.title}</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {isFinished ? '✅ O\'yin tugadi' : `${finishedCount}/${rankedPlayers.length} ta o'quvchi tugatdi`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isFinished && (
            <>
              <div className={`px-5 py-3 rounded-2xl border font-display font-black text-3xl tabular-nums ${
                timeWarning ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse' : 'bg-white/5 border-white/10 text-white'
              }`}>
                {totalMin}:{totalSec.toString().padStart(2, '0')}
              </div>
              <button onClick={onEndSession}
                className="px-5 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 font-display font-semibold rounded-2xl transition-all">
                Tugatish
              </button>
            </>
          )}
          {isFinished && (
            <div className="px-5 py-3 bg-green-500/20 border border-green-500/30 rounded-2xl font-display font-bold text-green-300">
              🏁 O'yin yakunlandi
            </div>
          )}
        </div>
      </div>

      {/* Timer bar */}
      {!isFinished && (
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${timeWarning ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-cyan-500'}`}
            style={{ width: `${timePct}%`, transitionDuration: '1s' }} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {(['monitor', 'results'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 font-display font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
              tab === t
                ? 'text-purple-300 border-purple-500 bg-purple-500/10'
                : 'text-white/40 border-transparent hover:text-white/70'
            }`}>
            {t === 'monitor' ? '📊 Monitor' : '📋 Natijalar'}
            {t === 'results' && isFinished && (
              <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Monitor tab */}
      {tab === 'monitor' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Jami o\'yinchilar', value: rankedPlayers.length, icon: '👥' },
              { label: 'Tugatdi', value: finishedCount, icon: '✅' },
              { label: isFinished ? 'Tugataolmadi' : 'Ishlayapti', value: rankedPlayers.length - finishedCount, icon: isFinished ? '❌' : '⏳' },
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
              O'yinchilar <span className="text-white/40 font-normal text-sm">(bosib batafsil ko'ring)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {rankedPlayers.map((player, i) => (
                <PlayerCard key={player.uid} player={player} rank={i + 1} totalQ={totalQ}
                  onClick={() => setSelectedPlayer(player)} />
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="font-display font-bold text-white mb-3">Reyting</h3>
            <div className="space-y-2">
              {rankedPlayers.map((player, i) => (
                <div key={player.uid}
                  className="bg-gradient-card rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all"
                  onClick={() => setSelectedPlayer(player)}>
                  <span className="font-display font-black text-lg w-8 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
                  </span>
                  <span className="text-2xl">{player.avatar}</span>
                  <span className="font-display font-semibold text-white flex-1">{player.username}</span>
                  <div className="text-right">
                    <p className="font-display font-bold text-purple-300">{player.score}</p>
                    <p className="text-white/30 text-xs">{player.currentIndex}/{totalQ} savol</p>
                  </div>
                  {player.finished
                    ? <span className="text-green-400 text-xs font-display">✓ Tugadi</span>
                    : <span className="text-yellow-400 text-xs font-display">⏳</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results tab */}
      {tab === 'results' && (
        <div className="space-y-4">
          <p className="text-white/40 text-sm">Har bir o'quvchining javoblarini ko'rish uchun bosing</p>
          {rankedPlayers.map((player, i) => (
            <div key={player.uid}
              className="bg-gradient-card rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-purple-500/40 transition-all"
              onClick={() => setSelectedPlayer(player)}>
              {/* Player header */}
              <div className="px-5 py-4 flex items-center gap-4">
                <span className="font-display font-black text-2xl w-10 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
                </span>
                <span className="text-3xl">{player.avatar}</span>
                <div className="flex-1">
                  <p className="font-display font-bold text-white">{player.username}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-purple-300 font-display font-bold text-sm">{player.score} ball</span>
                    <span className="text-white/40 text-xs">
                      {player.answers.filter(a => a.isCorrect).length}/{totalQ} to'g'ri
                    </span>
                    <span className="text-white/40 text-xs">
                      {player.answers.length > 0
                        ? Math.round((player.answers.filter(a => a.isCorrect).length / player.answers.length) * 100)
                        : 0}% aniqlik
                    </span>
                  </div>
                </div>
                {/* Mini answer dots */}
                <div className="flex flex-wrap gap-1 max-w-32 justify-end">
                  {player.answers.slice(0, 20).map((a, j) => (
                    <div key={j} className={`w-3 h-3 rounded-full ${a.isCorrect ? 'bg-green-400' : 'bg-red-400'}`}
                      title={`${j+1}-savol: ${a.isCorrect ? "To'g'ri" : "Noto'g'ri"}`} />
                  ))}
                </div>
                <span className="text-white/30 text-lg">›</span>
              </div>

              {/* Progress bar */}
              <div className="px-5 pb-3">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                    style={{ width: `${player.answers.length > 0 ? (player.answers.filter(a => a.isCorrect).length / totalQ) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player detail modal */}
      {selectedPlayer && (
        <PlayerDetailModal player={selectedPlayer} session={session} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  )
}

// ── Player Card ────────────────────────────────────────────
function PlayerCard({ player, rank, totalQ, onClick }: {
  player: Player; rank: number; totalQ: number; onClick: () => void
}) {
  const progressPct = totalQ > 0 ? (player.currentIndex / totalQ) * 100 : 0
  const correctCount = player.answers.filter(a => a.isCorrect).length
  const accuracy = player.answers.length > 0
    ? Math.round((correctCount / player.answers.length) * 100) : 0

  return (
    <div onClick={onClick}
      className={`rounded-2xl p-4 border cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
        player.finished
          ? 'bg-green-500/10 border-green-500/30 hover:border-green-400/50'
          : 'bg-gradient-card border-white/10 hover:border-purple-500/40'
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
      <div className="h-1.5 bg-white/10 rounded-full mb-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${player.finished ? 'bg-green-500' : 'bg-purple-500'}`}
          style={{ width: `${progressPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40">{player.currentIndex}/{totalQ}</span>
        <span className="text-white/40">{accuracy}% ✓</span>
      </div>
      {player.finished && (
        <div className="mt-2 text-center text-green-400 text-xs font-display font-bold">✅ Tugatdi</div>
      )}
    </div>
  )
}

// ── Player Detail Modal ────────────────────────────────────
function PlayerDetailModal({ player, session, onClose }: {
  player: Player; session: GameSession; onClose: () => void
}) {
  const correctCount = player.answers.filter(a => a.isCorrect).length
  const accuracy = player.answers.length > 0
    ? Math.round((correctCount / player.answers.length) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-brand-card border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-4">
          <span className="text-4xl">{player.avatar}</span>
          <div className="flex-1">
            <h3 className="font-display font-bold text-white text-xl">{player.username}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm flex-wrap">
              <span className="text-purple-300 font-display font-bold">{player.score} ball</span>
              <span className="text-white/40">{correctCount}/{session.quiz.questions.length} to'g'ri</span>
              <span className="text-white/40">{accuracy}% aniqlik</span>
              {player.finished
                ? <span className="text-green-400 text-xs">✅ Tugatdi</span>
                : <span className="text-yellow-400 text-xs">⏳ Davom etmoqda</span>
              }
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl transition-colors w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-3 border-b border-white/5">
          <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
            <span>Progress</span>
            <span>{player.currentIndex}/{session.quiz.questions.length} savol ishladi</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${player.finished ? 'bg-green-500' : 'bg-purple-500'}`}
              style={{ width: `${(player.currentIndex / session.quiz.questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Answers */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          <h4 className="font-display font-semibold text-white/60 text-xs uppercase tracking-wider mb-3">
            Javoblar ({player.answers.length} ta)
          </h4>

          {player.answers.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">Hali javob berilmadi</p>
          ) : (
            player.answers.map((answer, i) => {
              const question = session.quiz.questions.find(q => q.id === answer.questionId)
              if (!question) return null
              return (
                <div key={i} className={`rounded-xl p-3.5 border ${
                  answer.isCorrect
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className={`text-lg flex-shrink-0 mt-0.5 ${answer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {answer.isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className="text-white/60 text-xs font-display mb-0.5">{i + 1}-savol</p>
                      <p className="text-white text-sm font-display font-semibold leading-snug">{question.text}</p>
                    </div>
                  </div>
                  <div className="ml-8 space-y-1">
                    {answer.selectedIndex !== null && (
                      <div className={`text-xs px-2 py-1 rounded-lg inline-block ${
                        answer.isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        Tanladi: {['A','B','C','D'][answer.selectedIndex]}) {question.options[answer.selectedIndex]}
                      </div>
                    )}
                    {!answer.isCorrect && (
                      <div className="text-xs px-2 py-1 rounded-lg inline-block bg-green-500/10 text-green-400 ml-1">
                        To'g'ri: {['A','B','C','D'][question.correctIndex]}) {question.options[question.correctIndex]}
                      </div>
                    )}
                    <p className="text-white/30 text-xs mt-1">
                      {answer.pointsEarned} ball • {(answer.timeSpent / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}