// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

async function getAdminToken(): Promise<string> {
  const { GoogleAuth } = await import('google-auth-library')
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token as string
}

export async function POST(req: NextRequest) {
  try {
    const { username, password, role, avatar } = await req.json()
    if (!username || !password || !role || !avatar) {
      return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 })
    }

    const email = `${username.trim().toLowerCase()}@quiz.uz`
    const token = await getAdminToken()

    // Create user via Firebase Auth REST API
    const createRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName: username }),
      }
    )

    const createData = await createRes.json()
    if (!createRes.ok) {
      if (createData.error?.message === 'EMAIL_EXISTS') {
        return NextResponse.json({ error: 'Bu username allaqachon mavjud' }, { status: 409 })
      }
      throw new Error(createData.error?.message || 'User yaratishda xato')
    }

    const uid = createData.localId

    // Save to Firestore via REST API
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            username: { stringValue: username.trim() },
            role: { stringValue: role },
            avatar: { stringValue: avatar },
          }
        }),
      }
    )

    return NextResponse.json({ success: true, uid })
  } catch (err: any) {
    console.error('create-user error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}