import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTracker, getMaterials, createMaterial, updateMaterial, deleteMaterial } from '@/lib/api-tracker'
import { computeRolledCigCost } from '@/lib/api-tracker'
import { TRACKER_LABELS } from '@/lib/constants'
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrackerMaterialien() {
  const { id } = useParams()
  const [tracker, setTracker] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form
  const [name, setName] = useState('')
  const [pkgAmount, setPkgAmount] = useState('')
  const [pkgUnit, setPkgUnit] = useState('g')
  const [pkgPrice, setPkgPrice] = useState('')
  const [usagePerCig, setUsagePerCig] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [tRes, mRes] = await Promise.all([getTracker(id), getMaterials(id)])
    setTracker(tRes.data)
    setMaterials(mRes.data)
    setLoading(false)
  }

  function resetForm() {
    setName(''); setPkgAmount(''); setPkgUnit('g'); setPkgPrice(''); setUsagePerCig('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await createMaterial({
      tracker_id: id,
      name: name.trim(),
      package_amount: parseFloat(pkgAmount) || 1,
      package_unit: pkgUnit,
      package_price: parseFloat(pkgPrice) || 0,
      usage_per_cig: parseFloat(usagePerCig) || 1,
    })
    if (error) toast.error(error)
    else { toast.success('Material angelegt!'); setShowForm(false); resetForm(); loadData() }
    setSaving(false)
  }

  async function handleDelete(matId) {
    if (!confirm('Material löschen?')) return
    const { error } = await deleteMaterial(matId)
    if (error) toast.error(error)
    else { toast.success('Material gelöscht'); loadData() }
  }

  if (loading) return <div className="animate-fade-in"><div className="h-64 bg-fm-border/20 rounded-card animate-pulse" /></div>
  if (!tracker) return <p className="text-center text-fm-text-muted py-16">Tracker nicht gefunden</p>

  const costPerCig = computeRolledCigCost(materials)

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <Link to={`/tracker/${id}`} className="fm-btn-ghost text-sm inline-flex">
        <ArrowLeft size={16} /> {tracker.name}
      </Link>

      <h1 className="fm-page-title">{TRACKER_LABELS.materialien}</h1>

      {/* Cost preview */}
      <div className="fm-card-static p-4 text-center">
        <p className="text-xs text-fm-text-muted mb-1">{TRACKER_LABELS.kostenProStück} (gedreht)</p>
        <p className="text-2xl font-heading font-bold text-fm-primary">{costPerCig.toFixed(4)} €</p>
        {materials.length > 0 && (
          <p className="text-xs text-fm-text-muted mt-1">
            Berechnet aus {materials.length} Materialien
          </p>
        )}
      </div>

      {/* Materials list */}
      <div className="space-y-3">
        {materials.map((m) => {
          const pricePerUnit = (parseFloat(m.package_price) / parseFloat(m.package_amount)).toFixed(4)
          const costContribution = (pricePerUnit * parseFloat(m.usage_per_cig)).toFixed(4)
          return (
            <div key={m.id} className="fm-card-static p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-heading font-bold text-fm-text text-sm">{m.name}</p>
                  <p className="text-xs text-fm-text-muted mt-1">
                    {m.package_amount} {m.package_unit} · {parseFloat(m.package_price).toFixed(2)} €
                  </p>
                  <p className="text-xs text-fm-text-muted">
                    Verbrauch: {m.usage_per_cig} {m.package_unit}/Stk. · Beitrag: {costContribution} €/Stk.
                  </p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="fm-btn-ghost p-1 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Material */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="fm-btn-primary w-full text-sm">
          <Plus size={16} /> Material hinzufügen
        </button>
      ) : (
        <div className="fm-card-static p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-fm-text text-sm">Neues Material</h3>
            <button onClick={() => { setShowForm(false); resetForm() }} className="fm-btn-ghost p-1"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="fm-label">{TRACKER_LABELS.materialName}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="fm-input" placeholder="z.B. Tabak (30g)" autoFocus />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="fm-label">{TRACKER_LABELS.packungsmenge}</label>
                <input type="number" value={pkgAmount} onChange={(e) => setPkgAmount(e.target.value)} className="fm-input" placeholder="30" min="0.01" step="0.01" />
              </div>
              <div>
                <label className="fm-label">Einheit</label>
                <select value={pkgUnit} onChange={(e) => setPkgUnit(e.target.value)} className="fm-select">
                  <option value="g">Gramm</option>
                  <option value="Stk.">Stück</option>
                  <option value="ml">Milliliter</option>
                </select>
              </div>
              <div>
                <label className="fm-label">{TRACKER_LABELS.packungspreis} (€)</label>
                <input type="number" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} className="fm-input" placeholder="7.00" min="0.01" step="0.01" />
              </div>
            </div>
            <div>
              <label className="fm-label">{TRACKER_LABELS.verbrauchProStück}</label>
              <input type="number" value={usagePerCig} onChange={(e) => setUsagePerCig(e.target.value)} className="fm-input" placeholder="0.7" min="0.001" step="0.001" />
              <p className="text-xs text-fm-text-muted mt-1">
                Wie viel {pkgUnit} wird pro Zigarette verbraucht?
              </p>
            </div>

            {/* Live preview */}
            {parseFloat(pkgAmount) > 0 && parseFloat(pkgPrice) > 0 && parseFloat(usagePerCig) > 0 && (
              <div className="p-3 bg-fm-bg-input rounded-card text-center">
                <p className="text-xs text-fm-text-muted">Kosten-Beitrag pro Stück</p>
                <p className="text-lg font-heading font-bold text-fm-primary">
                  {((parseFloat(pkgPrice) / parseFloat(pkgAmount)) * parseFloat(usagePerCig)).toFixed(4)} €
                </p>
              </div>
            )}

            <button type="submit" disabled={saving || !name.trim()} className="fm-btn-primary w-full">
              {saving ? 'Speichern...' : 'Material anlegen'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
