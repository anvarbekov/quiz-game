// components/admin/UsersManager.tsx
'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { User, AVATARS } from '@/lib/types'

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ username: '', password: '', role: 'player', avatar: '🦊' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deletingUid, setDeletingUid] = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'users'))
    const list = snap.docs.map(d => d.data() as User).sort((a, b) => {
      if (a.role === 'admin') return -1
      if (b.role === 'admin') return 1
      return a.username.localeCompare(b.username)
    })
    setUsers(list)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username va parol to\'ldirilishi shart')
      return
    }
    if (form.password.length < 6) {
      setError('Parol kamida 6 ta belgi bo\'lishi kerak')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`✅ "${form.username}" muvaffaqiyatli yaratildi!`)
      setForm({ username: '', password: '', role: 'player', avatar: '🦊' })
      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`"${user.username}" ni o'chirishni tasdiqlaysizmi?`)) return
    setDeletingUid(user.uid)
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      })
      if (!res.ok) throw new Error('O\'chirishda xato')
      setUsers(prev => prev.filter(u => u.uid !== user.uid))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingUid(null)
    }
  }

  const players = users.filter(u => u.role === 'player')
  const admins = users.filter(u => u.role === 'admin')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-1">Foydalanuvchilar</h1>
        <p className="text-white/40">O'quvchi va admin akkauntlarini boshqaring</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Create user form */}
        <div className="bg-gradient-card rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-xl font-bold text-white">Yangi foydalanuvchi</h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2 font-display">Username *</label>
              <input
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="masalan: ali123"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2 font-display">Parol *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="kamida 6 ta belgi"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2 font-display">Rol</label>
              <div className="flex gap-3">
                {(['player', 'admin'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, role: r }))}
                    className={`flex-1 py-2.5 rounded-xl font-display font-semibold text-sm transition-all ${
                      form.role === r
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {r === 'player' ? '👤 O\'quvchi' : '👑 Admin'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2 font-display">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, avatar: av }))}
                    className={`w-10 h-10 rounded-xl text-xl transition-all ${
                      form.avatar === av
                        ? 'bg-purple-600 scale-110 glow-purple'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-display font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Yaratilmoqda...
                </span>
              ) : '+ Yaratish'}
            </button>
          </form>
        </div>

        {/* Users list */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-card rounded-xl p-4 text-center">
              <p className="font-display text-2xl font-bold text-white">{players.length}</p>
              <p className="text-white/40 text-sm">O'quvchilar</p>
            </div>
            <div className="bg-gradient-card rounded-xl p-4 text-center">
              <p className="font-display text-2xl font-bold text-white">{admins.length}</p>
              <p className="text-white/40 text-sm">Adminlar</p>
            </div>
          </div>

          {/* List */}
          <div className="bg-gradient-card rounded-2xl p-4 space-y-2 max-h-[480px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white">Barcha foydalanuvchilar</h3>
              <button onClick={loadUsers} className="text-white/30 hover:text-white text-sm transition-colors">
                🔄 Yangilash
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-white/30 text-center py-8">Foydalanuvchilar yo'q</p>
            ) : (
              users.map(user => (
                <div
                  key={user.uid}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-white text-sm truncate">{user.username}</p>
                    <p className="text-white/30 text-xs">{user.role === 'admin' ? '👑 Admin' : '👤 O\'quvchi'}</p>
                  </div>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deletingUid === user.uid}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all text-xs disabled:opacity-50"
                    >
                      {deletingUid === user.uid ? '...' : 'O\'chirish'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
