export default function MarginIndicator({ profit, marginPercent }) {
  const isPositive = profit >= 0
  const color = isPositive ? 'text-green-600' : 'text-red-600'
  const bg = isPositive ? 'bg-green-50' : 'bg-red-50'

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-btn ${bg}`}>
      <span className={`text-sm font-bold ${color}`}>
        {isPositive ? '+' : ''}{profit.toFixed(2)} €
      </span>
      <span className={`text-xs font-medium ${color}`}>
        ({marginPercent.toFixed(1)}%)
      </span>
    </div>
  )
}
