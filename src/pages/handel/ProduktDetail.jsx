import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProduct, getPurchases, deleteProduct } from '@/lib/api-handel'
import { HANDEL_LABELS, PRODUCT_CATEGORIES_HANDEL, PRODUCT_UNITS } from '@/lib/constants'
import { PurchaseStatusBadge } from '@/components/handel/StatusBadge'
import StockProgressBar from '@/components/handel/StockProgressBar'
import MarginIndicator from '@/components/handel/MarginIndicator'
import { ArrowLeft, Plus, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProduktDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [prodRes, purchRes] = await Promise.all([
      getProduct(id),
      getPurchases(id),
    ])
    setProduct(prodRes.data)
    setPurchases(purchRes.data || [])
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Produkt und alle Einkäufe/Verkäufe wirklich löschen?')) return
    const { error } = await deleteProduct(id)
    if (error) toast.error(error)
    else { toast.success('Produkt gelöscht'); navigate('/handel/produkte') }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="h-8 w-48 bg-fm-border/30 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="fm-card-static h-32 animate-pulse bg-fm-border/20" />)}
        </div>
      </div>
    )
  }

  if (!product) return <p className="text-center text-fm-text-muted py-16">Produkt nicht gefunden</p>

  const cat = PRODUCT_CATEGORIES_HANDEL.find((c) => c.id === product.category)
  const unitObj = PRODUCT_UNITS.find((u) => u.id === product.unit)
  const unitShort = unitObj?.short || product.unit

  // Aggregate metrics
  const totalStock = purchases.reduce((s, p) => s + (p.remaining || 0), 0)
  const totalProfit = purchases.reduce((s, p) => s + (p.profit || 0), 0)
  const totalRevenue = purchases.reduce((s, p) => s + (p.totalRevenue || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/handel/produkte" className="fm-btn-ghost text-sm inline-flex">
        <ArrowLeft size={16} /> {HANDEL_LABELS.produkte}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{cat?.icon || '📦'}</span>
          <div>
            <h1 className="fm-page-title">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="fm-badge bg-fm-bg-input text-fm-text-light">{unitShort}</span>
              {cat && <span className="text-sm text-fm-text-muted">{cat.name}</span>}
            </div>
          </div>
        </div>
        <button onClick={handleDelete} className="fm-btn-ghost p-2 text-red-400 hover:text-red-600">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{HANDEL_LABELS.lagerbestand}</p>
          <p className="text-xl font-heading font-bold text-fm-text">{totalStock.toFixed(1)} {unitShort}</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{HANDEL_LABELS.einkäufe}</p>
          <p className="text-xl font-heading font-bold text-fm-text">{purchases.length}</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{HANDEL_LABELS.umsatz}</p>
          <p className="text-xl font-heading font-bold text-fm-secondary">{totalRevenue.toFixed(2)} €</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{HANDEL_LABELS.gewinn}</p>
          <p className={`text-xl font-heading font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} €</p>
        </div>
      </div>

      {/* New Purchase Button */}
      <div className="flex justify-end">
        <Link to={`/handel/produkte/${id}/einkauf/neu`} className="fm-btn-primary text-sm">
          <Plus size={16} /> {HANDEL_LABELS.neuerEinkauf}
        </Link>
      </div>

      {/* Purchases List */}
      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="text-fm-text-muted mx-auto mb-3" />
          <p className="text-fm-text-muted">{HANDEL_LABELS.keineEinkäufe}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-heading font-bold text-fm-text">{HANDEL_LABELS.einkäufe}</h2>
          {purchases.map((p) => (
            <Link key={p.id} to={`/handel/einkauf/${p.id}`} className="fm-card p-4 block">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-heading font-bold text-fm-text">{p.batch_id}</p>
                  <p className="text-xs text-fm-text-muted">
                    {new Date(p.purchase_date).toLocaleDateString('de-DE')}
                    {p.supplier && ` · ${p.supplier}`}
                  </p>
                </div>
                <PurchaseStatusBadge status={p.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <p className="text-xs text-fm-text-muted">{HANDEL_LABELS.menge}</p>
                  <p className="font-medium">{parseFloat(p.quantity).toFixed(1)} {unitShort}</p>
                </div>
                <div>
                  <p className="text-xs text-fm-text-muted">{HANDEL_LABELS.preisProEinheit}</p>
                  <p className="font-medium">{p.pricePerUnit.toFixed(2)} €/{unitShort}</p>
                </div>
                <div>
                  <p className="text-xs text-fm-text-muted">{HANDEL_LABELS.gewinn}</p>
                  <MarginIndicator profit={p.profit} marginPercent={p.marginPercent} />
                </div>
              </div>

              <StockProgressBar soldPercent={p.soldPercent} remaining={p.remaining} total={parseFloat(p.quantity)} unit={unitShort} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
