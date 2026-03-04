export default function StockProgressBar({ soldPercent, remaining, total, unit }) {
  const pct = Math.min(100, Math.max(0, soldPercent || 0))
  const color = pct >= 100 ? 'bg-gray-400' : pct > 50 ? 'bg-yellow-500' : 'bg-fm-secondary'

  return (
    <div>
      <div className="flex justify-between text-xs text-fm-text-muted mb-1">
        <span>Verkauft: {pct.toFixed(0)}%</span>
        <span>Rest: {remaining?.toFixed(1)} {unit}</span>
      </div>
      <div className="h-2 bg-fm-bg-input rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
