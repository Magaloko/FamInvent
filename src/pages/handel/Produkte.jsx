import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, createProduct } from '@/lib/api-handel'
import { HANDEL_LABELS, PRODUCT_CATEGORIES_HANDEL, PRODUCT_UNITS } from '@/lib/constants'
import { Plus, Search, X, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Produkte() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('g')
  const [description, setDescription] = useState('')
  const [threshold, setThreshold] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await getProducts()
    setProducts(data || [])
    setLoading(false)
  }

  function resetForm() {
    setName(''); setCategory(''); setUnit('g'); setDescription(''); setThreshold('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await createProduct({
      name: name.trim(),
      category,
      unit,
      description,
      low_stock_threshold: parseFloat(threshold) || 0,
    })
    if (error) toast.error(error)
    else { toast.success('Produkt angelegt!'); setShowForm(false); resetForm(); loadData() }
    setSaving(false)
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const catObj = (id) => PRODUCT_CATEGORIES_HANDEL.find((c) => c.id === id)
  const unitObj = (id) => PRODUCT_UNITS.find((u) => u.id === id)

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-fm-border/30 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="fm-card-static h-32 animate-pulse bg-fm-border/20" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="fm-page-title">{HANDEL_LABELS.produkte}</h1>
        <button onClick={() => setShowForm(true)} className="fm-btn-primary text-sm">
          <Plus size={16} /> {HANDEL_LABELS.neuesProdukt}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fm-text-muted" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="fm-input pl-9" placeholder="Produkt suchen..." />
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="fm-card-static p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold">{HANDEL_LABELS.neuesProdukt}</h3>
            <button onClick={() => { setShowForm(false); resetForm() }} className="fm-btn-ghost p-1"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="fm-label">{HANDEL_LABELS.produktName}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="fm-input" placeholder="z.B. Grüner Tee Sencha" autoFocus />
              </div>
              <div>
                <label className="fm-label">{HANDEL_LABELS.einheit}</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="fm-select">
                  {PRODUCT_UNITS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="fm-label">Kategorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="fm-select">
                  <option value="">-- Wählen --</option>
                  {PRODUCT_CATEGORIES_HANDEL.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="fm-label">{HANDEL_LABELS.mindestbestand}</label>
                <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="fm-input" placeholder="0" min="0" step="0.1" />
              </div>
            </div>
            <div>
              <label className="fm-label">Beschreibung</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="fm-input" rows={2} placeholder="Optional..." />
            </div>
            <button type="submit" disabled={saving || !name.trim()} className="fm-btn-primary w-full">
              {saving ? 'Speichern...' : 'Produkt anlegen'}
            </button>
          </form>
        </div>
      )}

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="text-fm-text-muted mx-auto mb-3" />
          <p className="text-fm-text-muted">{HANDEL_LABELS.keineProdukte}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prod) => {
            const cat = catObj(prod.category)
            const u = unitObj(prod.unit)
            return (
              <Link key={prod.id} to={`/handel/produkte/${prod.id}`} className="fm-card p-4 block">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{cat?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-fm-text truncate">{prod.name}</h3>
                    {cat && <p className="text-xs text-fm-text-muted">{cat.name}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="fm-badge bg-fm-bg-input text-fm-text-light text-xs">{u?.short || prod.unit}</span>
                      <span className="text-xs text-fm-text-muted">{prod.purchaseCount} {HANDEL_LABELS.einkäufe}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
