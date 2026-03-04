import { SMOKING_SUBTYPES, TRACKER_LABELS } from '@/lib/constants'

export default function CostBreakdown({ costPerBought = 0, rolledCost = 0, avgPerDay = 0 }) {
  const eZigCost = costPerBought * 0.4

  const rows = [
    { ...SMOKING_SUBTYPES[0], price: costPerBought },
    { ...SMOKING_SUBTYPES[1], price: rolledCost },
    { ...SMOKING_SUBTYPES[2], price: eZigCost },
  ]

  return (
    <div className="fm-card-static p-4">
      <h3 className="font-heading font-bold text-fm-text text-sm mb-3">{TRACKER_LABELS.kostenvergleich}</h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`fm-badge text-xs ${r.color}`}>{r.icon} {r.name}</span>
            </span>
            <div className="text-right">
              <span className="font-heading font-bold text-fm-text">{r.price.toFixed(3)} €</span>
              <span className="text-xs text-fm-text-muted ml-2">/ Stk.</span>
            </div>
          </div>
        ))}
      </div>
      {avgPerDay > 0 && (
        <div className="mt-3 pt-3 border-t border-fm-border">
          <p className="text-xs text-fm-text-muted mb-2">Hochrechnung bei {avgPerDay.toFixed(1)}/Tag (gekauft)</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-fm-text">{(avgPerDay * costPerBought).toFixed(2)} €</p>
              <p className="text-fm-text-muted">{TRACKER_LABELS.proTag}</p>
            </div>
            <div>
              <p className="font-bold text-fm-text">{(avgPerDay * costPerBought * 30).toFixed(2)} €</p>
              <p className="text-fm-text-muted">{TRACKER_LABELS.proMonat}</p>
            </div>
            <div>
              <p className="font-bold text-red-500">{(avgPerDay * costPerBought * 365).toFixed(2)} €</p>
              <p className="text-fm-text-muted">{TRACKER_LABELS.proJahr}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
