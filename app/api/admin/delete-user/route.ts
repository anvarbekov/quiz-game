import { NextRequest, NextResponse } from 'next/server'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

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
    const { uid } = await req.json()
    if (!uid) return NextResponse.json({ error: 'UID kerak' }, { status: 400 })
    const token = await getAdminToken()

    await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts/${uid}`,
      { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
    )
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
    )
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
