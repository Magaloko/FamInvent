import { PURCHASE_STATUSES, SALE_STATUSES } from '@/lib/constants'

export function PurchaseStatusBadge({ status }) {
  const s = PURCHASE_STATUSES.find((x) => x.id === status)
  if (!s) return null
  return <span className={`fm-badge text-xs ${s.color}`}>{s.icon} {s.label}</span>
}

export function SaleStatusBadge({ status }) {
  const s = SALE_STATUSES.find((x) => x.id === status)
  if (!s) return null
  return <span className={`fm-badge text-xs ${s.color}`}>{s.icon} {s.label}</span>
}
