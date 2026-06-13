// lib/types.ts

export interface Question {
  id: string
  text: string
  options: string[]
  correctIndex: number
  timeLimit: number
  points: number
}

export interface Quiz {
  id: string
  title: string
  subject: string
  questions: Question[]
  createdAt: number
  createdBy: string
}

export interface PlayerAnswer {
  questionId: string
  selectedIndex: number | null
  isCorrect: boolean
  timeSpent: number
  pointsEarned: number
}

export interface Player {
  uid: string
  username: string
  avatar: string
  score: number
  answers: PlayerAnswer[]
  questionOrder: number[]   // aralash savol tartibi (indekslar)
  currentIndex: number      // o'quvchi hozir qaysi savolda
  finished: boolean         // tugatganmi
  finishedAt: number | null
  rank?: number
  isOnline: boolean
  joinedAt: number
}

export interface GameSession {
  id: string
  quizId: string
  status: 'waiting' | 'countdown' | 'active' | 'finished'
  totalTime: number         // umumiy vaqt (soniya)
  startedAt: number | null
  finishedAt: number | null
  players: Record<string, Player>
  quiz: Quiz
  countdownValue: number
}

export interface User {
  uid: string
  username: string
  role: 'admin' | 'player'
  avatar: string
}

export const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🦋', '🐸', '🦄', '🐙', '🦅', '🐬', '🌟', '🔥', '⚡', '🎯', '🚀']

// Savollar soniga qarab umumiy vaqt (har savol uchun o'rtacha 25 sek + 10 sek zaxira)
export function calcTotalTime(questionCount: number): number {
  return questionCount * 25 + 10
}