// lib/types.ts

export interface Question {
  id: string
  text: string
  options: string[]
  correctIndex: number
  timeLimit: number // seconds
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

export interface Player {
  uid: string
  username: string
  avatar: string // emoji avatar
  score: number
  answers: PlayerAnswer[]
  rank?: number
  isOnline: boolean
  joinedAt: number
}

export interface PlayerAnswer {
  questionId: string
  selectedIndex: number | null
  isCorrect: boolean
  timeSpent: number // ms
  pointsEarned: number
}

export interface GameSession {
  id: string
  quizId: string
  status: 'waiting' | 'countdown' | 'question' | 'answer_reveal' | 'leaderboard' | 'finished'
  currentQuestionIndex: number
  questionStartTime: number | null
  players: Record<string, Player>
  quiz: Quiz
  startedAt: number | null
  finishedAt: number | null
  countdownValue: number
}

export interface User {
  uid: string
  username: string
  role: 'admin' | 'player'
  avatar: string
}

export const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🦋', '🐸', '🦄', '🐙', '🦅', '🐬', '🌟', '🔥', '⚡', '🎯', '🚀']
