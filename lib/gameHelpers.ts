// lib/gameHelpers.ts
import {
  doc, collection, setDoc, updateDoc, onSnapshot,
  serverTimestamp, getDoc, getDocs, query, where, deleteDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { GameSession, Quiz, Player, PlayerAnswer } from './types'

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

// ── GAME SESSION ───────────────────────────────────────────
export async function createSession(quiz: Quiz, adminUid: string): Promise<string> {
  const sessionId = `session_${Date.now()}`
  const session: GameSession = {
    id: sessionId,
    quizId: quiz.id,
    status: 'waiting',
    currentQuestionIndex: 0,
    questionStartTime: null,
    players: {},
    quiz,
    startedAt: null,
    finishedAt: null,
    countdownValue: 3,
  }
  await setDoc(doc(db, 'sessions', sessionId), session)
  // store active session id
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

export async function submitAnswer(
  sessionId: string,
  playerId: string,
  answer: PlayerAnswer,
  newScore: number
) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    [`players.${playerId}.answers`]: answer,
    [`players.${playerId}.score`]: newScore,
  })
}

export async function submitPlayerAnswer(
  sessionId: string,
  playerId: string,
  answer: PlayerAnswer,
  newScore: number,
  allAnswers: PlayerAnswer[]
) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    [`players.${playerId}.answers`]: allAnswers,
    [`players.${playerId}.score`]: newScore,
  })
}

// ── ADMIN CONTROLS ─────────────────────────────────────────
export async function startCountdown(sessionId: string) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'countdown',
    startedAt: Date.now(),
    countdownValue: 3,
  })
  // count 3-2-1 then start first question
  for (let i = 2; i >= 0; i--) {
    await new Promise(r => setTimeout(r, 1000))
    await updateDoc(doc(db, 'sessions', sessionId), { countdownValue: i })
  }
  await showQuestion(sessionId, 0)
}

export async function showQuestion(sessionId: string, index: number) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    status: 'question',
    currentQuestionIndex: index,
    questionStartTime: Date.now(),
  })
}

export async function revealAnswer(sessionId: string) {
  await updateDoc(doc(db, 'sessions', sessionId), { status: 'answer_reveal' })
}

export async function showLeaderboard(sessionId: string) {
  await updateDoc(doc(db, 'sessions', sessionId), { status: 'leaderboard' })
}

export async function nextQuestion(sessionId: string, currentIndex: number, totalQuestions: number) {
  const next = currentIndex + 1
  if (next >= totalQuestions) {
    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'finished',
      finishedAt: Date.now(),
    })
  } else {
    await showQuestion(sessionId, next)
  }
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
  const bonus = Math.floor(timeFraction * basePoints * 0.5)
  return basePoints + bonus
}

export function getRankedPlayers(players: Record<string, Player>): Player[] {
  return Object.values(players)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }))
}
