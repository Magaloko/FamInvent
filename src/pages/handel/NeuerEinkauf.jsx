import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProduct, createPurchase, generateBatchId, getBatchIdsForProduct } from '@/lib/api-handel'
import { HANDEL_LABELS, PRODUCT_UNITS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NeuerEinkauf() {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  const [quantity, setQuantity] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [supplier, setSupplier] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [batchId, setBatchId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [prodRes, batchRes] = await Promise.all([
        getProduct(productId),
        getBatchIdsForProduct(productId),
      ])
      setProduct(prodRes.data)
      if (prodRes.data) {
        setBatchId(generateBatchId(prodRes.data.name, batchRes.data || []))
      }
      setLoading(false)
    }
    load()
  }, [productId])

  const qty = parseFloat(quantity) || 0
  const price = parseFloat(totalPrice) || 0
  const pricePerUnit = qty > 0 ? price / qty : 0

  const unitShort = PRODUCT_UNITS.find((u) => u.id === product?.unit)?.short || product?.unit || ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!qty || !price) return
    setSaving(true)
    const { error } = await createPurchase({
      product_id: productId,
      batch_id: batchId,
      quantity: qty,
      total_price: price,
      supplier,
      purchase_date: purchaseDate,
      notes,
    })
    if (error) toast.error(error)
    else { toast.success('Einkauf erfasst!'); navigate(`/handel/produkte/${productId}`) }
    setSaving(false)
  }

  if (loading) return <div className="animate-fade-in"><div className="h-64 bg-fm-border/20 rounded-card animate-pulse" /></div>
  if (!product) return <p className="text-center text-fm-text-muted py-16">Produkt nicht gefunden</p>

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <Link to={`/handel/produkte/${productId}`} className="fm-btn-ghost text-sm inline-flex">
        <ArrowLeft size={16} /> {product.name}
      </Link>

      <h1 className="fm-page-title">{HANDEL_LABELS.neuerEinkauf}</h1>

      {/* Batch ID Preview */}
      <div className="fm-card-static p-4">
        <p className="text-xs text-fm-text-muted mb-1">{HANDEL_LABELS.chargenNr}</p>
        <p className="font-heading font-bold text-fm-primary text-lg">{batchId}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="fm-label">{HANDEL_LABELS.menge} ({unitShort})</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="fm-input" placeholder="z.B. 1000" min="0.001" step="0.001" autoFocus />
          </div>
          <div>
            <label className="fm-label">{HANDEL_LABELS.gesamtpreis} (€)</label>
            <input type="number" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} className="fm-input" placeholder="z.B. 60.00" min="0.01" step="0.01" />
          </div>
        </div>

        {/* Live price per unit */}
        {qty > 0 && price > 0 && (
          <div className="p-3 bg-fm-bg-input rounded-card text-center">
            <p className="text-xs text-fm-text-muted">{HANDEL_LABELS.preisProEinheit}</p>
            <p className="text-lg font-heading font-bold text-fm-primary">{pricePerUnit.toFixed(4)} € / {unitShort}</p>
          </div>
        )}

        <div>
          <label className="fm-label">{HANDEL_LABELS.lieferant}</label>
          <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="fm-input" placeholder="z.B. Import GmbH" />
        </div>

        <div>
          <label className="fm-label">{HANDEL_LABELS.einkaufsdatum}</label>
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="fm-input" />
        </div>

        <div>
          <label className="fm-label">Notizen</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="fm-input" rows={2} placeholder="Optional..." />
        </div>

        <button type="submit" disabled={saving || !qty || !price} className="fm-btn-primary w-full">
          {saving ? 'Speichern...' : HANDEL_LABELS.neuerEinkauf + ' erfassen'}
        </button>
      </form>
    </div>
  )
}
