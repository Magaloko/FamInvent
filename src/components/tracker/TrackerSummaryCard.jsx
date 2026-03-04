import { Link } from 'react-router-dom'
import GoalProgressBar from './GoalProgressBar'
import QuickAddButton from './QuickAddButton'

export default function TrackerSummaryCard({ tracker, onQuickAdd }) {
  const { todayCount = 0, todayCost = 0, todayDuration = 0 } = tracker
  const showCost = ['kosten', 'kombi'].includes(tracker.type)
  const showDuration = tracker.type === 'zeit'

  return (
    <div className="fm-card-static p-4">
      <div className="flex items-start justify-between mb-3">
        <Link to={`/tracker/${tracker.id}`} className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl">{tracker.icon}</span>
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-fm-text text-sm truncate">{tracker.name}</h3>
            <p className="text-xs text-fm-text-muted">
              Heute: {todayCount} {tracker.unit}
              {showCost && todayCost > 0 && ` · ${todayCost.toFixed(2)} €`}
              {showDuration && todayDuration > 0 && ` · ${todayDuration} Min.`}
            </p>
          </div>
        </Link>
        <QuickAddButton tracker={tracker} onAdded={onQuickAdd} />
      </div>

      {tracker.daily_goal > 0 && (
        <GoalProgressBar
          current={showDuration ? todayDuration : todayCount}
          goal={tracker.daily_goal}
          direction={tracker.goal_direction}
          unit={tracker.unit}
        />
      )}
    </div>
  )
}
