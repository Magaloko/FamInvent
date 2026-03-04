import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTrackerStats } from '@/lib/api-tracker'
import { TRACKER_LABELS } from '@/lib/constants'
import TrackerSummaryCard from '@/components/tracker/TrackerSummaryCard'
import { Plus, ClipboardList, TrendingDown, TrendingUp } from 'lucide-react'

export default function TrackerDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await getTrackerStats()
    setStats(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-fm-border/30 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="fm-stat-card h-20 animate-pulse bg-fm-border/20" />)}
        </div>
      </div>
    )
  }

  const { trackers, todayTotal, todayCost, weekTrend } = stats

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="fm-page-title">{TRACKER_LABELS.trackerDashboard}</h1>
        <Link to="/tracker/liste" className="fm-btn-primary text-sm">
          <Plus size={16} /> {TRACKER_LABELS.neuerTracker}
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{TRACKER_LABELS.heute}</p>
          <p className="text-xl font-heading font-bold text-fm-text">{todayTotal}</p>
          <p className="text-xs text-fm-text-muted">Einträge gesamt</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{TRACKER_LABELS.kosten} heute</p>
          <p className="text-xl font-heading font-bold text-red-500">{todayCost.toFixed(2)} €</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{TRACKER_LABELS.wochenvergleich}</p>
          <div className="flex items-center gap-1">
            {weekTrend <= 0 ? <TrendingDown size={16} className="text-green-600" /> : <TrendingUp size={16} className="text-red-500" />}
            <p className={`text-xl font-heading font-bold ${weekTrend <= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {weekTrend > 0 ? '+' : ''}{weekTrend.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Tracker Cards with Quick-Add */}
      {trackers.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={48} className="text-fm-text-muted mx-auto mb-3" />
          <p className="text-fm-text-muted mb-4">{TRACKER_LABELS.keineTracker}</p>
          <Link to="/tracker/liste" className="fm-btn-primary text-sm">
            Tracker erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-fm-text">{TRACKER_LABELS.trackerListe}</h2>
          {trackers.map((t) => (
            <TrackerSummaryCard key={t.id} tracker={t} onQuickAdd={loadData} />
          ))}
        </div>
      )}

      {/* Quick link */}
      <div className="text-center">
        <Link to="/tracker/liste" className="text-sm text-fm-text-muted hover:text-fm-text transition-colors">
          Alle Tracker verwalten →
        </Link>
      </div>
    </div>
  )
}
