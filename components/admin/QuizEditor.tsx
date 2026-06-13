// components/admin/QuizEditor.tsx
'use client'
import { useState } from 'react'
import { Quiz, Question } from '@/lib/types'

interface Props {
  quiz: Quiz | null
  onSave: (quiz: Quiz) => void
  onCancel: () => void
}

const EMPTY_QUESTION = (): Question => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimit: 20,
  points: 100,
})

export default function QuizEditor({ quiz, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(quiz?.title || '')
  const [subject, setSubject] = useState(quiz?.subject || '')
  const [questions, setQuestions] = useState<Question[]>(
    quiz?.questions.length ? quiz.questions : [EMPTY_QUESTION()]
  )
  const [activeQ, setActiveQ] = useState(0)
  const [saving, setSaving] = useState(false)

  function updateQuestion(idx: number, field: keyof Question, value: any) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions(prev => prev.map((q, i) =>
      i === qIdx
        ? { ...q, options: q.options.map((o, j) => j === optIdx ? value : o) }
        : q
    ))
  }

  function addQuestion() {
    const newQ = EMPTY_QUESTION()
    setQuestions(prev => [...prev, newQ])
    setActiveQ(questions.length)
  }

  function removeQuestion(idx: number) {
    if (questions.length === 1) return
    setQuestions(prev => prev.filter((_, i) => i !== idx))
    setActiveQ(Math.max(0, idx - 1))
  }

  async function handleSave() {
    if (!title.trim()) { alert('Viktorina nomini kiriting'); return }
    if (!subject.trim()) { alert('Fan nomini kiriting'); return }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) { alert(`${i + 1}-savol matnini kiriting`); setActiveQ(i); return }
      if (q.options.some(o => !o.trim())) { alert(`${i + 1}-savolning barcha variantlarini to'ldiring`); setActiveQ(i); return }
    }
    setSaving(true)
    const saved: Quiz = {
      id: quiz?.id || `quiz_${Date.now()}`,
      title: title.trim(),
      subject: subject.trim(),
      questions,
      createdAt: quiz?.createdAt || Date.now(),
      createdBy: quiz?.createdBy || 'admin',
    }
    await onSave(saved)
    setSaving(false)
  }

  const q = questions[activeQ]
  const LETTERS = ['A', 'B', 'C', 'D']
  const OPT_COLORS = ['bg-purple-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-pink-500']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            {quiz ? 'Viktorinani tahrirlash' : 'Yangi viktorina'}
          </h1>
          <p className="text-white/40 mt-1">{questions.length} ta savol</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 font-display rounded-xl transition-all">
            Bekor
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-display font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? 'Saqlanmoqda...' : '💾 Saqlash'}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-gradient-card rounded-2xl p-5">
          <label className="block text-sm text-white/60 mb-2 font-display">Viktorina nomi *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Masalan: Web dasturlash asoslari"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
        <div className="bg-gradient-card rounded-2xl p-5">
          <label className="block text-sm text-white/60 mb-2 font-display">Fan / Mavzu *</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Masalan: Informatika"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Question list */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-display font-semibold text-white/60 text-sm uppercase tracking-wider mb-3">Savollar</h3>
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setActiveQ(i)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 group ${
                i === activeQ
                  ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                  : 'bg-white/5 border border-transparent hover:bg-white/10 text-white/60'
              }`}
            >
              <span className="font-display font-bold text-sm w-6 h-6 flex items-center justify-center rounded-lg bg-white/10">
                {i + 1}
              </span>
              <span className="text-sm truncate flex-1">
                {q.text.trim() || 'Savol matni...'}
              </span>
              {questions.length > 1 && (
                <span
                  onClick={e => { e.stopPropagation(); removeQuestion(i) }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
                >✕</span>
              )}
            </button>
          ))}
          <button
            onClick={addQuestion}
            className="w-full px-4 py-3 rounded-xl border border-dashed border-white/20 hover:border-purple-500/50 text-white/40 hover:text-white/70 text-sm transition-all font-display"
          >
            + Savol qo'shish
          </button>
        </div>

        {/* Question editor */}
        <div className="lg:col-span-3 bg-gradient-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white">{activeQ + 1}-savol</h3>
            <div className="flex items-center gap-3">
              <label className="text-white/50 text-sm">Vaqt:</label>
              <select
                value={q.timeLimit}
                onChange={e => updateQuestion(activeQ, 'timeLimit', Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none"
              >
                {[10, 15, 20, 30, 45, 60].map(t => (
                  <option key={t} value={t}>{t} sek</option>
                ))}
              </select>
              <label className="text-white/50 text-sm">Ball:</label>
              <select
                value={q.points}
                onChange={e => updateQuestion(activeQ, 'points', Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none"
              >
                {[50, 100, 150, 200].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Savol matni *</label>
            <textarea
              value={q.text}
              onChange={e => updateQuestion(activeQ, 'text', e.target.value)}
              placeholder="Savolingizni yozing..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all resize-none"
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm text-white/60 mb-3">Javob variantlari (to'g'ri javobni belgilang) *</label>
            <div className="space-y-3">
              {q.options.map((opt, j) => (
                <div key={j} className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuestion(activeQ, 'correctIndex', j)}
                    className={`w-9 h-9 rounded-xl font-display font-bold text-sm flex items-center justify-center transition-all flex-shrink-0 ${
                      q.correctIndex === j
                        ? `${OPT_COLORS[j]} text-white glow-purple`
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    {LETTERS[j]}
                  </button>
                  <input
                    value={opt}
                    onChange={e => updateOption(activeQ, j, e.target.value)}
                    placeholder={`${j + 1}-variant`}
                    className={`flex-1 bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none transition-all ${
                      q.correctIndex === j ? 'border-purple-500/50' : 'border-white/10 focus:border-white/30'
                    }`}
                  />
                  {q.correctIndex === j && (
                    <span className="text-green-400 text-xs font-display">✓ To'g'ri</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-3">💡 Harfni bosib to'g'ri javobni belgilang</p>
          </div>
        </div>
      </div>
    </div>
  )
}
