// lib/gameHelpers.ts
import {
  doc, collection, setDoc, updateDoc, onSnapshot,
  getDoc, getDocs, deleteDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { GameSession, Quiz, Player, PlayerAnswer, calcTotalTime } from './types'

// ── QUIZ CRUD ──────────────────────────────────────────────
export async function saveQuiz(quiz: Quiz) {
  await setDoc(doc(db, 'quizzes', quiz.id), quiz)
}
export async function getQuizzes(): Promise<Quiz[]> {
  const snap = await getDocs(collection(db, 'quizzes'))
  return snap.docs.map(d => d.data() as Quiz)
}
export async function deleteQuiz(quizId: string) {
  await deleteDoc(doc(db, 'quizzes', quizId))
}

// ── SHUFFLE ────────────────────────────────────────────────
function shuffle(arr: number[]): number[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── SESSION ────────────────────────────────────────────────
export async function createSession(quiz: Quiz, adminUid: string): Promise<string> {
  const sessionId = `session_${Date.now()}`
  const session: GameSession = {
    id: sessionId,
    quizId: quiz.id,
    status: 'waiting',
    totalTime: calcTotalTime(quiz.questions.length),
    startedAt: null,
    finishedAt: null,
    players: {},
    quiz,
    countdownValue: 3,
  }
  await setDoc(doc(db, 'sessions', sessionId), session)
  await setDoc(doc(db, 'activeSession', 'current'), { sessionId, adminUid })
  return sessionId
}

export async function getActiveSessionId(): Promise<string | null> {
  const snap = await getDoc(doc(db, 'activeSession', 'current'))
  if (!snap.exists()) return null
  return snap.data().sessionId
}

export function subscribeSession(sessionId: string, cb: (s: GameSession) => void) {
  return onSnapshot(doc(db, 'sessions', sessionId), snap => {
    if (snap.exists()) cb(snap.data() as GameSession)
  })
}

export async function updateSession(sessionId: string, data: Partial<GameSession>) {
  await updateDoc(doc(db, 'sessions', sessionId), data as any)
}

// ── PLAYER ─────────────────────────────────────────────────
export async function joinSession(sessionId: string, player: Player) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    [`players.${player.uid}`]: player
  })
}

export async function submitPlayerAnswer(
  sessionId: string,
  playerId: string,
  answer: PlayerAnswer,
  newScore: number,
  allAnswers: PlayerAnswer[],
  newIndex: number,
  finished: boolean
) {
  const finishedAt = finished ? Date.now() : null
  await updateDoc(doc(db, 'sessions', sessionId), {
    [`players.${playerId}.answers`]: allAnswers,
    [`players.${playerId}.score`]: newScore,
    [`players.${playerId}.currentIndex`]: newIndex,
    [`players.${playerId}.finished`]: finished,
    ...(finished ? { [`players.${playerId}.finishedAt`]: finishedAt } : {}),
  })
}

export async function finishPlayer(sessionId: string, playerId: string) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    [`players.${playerId}.finished`]: true,
    [`players.${playerId}.finishedAt`]: Date.now(),
  })
}

// ── ADMIN CONTROLS ─────────────────────────────────────────
export async function startCountdown(sessionId: string, quiz: Quiz) {
  // Assign shuffled question order to each player
  const snap = await getDoc(doc(db, 'sessions', sessionId))
  if (!snap.exists()) return
  const session = snap.data() as GameSession
  const indices = quiz.questions.map((_, i) => i)

  const playerUpdates: Record<string, any> = {}
  Object.keys(session.players).forEach(uid => {
    playerUpdates[`players.${uid}.questionOrder`] = shuffle(indices)
    playerUpdates[`players.${uid}.currentIndex`] = 0
    playerUpdates[`players.${uid}.finished`] = false
    playerUpdates[`players.${uid}.finishedAt`] = null
  })

  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'countdown',
    countdownValue: 3,
    ...playerUpdates,
  })

  for (let i = 2; i >= 0; i--) {
    await new Promise(r => setTimeout(r, 1000))
    await updateDoc(doc(db, 'sessions', sessionId), { countdownValue: i })
  }

  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'active',
    startedAt: Date.now(),
  })
}

export async function endSession(sessionId: string) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'finished',
    finishedAt: Date.now(),
  })
}

// ── SCORES ─────────────────────────────────────────────────
export function calculatePoints(
  isCorrect: boolean,
  timeSpentMs: number,
  timeLimitSec: number,
  basePoints: number
): number {
  if (!isCorrect) return 0
  const timeFraction = Math.max(0, 1 - timeSpentMs / (timeLimitSec * 1000))
  return basePoints + Math.floor(timeFraction * basePoints * 0.5)
}

export function getRankedPlayers(players: Record<string, Player>): Player[] {
  return Object.values(players)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }))
}