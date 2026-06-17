import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ error: "UID kerak" }, { status: 400 });

    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!;
    const PRIVATE_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
      /\\n/g,
      "\n",
    );

    const token = await getServiceAccountToken(CLIENT_EMAIL, PRIVATE_KEY);

    // Delete from Firebase Auth
    await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts/${uid}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );

    // Delete from Firestore
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("delete-user:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function getServiceAccountToken(
  clientEmail: string,
  privateKey: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const header = { alg: "RS256", typ: "JWT" };
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  const signingInput = `${encode(header)}.${encode(payload)}`;

  const pemContents = privateKey.replace(
    /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g,
    "",
  );
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const jwt = `${signingInput}.${btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  )
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}
