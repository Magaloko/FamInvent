import { useState, useEffect } from 'react'
import { useFamily } from '@/lib/FamilyContext'
import { getFamilyStats, getTopToys } from '@/lib/api'
import { LABELS, CHART_COLORS } from '@/lib/constants'
import { BarChart3, Gamepad2, PieChart as PieIcon } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export default function Statistics() {
  const { family } = useFamily()
  const [stats, setStats] = useState(null)
  const [topToys, setTopToys] = useState([])
  const [tab, setTab] = useState('value')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!family) return
    async function load() {
      setLoading(true)
      const [statsRes, toysRes] = await Promise.all([
        getFamilyStats(family.id),
        getTopToys(family.id),
      ])
      setStats(statsRes.data)
      setTopToys(toysRes.data || [])
      setLoading(false)
    }
    load()
  }, [family])

  const tabs = [
    { key: 'value', label: LABELS.valueTab, icon: BarChart3 },
    { key: 'play', label: LABELS.playTab, icon: Gamepad2 },
    { key: 'categories', label: LABELS.collectionsTab, icon: PieIcon },
  ]

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-fm-border/30 rounded animate-pulse" />
        <div className="h-64 bg-fm-border/20 rounded-card animate-pulse" />
      </div>
    )
  }

  const tooltipStyle = {
    backgroundColor: 'white',
    border: '1px solid #F5E6D8',
    borderRadius: '10px',
    fontSize: '13px',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="fm-page-title">{LABELS.statistics}</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-heading font-medium transition-all ${
              tab === t.key
                ? 'bg-fm-primary text-white shadow-btn'
                : 'bg-white text-fm-text-light border border-fm-border'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Value Tab */}
      {tab === 'value' && (
        <div className="space-y-6">
          <div className="fm-card-static p-5">
            <h2 className="font-heading font-bold text-fm-text mb-4">{LABELS.valueByCollection}</h2>
            {(stats?.valueByCollection || []).length === 0 ? (
              <p className="text-sm text-fm-text-muted text-center py-8">{LABELS.noCollections}</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.valueByCollection} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#BCAAA4' }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#3E2723' }} />
                  <Tooltip formatter={(v) => [`${v.toFixed(0)} ${LABELS.euro}`, LABELS.value]} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#FF8A65" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="fm-stat-card text-center">
              <p className="text-3xl font-heading font-bold text-fm-primary">
                {(stats?.totalValue || 0).toFixed(0)} {LABELS.euro}
              </p>
              <p className="text-sm text-fm-text-muted mt-1">{LABELS.totalValue}</p>
            </div>
            <div className="fm-stat-card text-center">
              <p className="text-3xl font-heading font-bold text-fm-secondary">
                {stats?.totalItems || 0}
              </p>
              <p className="text-sm text-fm-text-muted mt-1">{LABELS.totalItems}</p>
            </div>
          </div>
        </div>
      )}

      {/* Play Tab */}
      {tab === 'play' && (
        <div className="space-y-6">
          <div className="fm-card-static p-5">
            <h2 className="font-heading font-bold text-fm-text mb-4">{LABELS.topToys}</h2>
            {topToys.length === 0 ? (
              <p className="text-sm text-fm-text-muted text-center py-8">{LABELS.noPlayLogs}</p>
            ) : (
              <div className="space-y-3">
                {topToys.map((toy, i) => {
                  const maxScore = topToys[0].score || 1
                  return (
                    <div key={toy.id} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-fm-primary/10 flex items-center justify-center text-sm font-heading font-bold text-fm-primary">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fm-text truncate">{toy.name}</p>
                        <div className="mt-1 h-2 bg-fm-bg-input rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(toy.score / maxScore) * 100}%`,
                              backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-fm-text">{toy.totalPlays}x</p>
                        <p className="text-xs text-fm-text-muted">{toy.recentPlays} letzte 30T</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="fm-stat-card text-center">
            <p className="text-3xl font-heading font-bold text-fm-yellow">
              {Math.round((stats?.totalPlayMinutes || 0) / 60)}h
            </p>
            <p className="text-sm text-fm-text-muted mt-1">{LABELS.playHours}</p>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="fm-card-static p-5">
          <h2 className="font-heading font-bold text-fm-text mb-4">{LABELS.categoryDistribution}</h2>
          {(stats?.categoryDistribution || []).length === 0 ? (
            <p className="text-sm text-fm-text-muted text-center py-8">{LABELS.noItems}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  label={({ name, count }) => `${name} (${count})`}
                  labelLine={false}
                >
                  {stats.categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}
