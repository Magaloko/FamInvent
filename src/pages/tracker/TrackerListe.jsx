import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTrackers, createTracker, createMaterial } from '@/lib/api-tracker'
import { TRACKER_LABELS, TRACKER_TYPES, TRACKER_PRESETS, TRACKER_ICONS, TRACKER_COLORS } from '@/lib/constants'
import { Plus, X, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrackerListe() {
  const [trackers, setTrackers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  // Custom form
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📊')
  const [color, setColor] = useState('#FF8A65')
  const [type, setType] = useState('counter')
  const [unit, setUnit] = useState('')
  const [dailyGoal, setDailyGoal] = useState('')
  const [goalDir, setGoalDir] = useState('max')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await getTrackers({ activeOnly: false })
    setTrackers(data)
    setLoading(false)
  }

  async function handleCreateFromPreset(preset) {
    setSaving(true)
    const { defaultMaterials, id: _id, ...trackerData } = preset
    const { data, error } = await createTracker(trackerData)
    if (error) { toast.error(error); setSaving(false); return }

    // Create default materials for smoking tracker
    if (defaultMaterials?.length > 0 && data?.id) {
      for (const mat of defaultMaterials) {
        await createMaterial({ ...mat, tracker_id: data.id })
      }
    }

    toast.success(`${preset.name} Tracker erstellt!`)
    setSaving(false)
    loadData()
  }

  async function handleCreateCustom(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await createTracker({
      name: name.trim(),
      icon,
      color,
      type,
      unit,
      daily_goal: parseFloat(dailyGoal) || 0,
      goal_direction: goalDir,
      cost_per_unit: parseFloat(costPerUnit) || 0,
    })
    if (error) toast.error(error)
    else {
      toast.success('Tracker erstellt!')
      setShowCustom(false)
      resetForm()
      loadData()
    }
    setSaving(false)
  }

  function resetForm() {
    setName(''); setIcon('📊'); setColor('#FF8A65'); setType('counter')
    setUnit(''); setDailyGoal(''); setGoalDir('max'); setCostPerUnit('')
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-fm-border/30 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="fm-card-static h-24 animate-pulse bg-fm-border/20" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="fm-page-title">{TRACKER_LABELS.trackerListe}</h1>
        <button onClick={() => setShowForm(!showForm)} className="fm-btn-primary text-sm">
          <Plus size={16} /> {TRACKER_LABELS.neuerTracker}
        </button>
      </div>

      {/* Presets + Create */}
      {showForm && (
        <div className="space-y-4 animate-slide-up">
          <div className="fm-card-static p-5">
            <h3 className="font-heading font-bold text-fm-text mb-3">{TRACKER_LABELS.vorlagen}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRACKER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleCreateFromPreset(preset)}
                  disabled={saving}
                  className="fm-card p-3 text-center hover:scale-[1.02] transition-transform"
                >
                  <span className="text-3xl block mb-1">{preset.icon}</span>
                  <p className="text-sm font-heading font-bold text-fm-text">{preset.name}</p>
                  <p className="text-[10px] text-fm-text-muted">{TRACKER_TYPES.find((t) => t.id === preset.type)?.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div className="fm-card-static p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-fm-text">{TRACKER_LABELS.eigenerTracker}</h3>
              {showCustom && (
                <button onClick={() => { setShowCustom(false); resetForm() }} className="fm-btn-ghost p-1"><X size={18} /></button>
              )}
            </div>

            {!showCustom ? (
              <button onClick={() => setShowCustom(true)} className="fm-btn-ghost w-full text-sm">
                <Plus size={16} /> Eigenen Tracker erstellen
              </button>
            ) : (
              <form onSubmit={handleCreateCustom} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="fm-label">{TRACKER_LABELS.trackerName}</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="fm-input" placeholder="z.B. Wasser trinken" autoFocus />
                  </div>
                  <div>
                    <label className="fm-label">{TRACKER_LABELS.typ}</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="fm-select">
                      {TRACKER_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Icon picker */}
                <div>
                  <label className="fm-label">Icon</label>
                  <div className="flex flex-wrap gap-1">
                    {TRACKER_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`w-9 h-9 rounded-btn text-lg flex items-center justify-center transition-all ${icon === ic ? 'bg-fm-primary/20 ring-2 ring-fm-primary' : 'bg-fm-bg-input hover:bg-fm-border/30'}`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="fm-label">Farbe</label>
                  <div className="flex gap-2">
                    {TRACKER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-fm-text ring-offset-2' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="fm-label">{TRACKER_LABELS.einheit}</label>
                    <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="fm-input" placeholder="z.B. Stk." />
                  </div>
                  <div>
                    <label className="fm-label">{TRACKER_LABELS.tagesziel}</label>
                    <input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} className="fm-input" placeholder="0" min="0" step="0.1" />
                  </div>
                  <div>
                    <label className="fm-label">{TRACKER_LABELS.zielrichtung}</label>
                    <select value={goalDir} onChange={(e) => setGoalDir(e.target.value)} className="fm-select">
                      <option value="max">Max (nicht über)</option>
                      <option value="min">Min (mindestens)</option>
                    </select>
                  </div>
                </div>

                {['kosten', 'kombi'].includes(type) && (
                  <div>
                    <label className="fm-label">{TRACKER_LABELS.kostenProEinheit} (€)</label>
                    <input type="number" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} className="fm-input" placeholder="0.35" min="0" step="0.01" />
                  </div>
                )}

                <button type="submit" disabled={saving || !name.trim()} className="fm-btn-primary w-full">
                  {saving ? 'Speichern...' : 'Tracker erstellen'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Trackers Grid */}
      {trackers.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={48} className="text-fm-text-muted mx-auto mb-3" />
          <p className="text-fm-text-muted">{TRACKER_LABELS.keineTracker}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trackers.map((t) => (
            <Link key={t.id} to={`/tracker/${t.id}`} className="fm-card p-4 block">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-fm-text truncate">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="fm-badge bg-fm-bg-input text-fm-text-light text-xs">
                      {TRACKER_TYPES.find((ty) => ty.id === t.type)?.icon} {TRACKER_TYPES.find((ty) => ty.id === t.type)?.name}
                    </span>
                    {t.daily_goal > 0 && (
                      <span className="text-xs text-fm-text-muted">
                        {t.goal_direction === 'max' ? '↓' : '↑'} {t.daily_goal} {t.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              </div>
              {!t.is_active && (
                <span className="fm-badge bg-gray-100 text-gray-500 text-xs mt-2 inline-block">Inaktiv</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
