export default function GoalProgressBar({ current, goal, direction = 'max', unit = '' }) {
  if (!goal || goal <= 0) return null

  const percent = Math.min((current / goal) * 100, 100)
  const overLimit = direction === 'max' && current > goal
  const metGoal = direction === 'min' ? current >= goal : current <= goal

  // max → green at low, yellow at mid, red at high
  // min → red at low, yellow at mid, green at high
  let barColor = 'bg-green-500'
  if (direction === 'max') {
    if (percent > 80) barColor = 'bg-red-500'
    else if (percent > 50) barColor = 'bg-yellow-500'
  } else {
    if (percent < 30) barColor = 'bg-red-500'
    else if (percent < 70) barColor = 'bg-yellow-500'
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-fm-text-muted mb-1">
        <span>{current} {unit}</span>
        <span>
          {direction === 'max' ? 'max' : 'min'} {goal} {unit}
        </span>
      </div>
      <div className="h-3 bg-fm-bg-input rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {overLimit && (
        <p className="text-xs text-red-500 mt-1 text-center font-medium">
          Limit überschritten! ({current}/{goal})
        </p>
      )}
      {metGoal && !overLimit && (
        <p className="text-xs text-green-600 mt-1 text-center font-medium">
          ✓ Ziel {direction === 'min' ? 'erreicht' : 'eingehalten'}
        </p>
      )}
    </div>
  )
}
