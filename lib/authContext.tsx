// lib/authContext.tsx
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { User } from './types'

interface AuthCtx {
  user: User | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)

// Predefined accounts stored in Firestore under /users/{uid}
// Admin logs in with email: admin@quiz.uz, password: admin123
// Players log in with username → mapped to email: {username}@quiz.uz

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        if (snap.exists()) setUser(snap.data() as User)
        else setUser(null)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signIn(username: string, password: string) {
    const email = username.includes('@') ? username : `${username}@quiz.uz`
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (snap.exists()) setUser(snap.data() as User)
  }

  async function signOut() {
    await fbSignOut(auth)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
