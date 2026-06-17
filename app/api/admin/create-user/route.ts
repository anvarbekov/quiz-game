import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { username, password, role, avatar } = await req.json();
    if (!username || !password || !role || !avatar) {
      return NextResponse.json(
        { error: "Barcha maydonlar to'ldirilishi shart" },
        { status: 400 },
      );
    }

    const email = `${username.trim().toLowerCase()}@quiz.uz`;
    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!;
    const PRIVATE_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
      /\\n/g,
      "\n",
    );

    // Get OAuth token using JWT
    const token = await getServiceAccountToken(CLIENT_EMAIL, PRIVATE_KEY);

    // Create Firebase Auth user
    const createRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, displayName: username }),
      },
    );

    const createData = await createRes.json();
    if (!createRes.ok) {
      const msg = createData.error?.message || "Xato";
      if (msg === "EMAIL_EXISTS") {
        return NextResponse.json(
          { error: "Bu username allaqachon mavjud" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const uid = createData.localId;

    // Save to Firestore
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            username: { stringValue: username.trim() },
            role: { stringValue: role },
            avatar: { stringValue: avatar },
          },
        }),
      },
    );

    return NextResponse.json({ success: true, uid });
  } catch (err: any) {
    console.error("create-user:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// JWT-based service account token (Edge compatible)
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

  // Import private key
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

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}
