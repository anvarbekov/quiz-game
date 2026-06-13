// components/admin/QuizImporter.tsx
'use client'
import { useState, useRef } from 'react'
import { Quiz, Question } from '@/lib/types'
import { saveQuiz } from '@/lib/gameHelpers'

interface Props {
  onImported: () => void
}

export default function QuizImporter({ onImported }: Props) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<Quiz | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function resetState() {
    setPreview(null)
    setError('')
    setSuccess('')
  }

  async function handleFile(file: File) {
    resetState()
    const ext = file.name.split('.').pop()?.toLowerCase()

    try {
      if (ext === 'json') {
        await parseJSON(file)
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        await parseExcel(file)
      } else {
        setError('Faqat .json, .xlsx, .xls yoki .csv fayl yuklang')
      }
    } catch (err: any) {
      setError('Fayl o\'qishda xato: ' + err.message)
    }
  }

  async function parseJSON(file: File) {
    const text = await file.text()
    const data = JSON.parse(text)

    // Support two formats:
    // Format 1: { title, subject, questions: [...] }
    // Format 2: [ { text, options, correctIndex, timeLimit, points }, ... ]
    let questions: Question[] = []
    let title = ''
    let subject = ''

    if (Array.isArray(data)) {
      questions = data.map(normalizeQuestion)
      title = file.name.replace('.json', '')
      subject = 'Imported'
    } else if (data.questions) {
      questions = data.questions.map(normalizeQuestion)
      title = data.title || file.name.replace('.json', '')
      subject = data.subject || 'Imported'
    } else {
      throw new Error('JSON format noto\'g\'ri. Namunani ko\'ring.')
    }

    setPreview({
      id: `quiz_${Date.now()}`,
      title,
      subject,
      questions,
      createdAt: Date.now(),
      createdBy: 'admin',
    })
  }

  async function parseExcel(file: File) {
    // Dynamically import xlsx
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 })

    // Expected columns: Savol | A variant | B variant | C variant | D variant | To'g'ri (A/B/C/D) | Vaqt | Ball
    const questions: Question[] = []
    const dataRows = rows.filter((r, i) => i > 0 && r[0]) // skip header

    for (const row of dataRows) {
      const text = String(row[0] || '').trim()
      const optA = String(row[1] || '').trim()
      const optB = String(row[2] || '').trim()
      const optC = String(row[3] || '').trim()
      const optD = String(row[4] || '').trim()
      const correct = String(row[5] || 'A').trim().toUpperCase()
      const timeLimit = parseInt(row[6]) || 20
      const points = parseInt(row[7]) || 100

      if (!text || !optA) continue

      const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correct)

      questions.push({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        text,
        options: [optA, optB, optC, optD],
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        timeLimit,
        points,
      })
    }

    if (questions.length === 0) throw new Error('Savollar topilmadi. Ustunlar to\'g\'ri ekanligini tekshiring.')

    const sheetName = wb.SheetNames[0]
    setPreview({
      id: `quiz_${Date.now()}`,
      title: sheetName !== 'Sheet1' ? sheetName : file.name.replace(/\.(xlsx|xls|csv)$/, ''),
      subject: 'Imported',
      questions,
      createdAt: Date.now(),
      createdBy: 'admin',
    })
  }

  function normalizeQuestion(q: any, i: number): Question {
    return {
      id: `q_${Date.now()}_${i}`,
      text: q.text || q.savol || q.question || '',
      options: q.options || [q.a || q.A || '', q.b || q.B || '', q.c || q.C || '', q.d || q.D || ''],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      timeLimit: q.timeLimit || q.vaqt || 20,
      points: q.points || q.ball || 100,
    }
  }

  async function handleSave() {
    if (!preview) return
    setSaving(true)
    await saveQuiz(preview)
    setSaving(false)
    setSuccess(`✅ "${preview.title}" — ${preview.questions.length} ta savol saqlandi!`)
    setPreview(null)
    onImported()
  }

  function downloadTemplate() {
    const templateData = [
      ['Savol', 'A variant', 'B variant', 'C variant', 'D variant', "To'g'ri (A/B/C/D)", 'Vaqt (sek)', 'Ball'],
      ['HTML nima?', 'HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyper Transfer Markup Language', 'A', 20, 100],
      ['CSS qisqartmasi nima?', 'Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Colorful Style Sheets', 'A', 20, 100],
      ['JavaScript qaysi turdagi til?', 'Interpreted', 'Compiled', 'Assembly', 'Machine', 'A', 15, 100],
    ]

    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.aoa_to_sheet(templateData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Savollar')
      XLSX.writeFile(wb, 'quiz-shablon.xlsx')
    })
  }

  function downloadJSONTemplate() {
    const template = {
      title: 'Viktorina nomi',
      subject: 'Fan nomi',
      questions: [
        {
          text: 'Savol matni?',
          options: ['A variant', 'B variant', 'C variant', 'D variant'],
          correctIndex: 0,
          timeLimit: 20,
          points: 100,
        },
      ],
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'quiz-shablon.json'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Fayl orqali savollar yuklash</h2>
          <p className="text-white/40 text-sm mt-1">Excel (.xlsx) yoki JSON formatida</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 font-display text-sm rounded-xl transition-all"
          >
            📥 Excel shablon
          </button>
          <button
            onClick={downloadJSONTemplate}
            className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-400 font-display text-sm rounded-xl transition-all"
          >
            📥 JSON shablon
          </button>
        </div>
      </div>

      {/* Drop zone */}
      {!preview && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-purple-400 bg-purple-500/10'
              : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json,.xlsx,.xls,.csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
          <div className="text-5xl mb-4">📂</div>
          <p className="font-display text-white font-semibold">Faylni shu yerga tashlang yoki bosing</p>
          <p className="text-white/40 text-sm mt-2">.xlsx • .xls • .csv • .json</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400">
          ⚠️ {error}
          <button onClick={resetState} className="ml-3 text-red-300 underline text-sm">Qayta urinish</button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 text-green-400">
          {success}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="bg-gradient-card rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white">{preview.title}</h3>
              <p className="text-white/40 text-sm mt-1">{preview.subject} • {preview.questions.length} ta savol</p>
            </div>
            <button onClick={resetState} className="text-white/30 hover:text-white text-sm">✕ Bekor</button>
          </div>

          {/* Edit title/subject */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-display">Viktorina nomi</label>
              <input
                value={preview.title}
                onChange={e => setPreview(p => p ? { ...p, title: e.target.value } : p)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-display">Fan</label>
              <input
                value={preview.subject}
                onChange={e => setPreview(p => p ? { ...p, subject: e.target.value } : p)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Questions preview */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {preview.questions.map((q, i) => (
              <div key={q.id} className="bg-white/5 rounded-xl px-4 py-3">
                <p className="text-white text-sm font-display font-semibold mb-1.5">
                  <span className="text-purple-400 mr-2">{i + 1}.</span>{q.text}
                </p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt, j) => (
                    <span key={j} className={`text-xs px-2 py-1 rounded-lg font-display ${
                      j === q.correctIndex
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-white/5 text-white/50'
                    }`}>
                      {['A','B','C','D'][j]}: {opt}
                    </span>
                  ))}
                  <span className="text-xs text-white/30 px-2 py-1">{q.timeLimit}sek • {q.points}ball</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-display font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saqlanmoqda...
              </span>
            ) : `💾 ${preview.questions.length} ta savolni saqlash`}
          </button>
        </div>
      )}

      {/* Format guide */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
        <h4 className="font-display font-semibold text-white/60 text-sm uppercase tracking-wider">Excel format</h4>
        <div className="overflow-x-auto">
          <table className="text-xs text-white/50 w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Savol', 'A variant', 'B variant', 'C variant', 'D variant', "To'g'ri", 'Vaqt', 'Ball'].map(h => (
                  <th key={h} className="text-left pb-2 pr-3 font-display text-white/70 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {['HTML nima?', 'Markup tili', 'Stil tili', 'Script tili', 'Ma\'lumotlar tili', 'A', '20', '100'].map((v, i) => (
                  <td key={i} className="pt-2 pr-3 whitespace-nowrap">{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
