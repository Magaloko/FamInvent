export default function StreakBadge({ current, best }) {
  if (!current && !best) return null

  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <p className="text-2xl font-heading font-bold text-fm-text">
          {current > 0 ? '🔥' : '💤'} {current}
        </p>
        <p className="text-[10px] text-fm-text-muted">Tage in Folge</p>
      </div>
      {best > 0 && (
        <div className="text-center border-l border-fm-border pl-3">
          <p className="text-lg font-heading font-bold text-fm-text-light">🏆 {best}</p>
          <p className="text-[10px] text-fm-text-muted">Bester Streak</p>
        </div>
      )}
    </div>
  )
}
