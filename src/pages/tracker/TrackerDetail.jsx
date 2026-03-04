import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTrackerDetailStats, createEntry, deleteEntry, deleteTracker, getMaterials } from '@/lib/api-tracker'
import { TRACKER_LABELS, TRACKER_TYPES, SMOKING_SUBTYPES } from '@/lib/constants'
import GoalProgressBar from '@/components/tracker/GoalProgressBar'
import StreakBadge from '@/components/tracker/StreakBadge'
import SubtypeBadge from '@/components/tracker/SubtypeBadge'
import { ArrowLeft, Plus, Trash2, Calendar, TrendingDown, TrendingUp, Settings } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function TrackerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Entry form
  const [entryCount, setEntryCount] = useState('1')
  const [entryCost, setEntryCost] = useState('')
  const [entryDuration, setEntryDuration] = useState('')
  const [entrySubtype, setEntrySubtype] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [entryTime, setEntryTime] = useState(new Date().toTimeString().slice(0, 5))
  const [entryNotes, setEntryNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const { data } = await getTrackerDetailStats(id)
    setStats(data)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const count = parseFloat(entryCount) || 0
    if (!count) return
    setSaving(true)

    const entry = {
      tracker_id: id,
      date: entryDate,
      count,
      time_of_day: entryTime || null,
      notes: entryNotes,
      subtype: entrySubtype || '',
    }

    const tracker = stats.tracker
    if (['kosten', 'kombi'].includes(tracker.type)) {
      if (entryCost) {
        entry.cost = parseFloat(entryCost)
      } else if (entrySubtype === 'gekauft' && tracker.cost_per_unit) {
        entry.cost = count * parseFloat(tracker.cost_per_unit)
      } else if (entrySubtype === 'e-zig' && tracker.cost_per_unit) {
        entry.cost = count * parseFloat(tracker.cost_per_unit) * 0.4 // e-zig ~40% of bought cost
      }
      // gedreht cost auto-calculated in createEntry
    }

    if (tracker.type === 'zeit') {
      entry.duration_minutes = parseInt(entryDuration) || 0
      entry.count = entry.duration_minutes // for zeit type, count = duration
    }

    const { error } = await createEntry(entry, stats.materials)
    if (error) toast.error(error)
    else {
      toast.success('Eintrag gespeichert!')
      setShowForm(false)
      resetForm()
      loadData()
    }
    setSaving(false)
  }

  function resetForm() {
    setEntryCount('1'); setEntryCost(''); setEntryDuration(''); setEntrySubtype('')
    setEntryDate(new Date().toISOString().split('T')[0])
    setEntryTime(new Date().toTimeString().slice(0, 5))
    setEntryNotes('')
  }

  async function handleDeleteEntry(entryId) {
    if (!confirm('Eintrag löschen?')) return
    const { error } = await deleteEntry(entryId)
    if (error) toast.error(error)
    else { toast.success('Eintrag gelöscht'); loadData() }
  }

  async function handleDeleteTracker() {
    if (!confirm('Tracker und alle Einträge wirklich löschen?')) return
    const { error } = await deleteTracker(id)
    if (error) toast.error(error)
    else { toast.success('Tracker gelöscht'); navigate('/tracker/liste') }
  }

  if (loading) return <div className="animate-fade-in"><div className="h-64 bg-fm-border/20 rounded-card animate-pulse" /></div>
  if (!stats) return <p className="text-center text-fm-text-muted py-16">Tracker nicht gefunden</p>

  const { tracker, entries, daily, streak, trend, rolledCost, totalCount, totalCost, totalDuration, avgPerDay } = stats
  const typeObj = TRACKER_TYPES.find((t) => t.id === tracker.type)
  const showCost = ['kosten', 'kombi'].includes(tracker.type)
  const showDuration = tracker.type === 'zeit'
  const today = new Date().toISOString().split('T')[0]
  const todayEntries = entries.filter((e) => e.date === today)
  const todayCount = todayEntries.reduce((s, e) => s + (parseFloat(e.count) || 0), 0)
  const todayCost = todayEntries.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)

  // Chart data (last 14 days)
  const chartData = daily.slice(-14).map((d) => ({
    ...d,
    tag: new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to="/tracker/liste" className="fm-btn-ghost text-sm inline-flex">
          <ArrowLeft size={16} /> {TRACKER_LABELS.trackerListe}
        </Link>
        <div className="flex gap-2">
          {tracker.is_smoking_tracker && (
            <Link to={`/tracker/${id}/materialien`} className="fm-btn-ghost text-sm">
              <Settings size={14} /> {TRACKER_LABELS.materialien}
            </Link>
          )}
          <button onClick={handleDeleteTracker} className="fm-btn-ghost p-2 text-red-400"><Trash2 size={18} /></button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{tracker.icon}</span>
        <div>
          <h1 className="fm-page-title">{tracker.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="fm-badge bg-fm-bg-input text-fm-text-light text-xs">{typeObj?.icon} {typeObj?.name}</span>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tracker.color }} />
          </div>
        </div>
      </div>

      {/* Today's goal progress */}
      {tracker.daily_goal > 0 && (
        <div className="fm-card-static p-4">
          <p className="text-xs text-fm-text-muted mb-2">{TRACKER_LABELS.heute}: {TRACKER_LABELS.fortschritt}</p>
          <GoalProgressBar
            current={showDuration ? todayEntries.reduce((s, e) => s + (parseInt(e.duration_minutes) || 0), 0) : todayCount}
            goal={tracker.daily_goal}
            direction={tracker.goal_direction}
            unit={tracker.unit}
          />
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{TRACKER_LABELS.heute}</p>
          <p className="text-xl font-heading font-bold text-fm-text">{todayCount} {tracker.unit}</p>
          {showCost && <p className="text-xs text-fm-text-muted">{todayCost.toFixed(2)} €</p>}
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{TRACKER_LABELS.durchschnitt}</p>
          <p className="text-xl font-heading font-bold text-fm-text">{avgPerDay.toFixed(1)} {tracker.unit}/{TRACKER_LABELS.proTag}</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{TRACKER_LABELS.trend} (Woche)</p>
          <div className="flex items-center gap-1">
            {trend.changePercent < 0 ? <TrendingDown size={18} className="text-green-600" /> : <TrendingUp size={18} className="text-red-500" />}
            <p className={`text-xl font-heading font-bold ${trend.changePercent <= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(0)}%
            </p>
          </div>
        </div>
        {showCost ? (
          <div className="fm-stat-card">
            <p className="text-xs text-fm-text-muted font-heading">{TRACKER_LABELS.kosten} (30T)</p>
            <p className="text-xl font-heading font-bold text-red-500">{totalCost.toFixed(2)} €</p>
          </div>
        ) : (
          <div className="fm-stat-card">
            <p className="text-xs text-fm-text-muted font-heading">{TRACKER_LABELS.gesamt} (30T)</p>
            <p className="text-xl font-heading font-bold text-fm-text">
              {showDuration ? `${totalDuration} Min.` : `${totalCount} ${tracker.unit}`}
            </p>
          </div>
        )}
      </div>

      {/* Streak */}
      {tracker.daily_goal > 0 && (streak.current > 0 || streak.best > 0) && (
        <div className="fm-card-static p-4 flex justify-center">
          <StreakBadge current={streak.current} best={streak.best} />
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="fm-card-static p-5">
          <h2 className="font-heading font-bold text-fm-text mb-3">Letzte 14 Tage</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="tag" tick={{ fontSize: 10, fill: '#BCAAA4' }} />
              <YAxis tick={{ fontSize: 11, fill: '#BCAAA4' }} />
              <Tooltip
                formatter={(v) => [showDuration ? `${v} Min.` : `${v} ${tracker.unit}`, TRACKER_LABELS.anzahl]}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #F5E6D8', borderRadius: '10px', fontSize: '13px' }}
              />
              <Bar dataKey={showDuration ? 'duration' : 'count'} fill={tracker.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rolled cigarette cost info */}
      {tracker.is_smoking_tracker && rolledCost > 0 && (
        <div className="fm-card-static p-4">
          <h3 className="font-heading font-bold text-fm-text text-sm mb-2">{TRACKER_LABELS.kostenvergleich}</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            {SMOKING_SUBTYPES.map((st) => {
              let price = 0
              if (st.id === 'gekauft') price = parseFloat(tracker.cost_per_unit) || 0
              else if (st.id === 'gedreht') price = rolledCost
              else if (st.id === 'e-zig') price = (parseFloat(tracker.cost_per_unit) || 0) * 0.4
              return (
                <div key={st.id} className={`p-2 rounded-card ${st.color}`}>
                  <p className="text-xs">{st.icon} {st.name}</p>
                  <p className="font-heading font-bold">{price.toFixed(3)} €</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* New Entry Button + Form */}
      <div className="fm-card-static p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-fm-text">{TRACKER_LABELS.einträge} ({entries.length})</h2>
          <button onClick={() => setShowForm(!showForm)} className="fm-btn-primary text-sm">
            <Plus size={14} /> {TRACKER_LABELS.neuerEintrag}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 mb-6 p-4 bg-fm-bg-input rounded-card animate-slide-up">
            {/* Subtype tabs for smoking */}
            {tracker.has_subtypes && tracker.subtypes?.length > 0 && (
              <div className="flex gap-2">
                {tracker.subtypes.map((st) => {
                  const stObj = SMOKING_SUBTYPES.find((s) => s.id === st)
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEntrySubtype(st)}
                      className={`flex-1 py-2 rounded-btn text-sm font-medium transition-all ${entrySubtype === st ? 'bg-white shadow text-fm-text' : 'text-fm-text-muted hover:bg-white/50'}`}
                    >
                      {stObj?.icon} {stObj?.name || st}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {showDuration ? (
                <div>
                  <label className="fm-label">{TRACKER_LABELS.dauer} (Min.)</label>
                  <input type="number" value={entryDuration} onChange={(e) => setEntryDuration(e.target.value)} className="fm-input" placeholder="30" min="1" autoFocus />
                </div>
              ) : (
                <div>
                  <label className="fm-label">{TRACKER_LABELS.anzahl} ({tracker.unit})</label>
                  <input type="number" value={entryCount} onChange={(e) => setEntryCount(e.target.value)} className="fm-input" placeholder="1" min="0.1" step="0.1" autoFocus />
                </div>
              )}
              {showCost && (
                <div>
                  <label className="fm-label">{TRACKER_LABELS.kosten} (€)</label>
                  <input type="number" value={entryCost} onChange={(e) => setEntryCost(e.target.value)} className="fm-input" placeholder="auto" min="0" step="0.01" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="fm-label">Datum</label>
                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="fm-input" />
              </div>
              <div>
                <label className="fm-label">{TRACKER_LABELS.uhrzeit}</label>
                <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} className="fm-input" />
              </div>
            </div>

            <div>
              <label className="fm-label">Notizen</label>
              <input type="text" value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} className="fm-input" placeholder="Optional..." />
            </div>

            <button type="submit" disabled={saving} className="fm-btn-primary w-full">
              {saving ? 'Speichern...' : TRACKER_LABELS.neuerEintrag + ' speichern'}
            </button>
          </form>
        )}

        {/* Entries Timeline */}
        {entries.length === 0 ? (
          <p className="text-sm text-fm-text-muted text-center py-6">{TRACKER_LABELS.keineEinträge}</p>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 50).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-fm-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-fm-text">
                      {showDuration ? `${entry.duration_minutes} Min.` : `${parseFloat(entry.count)} ${tracker.unit}`}
                    </p>
                    {entry.subtype && <SubtypeBadge subtype={entry.subtype} />}
                  </div>
                  <p className="text-xs text-fm-text-muted flex items-center gap-2">
                    <Calendar size={12} />
                    {new Date(entry.date).toLocaleDateString('de-DE')}
                    {entry.time_of_day && ` · ${entry.time_of_day.slice(0, 5)}`}
                    {parseFloat(entry.cost) > 0 && ` · ${parseFloat(entry.cost).toFixed(2)} €`}
                  </p>
                </div>
                <button onClick={() => handleDeleteEntry(entry.id)} className="fm-btn-ghost p-1 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
