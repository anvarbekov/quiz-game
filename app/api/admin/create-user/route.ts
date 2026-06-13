// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { username, password, role, avatar } = await req.json()

    if (!username || !password || !role || !avatar) {
      return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 })
    }

    const app = getAdminApp()
    const auth = getAuth(app)
    const db = getFirestore(app)

    const email = `${username.trim().toLowerCase()}@quiz.uz`

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    })

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      username: username.trim(),
      role,
      avatar,
    })

    return NextResponse.json({ success: true, uid: userRecord.uid })
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Bu username allaqachon mavjud' }, { status: 409 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
