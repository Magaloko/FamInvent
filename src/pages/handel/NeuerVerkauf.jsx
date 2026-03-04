import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPurchase, createSale } from '@/lib/api-handel'
import { HANDEL_LABELS, PRODUCT_UNITS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NeuerVerkauf() {
  const { purchaseId } = useParams()
  const navigate = useNavigate()
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)

  const [buyer, setBuyer] = useState('')
  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await getPurchase(purchaseId)
      setPurchase(data)
      setLoading(false)
    }
    load()
  }, [purchaseId])

  const qty = parseFloat(quantity) || 0
  const price = parseFloat(salePrice) || 0
  const remaining = purchase?.remaining || 0
  const pricePerUnit = purchase?.pricePerUnit || 0
  const unitShort = PRODUCT_UNITS.find((u) => u.id === purchase?.fm_products?.unit)?.short || ''

  const costOfSale = qty * pricePerUnit
  const saleProfit = price - costOfSale
  const isOverStock = qty > remaining

  async function handleSubmit(e) {
    e.preventDefault()
    if (!buyer.trim() || !qty || !price || isOverStock) return
    setSaving(true)
    const { error } = await createSale({
      purchase_id: purchaseId,
      buyer: buyer.trim(),
      quantity: qty,
      sale_price: price,
      sale_date: saleDate,
      notes,
    })
    if (error) toast.error(error)
    else { toast.success('Verkauf erfasst!'); navigate(`/handel/einkauf/${purchaseId}`) }
    setSaving(false)
  }

  if (loading) return <div className="animate-fade-in"><div className="h-64 bg-fm-border/20 rounded-card animate-pulse" /></div>
  if (!purchase) return <p className="text-center text-fm-text-muted py-16">Einkauf nicht gefunden</p>

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <Link to={`/handel/einkauf/${purchaseId}`} className="fm-btn-ghost text-sm inline-flex">
        <ArrowLeft size={16} /> {purchase.batch_id}
      </Link>

      <h1 className="fm-page-title">{HANDEL_LABELS.neuerVerkauf}</h1>

      {/* Stock Info */}
      <div className="fm-card-static p-4 flex justify-between">
        <div>
          <p className="text-xs text-fm-text-muted">{HANDEL_LABELS.restbestand}</p>
          <p className="text-lg font-heading font-bold text-fm-text">{remaining.toFixed(1)} {unitShort}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-fm-text-muted">{HANDEL_LABELS.preisProEinheit}</p>
          <p className="text-lg font-heading font-bold text-fm-text-light">{pricePerUnit.toFixed(2)} €/{unitShort}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="fm-label">{HANDEL_LABELS.käufer}</label>
          <input type="text" value={buyer} onChange={(e) => setBuyer(e.target.value)} className="fm-input" placeholder="z.B. Händler A, Teehaus Berlin..." autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="fm-label">{HANDEL_LABELS.menge} ({unitShort})</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`fm-input ${isOverStock ? 'border-red-400 bg-red-50' : ''}`} placeholder="z.B. 100" min="0.001" step="0.001" max={remaining} />
            {isOverStock && <p className="text-xs text-red-500 mt-1">Nicht genug Bestand!</p>}
          </div>
          <div>
            <label className="fm-label">{HANDEL_LABELS.verkaufspreis} (€)</label>
            <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="fm-input" placeholder="z.B. 15.00" min="0.01" step="0.01" />
          </div>
        </div>

        {/* Live profit preview */}
        {qty > 0 && price > 0 && !isOverStock && (
          <div className={`p-3 rounded-card text-center ${saleProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-fm-text-muted">{HANDEL_LABELS.gewinn} für diesen Verkauf</p>
            <p className={`text-lg font-heading font-bold ${saleProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {saleProfit >= 0 ? '+' : ''}{saleProfit.toFixed(2)} €
            </p>
            <p className="text-xs text-fm-text-muted">
              (Kosten: {costOfSale.toFixed(2)} € · Preis/Einheit: {(qty > 0 ? price / qty : 0).toFixed(2)} €/{unitShort})
            </p>
          </div>
        )}

        <div>
          <label className="fm-label">{HANDEL_LABELS.verkaufsdatum}</label>
          <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="fm-input" />
        </div>

        <div>
          <label className="fm-label">Notizen</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="fm-input" rows={2} placeholder="Optional..." />
        </div>

        <button type="submit" disabled={saving || !buyer.trim() || !qty || !price || isOverStock} className="fm-btn-primary w-full">
          {saving ? 'Speichern...' : HANDEL_LABELS.neuerVerkauf + ' erfassen'}
        </button>
      </form>
    </div>
  )
}
