import { useState, useEffect } from 'react'
import { getPlayLogs, createPlayLog, getAllToyItems } from '@/lib/api'
import { LABELS } from '@/lib/constants'
import { Gamepad2, Plus, Clock, Calendar, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PlayLog() {
  const [logs, setLogs] = useState([])
  const [toyItems, setToyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [formItem, setFormItem] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [logsRes, itemsRes] = await Promise.all([
      getPlayLogs({ limit: 100 }),
      getAllToyItems(),
    ])
    setLogs(logsRes.data || [])
    setToyItems(itemsRes.data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formItem) return

    setSaving(true)
    const { error } = await createPlayLog({ item_id: formItem, duration_minutes: parseInt(formDuration) || null, notes: formNotes })
    if (error) toast.error(error)
    else { toast.success('Spielsitzung erfasst!'); setShowForm(false); setFormItem(''); setFormDuration(''); setFormNotes(''); loadData() }
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="fm-page-title flex items-center gap-2"><Gamepad2 size={24} className="text-fm-primary" /> {LABELS.playLog}</h1>
        <button onClick={() => setShowForm(true)} className="fm-btn-primary text-sm"><Plus size={16} /> {LABELS.logPlay}</button>
      </div>

      {showForm && (
        <div className="fm-card-static p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold">{LABELS.logPlay}</h3>
            <button onClick={() => setShowForm(false)} className="fm-btn-ghost p-1"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="fm-label">Spielzeug</label>
              <select value={formItem} onChange={(e) => setFormItem(e.target.value)} className="fm-select" required>
                <option value="">-- Spielzeug wählen --</option>
                {toyItems.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div><label className="fm-label">{LABELS.duration}</label><input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="fm-input" placeholder="z.B. 30" min="1" /></div>
            <div><label className="fm-label">{LABELS.notes}</label><input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="fm-input" placeholder="Optional..." /></div>
            <button type="submit" disabled={saving || !formItem} className="fm-btn-primary w-full">{saving ? LABELS.loading : LABELS.save}</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="fm-card-static h-16 animate-pulse bg-fm-border/20" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 size={48} className="text-fm-text-muted mx-auto mb-3" />
          <p className="text-fm-text-muted">{LABELS.noPlayLogs}</p>
        </div>
      ) : (
        <div className="fm-card-static divide-y divide-fm-border">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-4">
              <span className="text-2xl">🎮</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fm-text">
                  Mit <strong>{log.fm_items?.name || '...'}</strong> gespielt
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-fm-text-muted">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(log.played_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  {log.duration_minutes && <span className="flex items-center gap-1"><Clock size={12} /> {log.duration_minutes} Min.</span>}
                  {log.notes && <span>· {log.notes}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
