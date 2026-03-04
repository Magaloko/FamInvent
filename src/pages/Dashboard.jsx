import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getTopToys, getPlayLogs } from '@/lib/api'
import { LABELS, CHART_COLORS } from '@/lib/constants'
import { Package, FolderOpen, Euro, Clock, Plus, Gamepad2, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [topToys, setTopToys] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [statsRes, toysRes, logsRes] = await Promise.all([
        getStats(),
        getTopToys(),
        getPlayLogs({ limit: 5 }),
      ])
      setStats(statsRes.data)
      setTopToys(toysRes.data || [])
      setRecentLogs(logsRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="fm-stat-card h-24 animate-pulse bg-fm-border/30" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: LABELS.totalValue, value: `${(stats?.totalValue || 0).toFixed(0)} ${LABELS.euro}`, icon: Euro, color: 'text-fm-primary' },
    { label: LABELS.totalCollections, value: stats?.totalCollections || 0, icon: FolderOpen, color: 'text-fm-secondary' },
    { label: LABELS.totalItems, value: stats?.totalItems || 0, icon: Package, color: 'text-fm-purple' },
    { label: LABELS.playHours, value: `${Math.round((stats?.totalPlayMinutes || 0) / 60)}h`, icon: Clock, color: 'text-fm-yellow' },
  ]

  const maxToyScore = topToys.length ? topToys[0].score : 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="fm-page-title">{LABELS.dashboard}</h1>
        <Link to="/collections?new=1" className="fm-btn-primary text-sm">
          <Plus size={16} /> {LABELS.newCollection}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="fm-stat-card">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-btn bg-fm-bg-input ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-fm-text-muted font-heading">{s.label}</p>
                <p className="text-xl font-heading font-bold text-fm-text">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 5 Toys */}
        <div className="fm-card-static p-5">
          <h2 className="font-heading font-bold text-fm-text mb-4 flex items-center gap-2">
            <Gamepad2 size={18} className="text-fm-primary" />
            {LABELS.topToys}
          </h2>
          {topToys.length === 0 ? (
            <p className="text-sm text-fm-text-muted text-center py-6">
              {LABELS.noPlayLogs}
            </p>
          ) : (
            <div className="space-y-3">
              {topToys.map((toy, i) => (
                <div key={toy.id} className="flex items-center gap-3">
                  <span className="w-6 text-center font-heading font-bold text-fm-text-muted">
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-fm-bg-input flex items-center justify-center text-lg flex-shrink-0">
                    {toy.image_url ? (
                      <img src={toy.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : '🧸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fm-text truncate">{toy.name}</p>
                    <div className="mt-1 h-1.5 bg-fm-bg-input rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-fm-primary transition-all"
                        style={{ width: `${(toy.score / maxToyScore) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-fm-text-muted flex-shrink-0">
                    {toy.totalPlays} {LABELS.times}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Value by Collection Chart */}
        <div className="fm-card-static p-5">
          <h2 className="font-heading font-bold text-fm-text mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-fm-secondary" />
            {LABELS.valueByCollection}
          </h2>
          {(stats?.valueByCollection || []).length === 0 ? (
            <p className="text-sm text-fm-text-muted text-center py-6">
              {LABELS.noCollections}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.valueByCollection} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12, fill: '#BCAAA4' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12, fill: '#3E2723' }}
                />
                <Tooltip
                  formatter={(v) => [`${v.toFixed(0)} ${LABELS.euro}`, LABELS.value]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #F5E6D8',
                    borderRadius: '10px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="value" fill="#FF8A65" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="fm-card-static p-5">
        <h2 className="font-heading font-bold text-fm-text mb-4">
          {LABELS.recentActivity}
        </h2>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-fm-text-muted text-center py-4">
            {LABELS.noPlayLogs}
          </p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-fm-border last:border-0">
                <span className="text-lg">🎮</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-fm-text">
                    Mit <strong>{log.fm_items?.name || '...'}</strong> gespielt
                  </p>
                  <p className="text-xs text-fm-text-muted">
                    {new Date(log.played_at).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {log.duration_minutes && ` · ${log.duration_minutes} Min.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
