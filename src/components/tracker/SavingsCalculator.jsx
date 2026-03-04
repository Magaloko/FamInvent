import { useState } from 'react'
import { TRACKER_LABELS } from '@/lib/constants'

export default function SavingsCalculator({ avgPerDay = 0, costPerUnit = 0 }) {
  const [reduction, setReduction] = useState(Math.max(1, Math.round(avgPerDay * 0.3)))

  const dailySaving = reduction * costPerUnit
  const monthlySaving = dailySaving * 30
  const yearlySaving = dailySaving * 365

  if (avgPerDay <= 0 || costPerUnit <= 0) return null

  return (
    <div className="fm-card-static p-4">
      <h3 className="font-heading font-bold text-fm-text text-sm mb-3">
        {TRACKER_LABELS.ersparnisRechner}
      </h3>
      <div className="space-y-3">
        <div>
          <label className="fm-label flex justify-between">
            <span>{reduction} {TRACKER_LABELS.wenigerProTag}</span>
            <span className="text-fm-primary font-bold">{(avgPerDay - reduction).toFixed(1)}/Tag</span>
          </label>
          <input
            type="range"
            min="1"
            max={Math.max(Math.round(avgPerDay), 2)}
            value={reduction}
            onChange={(e) => setReduction(parseInt(e.target.value))}
            className="w-full accent-green-500"
          />
          <div className="flex justify-between text-xs text-fm-text-muted">
            <span>1 weniger</span>
            <span>Alle ({Math.round(avgPerDay)})</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-green-50 rounded-card">
            <p className="text-lg font-heading font-bold text-green-600">{dailySaving.toFixed(2)} €</p>
            <p className="text-[10px] text-fm-text-muted">{TRACKER_LABELS.proTag} {TRACKER_LABELS.gespart}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-card">
            <p className="text-lg font-heading font-bold text-green-600">{monthlySaving.toFixed(2)} €</p>
            <p className="text-[10px] text-fm-text-muted">{TRACKER_LABELS.proMonat}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-card">
            <p className="text-lg font-heading font-bold text-green-700">{yearlySaving.toFixed(0)} €</p>
            <p className="text-[10px] text-fm-text-muted">{TRACKER_LABELS.proJahr}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
