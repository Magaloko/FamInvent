import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHandelStats } from '@/lib/api-handel'
import { HANDEL_LABELS } from '@/lib/constants'
import { ShoppingCart, Package, Euro, TrendingUp, AlertTriangle, Clock, Plus } from 'lucide-react'

export default function HandelDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await getHandelStats()
      setStats(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="fm-stat-card h-24 animate-pulse bg-fm-border/30" />)}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: HANDEL_LABELS.gewinnProMonat, value: `${(stats?.monthlyProfit || 0).toFixed(2)} €`, icon: TrendingUp, color: 'text-green-600' },
    { label: HANDEL_LABELS.lagerwert, value: `${(stats?.lagerwert || 0).toFixed(2)} €`, icon: Euro, color: 'text-fm-primary' },
    { label: HANDEL_LABELS.aktiveChargen, value: stats?.totalActiveBatches || 0, icon: Package, color: 'text-fm-secondary' },
    { label: HANDEL_LABELS.offeneVerkäufe, value: stats?.openSales || 0, icon: ShoppingCart, color: 'text-fm-yellow' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="fm-page-title">{HANDEL_LABELS.handelDashboard}</h1>
        <Link to="/handel/produkte" className="fm-btn-primary text-sm">
          <Plus size={16} /> {HANDEL_LABELS.neuesProdukt}
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
        {/* Quick Links */}
        <div className="fm-card-static p-5">
          <h2 className="font-heading font-bold text-fm-text mb-4">Schnellzugriff</h2>
          <div className="space-y-2">
            <Link to="/handel/produkte" className="flex items-center gap-3 p-3 bg-fm-bg-input rounded-card hover:bg-fm-border/30 transition-colors">
              <Package size={20} className="text-fm-primary" />
              <div>
                <p className="text-sm font-medium text-fm-text">{HANDEL_LABELS.produkte}</p>
                <p className="text-xs text-fm-text-muted">{stats?.totalProducts || 0} Produkte aktiv</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Warnings */}
        <div className="fm-card-static p-5">
          <h2 className="font-heading font-bold text-fm-text mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            Warnungen
          </h2>

          {(!stats?.lowStock?.length && !stats?.agingBatches?.length) ? (
            <p className="text-sm text-fm-text-muted text-center py-4">Keine Warnungen</p>
          ) : (
            <div className="space-y-2">
              {(stats?.lowStock || []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-card">
                  <span className="text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-fm-text">{item.name}</p>
                    <p className="text-xs text-yellow-700">{HANDEL_LABELS.niedrigerBestand}: {item.remaining.toFixed(1)} übrig</p>
                  </div>
                </div>
              ))}
              {(stats?.agingBatches || []).map((batch) => (
                <div key={batch.id} className="flex items-center gap-3 p-2 bg-orange-50 rounded-card">
                  <Clock size={16} className="text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-fm-text">{batch.batch_id}</p>
                    <p className="text-xs text-orange-700">{HANDEL_LABELS.alterWarnung}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
