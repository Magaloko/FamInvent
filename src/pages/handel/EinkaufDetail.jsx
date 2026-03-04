import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPurchase, updatePurchase, deletePurchase, deleteSale } from '@/lib/api-handel'
import { HANDEL_LABELS, PURCHASE_STATUSES, PRODUCT_UNITS } from '@/lib/constants'
import { PurchaseStatusBadge, SaleStatusBadge } from '@/components/handel/StatusBadge'
import StockProgressBar from '@/components/handel/StockProgressBar'
import MarginIndicator from '@/components/handel/MarginIndicator'
import { ArrowLeft, Plus, Trash2, Calendar, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EinkaufDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const { data } = await getPurchase(id)
    setPurchase(data)
    setLoading(false)
  }

  async function handleStatusChange(newStatus) {
    const { error } = await updatePurchase(id, { status: newStatus })
    if (error) toast.error(error)
    else { toast.success('Status aktualisiert'); loadData() }
  }

  async function handleDelete() {
    if (!confirm('Einkauf und alle Verkäufe wirklich löschen?')) return
    const productId = purchase.product_id
    const { error } = await deletePurchase(id)
    if (error) toast.error(error)
    else { toast.success('Einkauf gelöscht'); navigate(`/handel/produkte/${productId}`) }
  }

  async function handleDeleteSale(saleId) {
    if (!confirm('Verkauf wirklich löschen?')) return
    const { error } = await deleteSale(saleId, id)
    if (error) toast.error(error)
    else { toast.success('Verkauf gelöscht'); loadData() }
  }

  if (loading) return <div className="animate-fade-in"><div className="h-64 bg-fm-border/20 rounded-card animate-pulse" /></div>
  if (!purchase) return <p className="text-center text-fm-text-muted py-16">Einkauf nicht gefunden</p>

  const product = purchase.fm_products
  const sales = purchase.fm_sales || []
  const unitShort = PRODUCT_UNITS.find((u) => u.id === product?.unit)?.short || product?.unit || ''

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to={`/handel/produkte/${purchase.product_id}`} className="fm-btn-ghost text-sm inline-flex">
        <ArrowLeft size={16} /> {product?.name || 'Zurück'}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="fm-page-title">{purchase.batch_id}</h1>
          <p className="text-sm text-fm-text-muted mt-1">
            {product?.name} · {new Date(purchase.purchase_date).toLocaleDateString('de-DE')}
            {purchase.supplier && ` · ${purchase.supplier}`}
          </p>
        </div>
        <button onClick={handleDelete} className="fm-btn-ghost p-2 text-red-400"><Trash2 size={18} /></button>
      </div>

      {/* Status + Change */}
      <div className="fm-card-static p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-fm-text-muted mb-1">Status</p>
            <PurchaseStatusBadge status={purchase.status} />
          </div>
          <select
            value={purchase.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="fm-select text-sm w-auto"
          >
            {PURCHASE_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{HANDEL_LABELS.menge}</p>
          <p className="text-xl font-heading font-bold text-fm-text">{parseFloat(purchase.quantity).toFixed(1)} {unitShort}</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{HANDEL_LABELS.preisProEinheit}</p>
          <p className="text-xl font-heading font-bold text-fm-text">{purchase.pricePerUnit.toFixed(2)} €</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{HANDEL_LABELS.umsatz}</p>
          <p className="text-xl font-heading font-bold text-fm-secondary">{purchase.totalRevenue.toFixed(2)} €</p>
        </div>
        <div className="fm-stat-card">
          <p className="text-xs text-fm-text-muted font-heading">{HANDEL_LABELS.gewinn}</p>
          <MarginIndicator profit={purchase.profit} marginPercent={purchase.marginPercent} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="fm-card-static p-4">
        <StockProgressBar soldPercent={purchase.soldPercent} remaining={purchase.remaining} total={parseFloat(purchase.quantity)} unit={unitShort} />
      </div>

      {/* Sales Timeline */}
      <div className="fm-card-static p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-fm-text">{HANDEL_LABELS.verkäufe} ({sales.length})</h2>
          {purchase.remaining > 0 && (
            <Link to={`/handel/einkauf/${id}/verkauf/neu`} className="fm-btn-primary text-sm">
              <Plus size={14} /> {HANDEL_LABELS.neuerVerkauf}
            </Link>
          )}
        </div>

        {sales.length === 0 ? (
          <p className="text-sm text-fm-text-muted text-center py-6">{HANDEL_LABELS.keineVerkäufe}</p>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => {
              const saleProfit = parseFloat(sale.sale_price) - (parseFloat(sale.quantity) * purchase.pricePerUnit)
              return (
                <div key={sale.id} className="flex items-center gap-3 py-3 border-b border-fm-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-fm-text flex items-center gap-1">
                        <User size={14} className="text-fm-text-muted" /> {sale.buyer}
                      </p>
                      <SaleStatusBadge status={sale.status} />
                    </div>
                    <p className="text-xs text-fm-text-muted flex items-center gap-2">
                      <Calendar size={12} /> {new Date(sale.sale_date).toLocaleDateString('de-DE')}
                      · {parseFloat(sale.quantity).toFixed(1)} {unitShort}
                      · {parseFloat(sale.sale_price).toFixed(2)} €
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${saleProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {saleProfit >= 0 ? '+' : ''}{saleProfit.toFixed(2)} €
                    </p>
                  </div>
                  <button onClick={() => handleDeleteSale(sale.id)} className="fm-btn-ghost p-1 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {purchase.notes && (
        <div className="fm-card-static p-4">
          <p className="text-xs text-fm-text-muted mb-1">Notizen</p>
          <p className="text-sm text-fm-text">{purchase.notes}</p>
        </div>
      )}
    </div>
  )
}
