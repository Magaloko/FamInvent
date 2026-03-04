import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getItem, updateItem, deleteItem, getPlayLogs, createPlayLog } from '@/lib/api'
import { useFamily } from '@/lib/FamilyContext'
import { LABELS, CATEGORIES } from '@/lib/constants'
import { ArrowLeft, Trash2, Save, Gamepad2, Plus, Clock, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { members, family } = useFamily()
  const [item, setItem] = useState(null)
  const [playLogs, setPlayLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState(false)

  // Play log form
  const [showPlayForm, setShowPlayForm] = useState(false)
  const [playMember, setPlayMember] = useState('')
  const [playDuration, setPlayDuration] = useState('')
  const [playNotes, setPlayNotes] = useState('')

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [itemRes, logsRes] = await Promise.all([
      getItem(id),
      getPlayLogs({ itemId: id, limit: 20 }),
    ])
    const itemData = itemRes.data
    setItem(itemData)
    setPlayLogs(logsRes.data || [])
    if (itemData) {
      setName(itemData.name)
      setDescription(itemData.description || '')
      setValue(itemData.value || '')
      setCategory(itemData.category || '')
    }
    setLoading(false)
  }

  async function handleSave() {
    const { error } = await updateItem(id, {
      name: name.trim(),
      description,
      value: parseFloat(value) || 0,
      category,
    })
    if (error) {
      toast.error(error)
    } else {
      toast.success('Gespeichert!')
      setEditing(false)
      loadData()
    }
  }

  async function handleDelete() {
    if (!confirm(LABELS.confirmDeleteText)) return
    const { error } = await deleteItem(id)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Teil gelöscht')
      navigate(-1)
    }
  }

  async function handleLogPlay(e) {
    e.preventDefault()
    const { error } = await createPlayLog({
      item_id: id,
      played_by: playMember || null,
      duration_minutes: parseInt(playDuration) || null,
      notes: playNotes,
    })
    if (error) {
      toast.error(error)
    } else {
      toast.success('Spielsitzung erfasst!')
      setShowPlayForm(false)
      setPlayMember('')
      setPlayDuration('')
      setPlayNotes('')
      loadData()
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="h-64 bg-fm-border/20 rounded-card animate-pulse mb-4" />
      </div>
    )
  }

  if (!item) {
    return <p className="text-center text-fm-text-muted py-16">Teil nicht gefunden</p>
  }

  const isToy = item.fm_collections?.type === 'toy'
  const cat = CATEGORIES.find((c) => c.id === item.category)

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="fm-btn-ghost text-sm">
        <ArrowLeft size={16} /> Zurück
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Image */}
        <div className="fm-card-static overflow-hidden">
          <div className="aspect-square bg-fm-bg-input flex items-center justify-center">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl">{cat?.icon || '📦'}</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="fm-card-static p-5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="fm-page-title">{editing ? '' : item.name}</h1>
              <div className="flex gap-2">
                {editing ? (
                  <button onClick={handleSave} className="fm-btn-primary text-sm">
                    <Save size={16} /> {LABELS.save}
                  </button>
                ) : (
                  <button onClick={() => setEditing(true)} className="fm-btn-ghost text-sm">
                    {LABELS.edit}
                  </button>
                )}
                <button onClick={handleDelete} className="fm-btn-ghost p-2 text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="fm-label">{LABELS.name}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="fm-input" />
                </div>
                <div>
                  <label className="fm-label">{LABELS.value} ({LABELS.euro})</label>
                  <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="fm-input" min="0" step="0.01" />
                </div>
                <div>
                  <label className="fm-label">{LABELS.category}</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="fm-select">
                    <option value="">-- Kategorie --</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fm-label">{LABELS.description}</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="fm-input" rows={3} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-heading font-bold text-fm-primary">
                    {parseFloat(item.value || 0).toFixed(2)} {LABELS.euro}
                  </span>
                  {cat && (
                    <span className="fm-badge bg-fm-bg-input text-fm-text-light">
                      {cat.icon} {cat.name}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-fm-text-light">{item.description}</p>
                )}
                <p className="text-xs text-fm-text-muted">
                  {LABELS.createdAt}: {new Date(item.created_at).toLocaleDateString('de-DE')}
                </p>
              </div>
            )}
          </div>

          {/* Play Log Section (only for toys) */}
          {isToy && (
            <div className="fm-card-static p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-fm-text flex items-center gap-2">
                  <Gamepad2 size={18} className="text-fm-primary" />
                  {LABELS.playLog}
                </h2>
                <button onClick={() => setShowPlayForm(!showPlayForm)} className="fm-btn-primary text-sm">
                  <Plus size={14} /> {LABELS.logPlay}
                </button>
              </div>

              {showPlayForm && (
                <form onSubmit={handleLogPlay} className="bg-fm-bg-input p-4 rounded-card mb-4 space-y-3">
                  <div>
                    <label className="fm-label">Wer hat gespielt?</label>
                    <select value={playMember} onChange={(e) => setPlayMember(e.target.value)} className="fm-select">
                      <option value="">{LABELS.allMembers}</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.avatar_url} {m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="fm-label">{LABELS.duration}</label>
                    <input type="number" value={playDuration} onChange={(e) => setPlayDuration(e.target.value)} className="fm-input" placeholder="z.B. 30" min="1" />
                  </div>
                  <div>
                    <label className="fm-label">{LABELS.notes}</label>
                    <input type="text" value={playNotes} onChange={(e) => setPlayNotes(e.target.value)} className="fm-input" placeholder="Optional..." />
                  </div>
                  <button type="submit" className="fm-btn-primary w-full text-sm">{LABELS.save}</button>
                </form>
              )}

              <div className="text-sm text-fm-text-muted mb-3">
                {playLogs.length} {LABELS.playCount} {LABELS.times}
              </div>

              {playLogs.length === 0 ? (
                <p className="text-sm text-fm-text-muted text-center py-4">{LABELS.noPlayLogs}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {playLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 py-2 border-b border-fm-border last:border-0">
                      <span>{log.fm_members?.avatar_url || '👤'}</span>
                      <div className="flex-1">
                        <p className="text-sm text-fm-text">
                          {log.fm_members?.name || 'Unbekannt'}
                        </p>
                        <p className="text-xs text-fm-text-muted flex items-center gap-2">
                          <Calendar size={12} />
                          {new Date(log.played_at).toLocaleDateString('de-DE')}
                          {log.duration_minutes && (
                            <><Clock size={12} /> {log.duration_minutes} Min.</>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
