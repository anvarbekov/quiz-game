# 🎯 QuizBattle — Real-time Viktorina O'yini

Maktab o'quvchilari uchun zamonaviy real-time musobaqa platformasi.

## 🚀 Texnologiyalar
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Firebase (Firestore real-time + Authentication)
- **Deploy:** Vercel

---

## ⚙️ O'rnatish

### 1. Firebase loyihasini yarating

1. [console.firebase.google.com](https://console.firebase.google.com) ga kiring
2. "Add project" → loyiha nomi kiriting
3. **Authentication** → "Get started" → "Email/Password" yoqing
4. **Firestore Database** → "Create database" → "Production mode" → Region: `europe-west3`
5. **Project Settings** → "Your apps" → Web app qo'shing → Config ni nusxalang

### 2. Loyihani klonlang

```bash
git clone <your-repo>
cd quiz-game
npm install
```

### 3. Environment variables

`.env.example` ni `.env.local` ga ko'chiring va Firebase config ni to'ldiring:

```bash
cp .env.example .env.local
# Keyin .env.local ni tahrirlang
```

### 4. Firestore rules

Firebase Console → Firestore → Rules ga `firestore.rules` dagi matnni joylashtiring.

### 5. Foydalanuvchilarni yarating

```bash
npm install firebase-admin
# Firebase Console → Project Settings → Service Accounts → Generate key
# Yuklab olingan JSON ni serviceAccountKey.json deb saqlang
node setup-users.js
```

`setup-users.js` faylida o'quvchilar ro'yxatini o'zingizga moslashtiring.

### 6. Ishga tushirish

```bash
npm run dev
# → http://localhost:3000
```

---

## 🌐 Vercel ga deploy qilish

1. GitHub ga push qiling
2. [vercel.com](https://vercel.com) → "New Project" → reponi import qiling
3. Environment Variables ga `.env.local` dagi barcha o'zgaruvchilarni kiriting
4. Deploy!

---

## 👨‍🏫 Foydalanish

### Admin (O'qituvchi)
1. `admin` / `admin2024!` bilan kiring
2. "Yangi viktorina" tugmasi → savollar qo'shing
3. Viktorina kartasida "▶ Boshlash" → o'quvchilar ulanishini kuting
4. "O'yinni boshlash" → real-time boshqaruv

### O'quvchilar
1. Har bir o'quvchi o'z login/parol bilan kiradi
2. O'qituvchi o'yinni boshlaguncha kutadi
3. Savollar kelganda javob beradi
4. O'yin tugagach g'oliblar ekrani ko'rinadi

---

## 📁 Loyiha strukturasi

```
quiz-game/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Redirect logic
│   ├── login/page.tsx      # Login page
│   ├── admin/page.tsx      # Admin dashboard
│   └── game/page.tsx       # Player game page
├── components/
│   ├── admin/
│   │   ├── QuizEditor.tsx  # Create/edit quizzes
│   │   ├── AdminLobby.tsx  # Pre-game lobby
│   │   └── AdminMonitor.tsx # Real-time game control
│   └── game/
│       └── WinnersScreen.tsx # End game results
├── lib/
│   ├── firebase.ts         # Firebase config
│   ├── authContext.tsx     # Auth provider
│   ├── gameHelpers.ts      # Game logic + Firestore ops
│   └── types.ts            # TypeScript types
├── setup-users.js          # One-time user creation script
├── firestore.rules         # Security rules
└── .env.example            # Env template
```
# quiz-game
