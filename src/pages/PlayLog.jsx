import { useState, useEffect } from 'react'
import { useFamily } from '@/lib/FamilyContext'
import { getPlayLogs, createPlayLog, getItemsByFamily } from '@/lib/api'
import { LABELS } from '@/lib/constants'
import { Gamepad2, Plus, Clock, Calendar, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PlayLog() {
  const { family, members } = useFamily()
  const [logs, setLogs] = useState([])
  const [toyItems, setToyItems] = useState([])
  const [filterMember, setFilterMember] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form
  const [formItem, setFormItem] = useState('')
  const [formMember, setFormMember] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [family, filterMember])

  async function loadData() {
    if (!family) return
    setLoading(true)
    const [logsRes, itemsRes] = await Promise.all([
      getPlayLogs({
        familyId: family.id,
        memberId: filterMember || undefined,
        limit: 100,
      }),
      getItemsByFamily(family.id),
    ])
    setLogs(logsRes.data || [])
    setToyItems((itemsRes.data || []).filter((i) => i.fm_collections?.type === 'toy'))
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formItem) return

    setSaving(true)
    const { error } = await createPlayLog({
      item_id: formItem,
      played_by: formMember || null,
      duration_minutes: parseInt(formDuration) || null,
      notes: formNotes,
    })

    if (error) {
      toast.error(error)
    } else {
      toast.success('Spielsitzung erfasst!')
      setShowForm(false)
      setFormItem('')
      setFormMember('')
      setFormDuration('')
      setFormNotes('')
      loadData()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="fm-page-title flex items-center gap-2">
          <Gamepad2 size={24} className="text-fm-primary" />
          {LABELS.playLog}
        </h1>
        <button onClick={() => setShowForm(true)} className="fm-btn-primary text-sm">
          <Plus size={16} /> {LABELS.logPlay}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterMember('')}
          className={`px-4 py-2 rounded-full text-sm font-heading font-medium transition-all ${
            !filterMember
              ? 'bg-fm-primary text-white shadow-btn'
              : 'bg-white text-fm-text-light border border-fm-border'
          }`}
        >
          {LABELS.allMembers}
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilterMember(m.id)}
            className={`px-4 py-2 rounded-full text-sm font-heading font-medium transition-all ${
              filterMember === m.id
                ? 'bg-fm-primary text-white shadow-btn'
                : 'bg-white text-fm-text-light border border-fm-border'
            }`}
          >
            {m.avatar_url} {m.name}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="fm-card-static p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold">{LABELS.logPlay}</h3>
            <button onClick={() => setShowForm(false)} className="fm-btn-ghost p-1">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="fm-label">Spielzeug</label>
              <select value={formItem} onChange={(e) => setFormItem(e.target.value)} className="fm-select" required>
                <option value="">-- Spielzeug wählen --</option>
                {toyItems.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="fm-label">Wer hat gespielt?</label>
              <select value={formMember} onChange={(e) => setFormMember(e.target.value)} className="fm-select">
                <option value="">-- Optional --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.avatar_url} {m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="fm-label">{LABELS.duration}</label>
              <input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="fm-input" placeholder="z.B. 30" min="1" />
            </div>
            <div>
              <label className="fm-label">{LABELS.notes}</label>
              <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="fm-input" placeholder="Optional..." />
            </div>
            <button type="submit" disabled={saving || !formItem} className="fm-btn-primary w-full">
              {saving ? LABELS.loading : LABELS.save}
            </button>
          </form>
        </div>
      )}

      {/* Log List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="fm-card-static h-16 animate-pulse bg-fm-border/20" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 size={48} className="text-fm-text-muted mx-auto mb-3" />
          <p className="text-fm-text-muted">{LABELS.noPlayLogs}</p>
        </div>
      ) : (
        <div className="fm-card-static divide-y divide-fm-border">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-4">
              <span className="text-2xl">{log.fm_members?.avatar_url || '👤'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fm-text">
                  <strong>{log.fm_members?.name || 'Unbekannt'}</strong> hat mit{' '}
                  <strong>{log.fm_items?.name || '...'}</strong> gespielt
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-fm-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(log.played_at).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </span>
                  {log.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {log.duration_minutes} Min.
                    </span>
                  )}
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
