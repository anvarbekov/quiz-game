const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccount = require('./serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const db = getFirestore()

const USERS = [
  { username: 'admin', password: 'admin2024!', role: 'admin', avatar: '🎯' },
  { username: 'ali', password: 'ali123', role: 'player', avatar: '🦊' },
  { username: 'vali', password: 'vali123', role: 'player', avatar: '🐼' },
  { username: 'umida', password: 'umida123', role: 'player', avatar: '🦋' },
  { username: 'aziz', password: 'aziz123', role: 'player', avatar: '🦁' },
  { username: 'malika', password: 'malika123', role: 'player', avatar: '🌟' },
  { username: 'jasur', password: 'jasur123', role: 'player', avatar: '🚀' },
  { username: 'dilnoza', password: 'dilnoza123', role: 'player', avatar: '🦄' },
  { username: 'bobur', password: 'bobur123', role: 'player', avatar: '🐯' },
  { username: 'sarvar', password: 'sarvar123', role: 'player', avatar: '⚡' },
  { username: 'nilufar', password: 'nilufar123', role: 'player', avatar: '🎯' },
]

async function createUser({ username, password, role, avatar }) {
  const email = `${username}@quiz.uz`
  try {
    const userRecord = await auth.createUser({ email, password, displayName: username })
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      username,
      role,
      avatar,
    })
    console.log(`✅ Created: ${username} (${role})`)
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      console.log(`⚠️  Already exists: ${username}`)
    } else {
      console.error(`❌ Failed: ${username}`, err.message)
    }
  }
}

async function main() {
  console.log(`Creating ${USERS.length} users...\n`)
  for (const user of USERS) await createUser(user)
  console.log('\n✅ Done!')
  process.exit(0)
}

main()
