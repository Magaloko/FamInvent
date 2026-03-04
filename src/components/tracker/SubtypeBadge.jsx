import { SMOKING_SUBTYPES } from '@/lib/constants'

export default function SubtypeBadge({ subtype }) {
  const st = SMOKING_SUBTYPES.find((s) => s.id === subtype)
  if (!st) return subtype ? <span className="fm-badge bg-fm-bg-input text-fm-text-light text-xs">{subtype}</span> : null

  return (
    <span className={`fm-badge text-xs ${st.color}`}>
      {st.icon} {st.name}
    </span>
  )
}
