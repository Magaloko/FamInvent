import { useState } from 'react'
import { createEntry } from '@/lib/api-tracker'
import toast from 'react-hot-toast'

export default function QuickAddButton({ tracker, materials = [], onAdded }) {
  const [adding, setAdding] = useState(false)

  async function handleQuickAdd() {
    setAdding(true)
    const entry = {
      tracker_id: tracker.id,
      date: new Date().toISOString().split('T')[0],
      count: 1,
      time_of_day: new Date().toTimeString().split(' ')[0].slice(0, 5),
    }

    // For smoking tracker with cost_per_unit (bought)
    if (tracker.cost_per_unit > 0 && !tracker.has_subtypes) {
      entry.cost = tracker.cost_per_unit
    }

    // For smoking tracker, default to "gekauft"
    if (tracker.is_smoking_tracker && tracker.has_subtypes) {
      entry.subtype = 'gekauft'
      entry.cost = parseFloat(tracker.cost_per_unit) || 0
    }

    const { error } = await createEntry(entry, materials)
    if (error) toast.error(error)
    else {
      toast.success('+1 eingetragen')
      onAdded?.()
    }
    setAdding(false)
  }

  return (
    <button
      onClick={handleQuickAdd}
      disabled={adding}
      className="fm-btn-primary text-sm px-3 py-1.5 min-w-[44px]"
      style={{ backgroundColor: tracker.color }}
    >
      {adding ? '...' : '+1'}
    </button>
  )
}
