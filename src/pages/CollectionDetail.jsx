import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getCollection, getItems, deleteCollection, createItem, getCollectionValue } from '@/lib/api'
import { LABELS, CATEGORIES, LOCATIONS, OCCASIONS } from '@/lib/constants'
import { uploadImage, uploadReceipt, createPreview } from '@/lib/storage'
import { ArrowLeft, Plus, Trash2, Search, X, Package, Upload, Link2, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CollectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [collection, setCollection] = useState(null)
  const [items, setItems] = useState([])
  const [totalValue, setTotalValue] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // New item form - basic
  const [itemName, setItemName] = useState('')
  const [itemValue, setItemValue] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [itemDesc, setItemDesc] = useState('')

  // New item form - photo
  const [photoMode, setPhotoMode] = useState('upload') // 'upload' | 'url'
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const photoInputRef = useRef(null)

  // New item form - location
  const [itemLocation, setItemLocation] = useState('zuhause')
  const [itemBorrowedTo, setItemBorrowedTo] = useState('')

  // New item form - acquired info
  const [showDetails, setShowDetails] = useState(false)
  const [acquiredType, setAcquiredType] = useState('')
  const [acquiredDate, setAcquiredDate] = useState('')
  const [acquiredFrom, setAcquiredFrom] = useState('')
  const [acquiredOccasion, setAcquiredOccasion] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const receiptInputRef = useRef(null)

  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [colRes, itemsRes, valRes] = await Promise.all([
      getCollection(id),
      getItems(id),
      getCollectionValue(id),
    ])
    setCollection(colRes.data)
    setItems(itemsRes.data || [])
    setTotalValue(valRes.data || 0)
    setLoading(false)
  }

  function resetForm() {
    setItemName(''); setItemValue(''); setItemCategory(''); setItemDesc('')
    setPhotoMode('upload'); setPhotoFile(null); setPhotoPreview(null); setPhotoUrl('')
    setItemLocation('zuhause'); setItemBorrowedTo('')
    setShowDetails(false); setAcquiredType(''); setAcquiredDate('')
    setAcquiredFrom(''); setAcquiredOccasion('')
    setReceiptFile(null); setReceiptPreview(null)
  }

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const preview = await createPreview(file)
    setPhotoPreview(preview)
  }

  async function handleReceiptSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      const preview = await createPreview(file)
      setReceiptPreview(preview)
    } else {
      setReceiptPreview(null)
    }
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!itemName.trim()) return

    setSaving(true)

    // Determine image URL
    let imageUrl = null
    if (photoMode === 'url' && photoUrl.trim()) {
      imageUrl = photoUrl.trim()
    } else if (photoMode === 'upload' && photoFile) {
      const tempId = crypto.randomUUID()
      const { url, error: uploadError } = await uploadImage(photoFile, 'items', tempId)
      if (uploadError) {
        toast.error(uploadError)
        setSaving(false)
        return
      }
      imageUrl = url
    }

    // Upload receipt if provided
    let receiptUrl = null
    if (receiptFile) {
      const tempId = crypto.randomUUID()
      const { url, error: uploadError } = await uploadReceipt(receiptFile, tempId)
      if (uploadError) {
        toast.error(uploadError)
        setSaving(false)
        return
      }
      receiptUrl = url
    }

    const itemData = {
      collection_id: id,
      name: itemName.trim(),
      value: parseFloat(itemValue) || 0,
      category: itemCategory,
      description: itemDesc,
      image_url: imageUrl,
      location: itemLocation,
      borrowed_to: itemLocation === 'ausgeborgt' ? itemBorrowedTo : '',
      acquired_type: acquiredType,
      acquired_date: acquiredDate || null,
      acquired_from: acquiredFrom,
      acquired_occasion: acquiredType === 'geschenkt' ? acquiredOccasion : '',
      receipt_url: receiptUrl,
    }

    const { error } = await createItem(itemData)

    if (error) {
      toast.error(error)
    } else {
      toast.success('Teil hinzugefügt!')
      setShowForm(false)
      resetForm()
      loadData()
    }
    setSaving(false)
  }

  async function handleDeleteCollection() {
    if (!confirm(LABELS.confirmDeleteText)) return
    const { error } = await deleteCollection(id)
    if (error) toast.error(error)
    else { toast.success('Sammlung gelöscht'); navigate('/collections') }
  }

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const locationObj = (loc) => LOCATIONS.find((l) => l.id === loc)

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="h-8 w-48 bg-fm-border/30 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="fm-card-static h-40 animate-pulse bg-fm-border/20" />
          ))}
        </div>
      </div>
    )
  }

  if (!collection) {
    return <p className="text-center text-fm-text-muted py-16">Sammlung nicht gefunden</p>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/collections" className="fm-btn-ghost text-sm mb-3 inline-flex">
          <ArrowLeft size={16} /> {LABELS.collections}
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{collection.icon}</span>
            <div>
              <h1 className="fm-page-title">{collection.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="fm-badge bg-fm-primary/10 text-fm-primary">
                  {totalValue.toFixed(0)} {LABELS.euro}
                </span>
                <span className="text-sm text-fm-text-muted">
                  {items.length} {LABELS.items}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleDeleteCollection} className="fm-btn-ghost p-2 text-red-400 hover:text-red-600">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fm-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="fm-input pl-9" placeholder={LABELS.search} />
        </div>
        <button onClick={() => setShowForm(true)} className="fm-btn-primary">
          <Plus size={16} /> {LABELS.newItem}
        </button>
      </div>

      {/* Add Item Form */}
      {showForm && (
        <div className="fm-card-static p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold">{LABELS.newItem}</h3>
            <button onClick={() => { setShowForm(false); resetForm() }} className="fm-btn-ghost p-1"><X size={18} /></button>
          </div>
          <form onSubmit={handleAddItem} className="space-y-4">
            {/* Name + Wert */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="fm-label">{LABELS.name}</label>
                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="fm-input" placeholder="z.B. Rote Sneaker" autoFocus />
              </div>
              <div>
                <label className="fm-label">{LABELS.value} ({LABELS.euro})</label>
                <input type="number" value={itemValue} onChange={(e) => setItemValue(e.target.value)} className="fm-input" placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>

            {/* Kategorie */}
            <div>
              <label className="fm-label">{LABELS.category}</label>
              <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="fm-select">
                <option value="">-- Kategorie wählen --</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            {/* Foto */}
            <div>
              <label className="fm-label">{LABELS.photo}</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setPhotoMode('upload')} className={`flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium transition-all ${photoMode === 'upload' ? 'bg-fm-primary text-white' : 'bg-fm-bg-input text-fm-text-light border border-fm-border'}`}>
                  <Upload size={12} /> Hochladen
                </button>
                <button type="button" onClick={() => setPhotoMode('url')} className={`flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium transition-all ${photoMode === 'url' ? 'bg-fm-primary text-white' : 'bg-fm-bg-input text-fm-text-light border border-fm-border'}`}>
                  <Link2 size={12} /> URL
                </button>
              </div>
              {photoMode === 'upload' ? (
                <div>
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  {photoPreview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null) }} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-fm-border rounded-card text-sm text-fm-text-muted hover:border-fm-primary hover:text-fm-primary transition-colors">
                      <Upload size={20} className="mx-auto mb-1" /> {LABELS.uploadPhoto}
                    </button>
                  )}
                </div>
              ) : (
                <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="fm-input" placeholder="https://..." />
              )}
            </div>

            {/* Standort */}
            <div>
              <label className="fm-label">{LABELS.location}</label>
              <select value={itemLocation} onChange={(e) => setItemLocation(e.target.value)} className="fm-select">
                {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
              </select>
              {itemLocation === 'ausgeborgt' && (
                <input type="text" value={itemBorrowedTo} onChange={(e) => setItemBorrowedTo(e.target.value)} className="fm-input mt-2" placeholder="An wen ausgeborgt?" />
              )}
            </div>

            {/* Beschreibung */}
            <div>
              <label className="fm-label">{LABELS.description}</label>
              <textarea value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="fm-input" rows={2} placeholder="Optionale Beschreibung..." />
            </div>

            {/* Weitere Details (aufklappbar) */}
            <button type="button" onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-2 text-sm text-fm-primary font-medium w-full">
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? LABELS.hideDetails : LABELS.moreDetails}
            </button>

            {showDetails && (
              <div className="space-y-3 p-4 bg-fm-bg-input rounded-card">
                {/* Gekauft / Geschenkt */}
                <div>
                  <label className="fm-label">{LABELS.acquiredType}</label>
                  <div className="flex gap-2">
                    {['gekauft', 'geschenkt'].map((t) => (
                      <button key={t} type="button" onClick={() => setAcquiredType(acquiredType === t ? '' : t)} className={`flex-1 py-2 rounded-btn text-sm font-medium transition-all ${acquiredType === t ? 'bg-fm-primary text-white shadow-btn' : 'bg-white text-fm-text-light border border-fm-border'}`}>
                        {t === 'gekauft' ? '🛒 ' + LABELS.bought : '🎁 ' + LABELS.gifted}
                      </button>
                    ))}
                  </div>
                </div>

                {acquiredType === 'geschenkt' && (
                  <>
                    <div>
                      <label className="fm-label">{LABELS.occasion}</label>
                      <select value={acquiredOccasion} onChange={(e) => setAcquiredOccasion(e.target.value)} className="fm-select">
                        <option value="">{LABELS.noOccasion}</option>
                        {OCCASIONS.map((o) => <option key={o.id} value={o.id}>{o.icon} {o.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="fm-label">{LABELS.giftedFrom}</label>
                      <input type="text" value={acquiredFrom} onChange={(e) => setAcquiredFrom(e.target.value)} className="fm-input" placeholder="z.B. Oma, Onkel Ali..." />
                    </div>
                  </>
                )}

                {acquiredType === 'gekauft' && (
                  <>
                    <div>
                      <label className="fm-label">{LABELS.store}</label>
                      <input type="text" value={acquiredFrom} onChange={(e) => setAcquiredFrom(e.target.value)} className="fm-input" placeholder="z.B. MediaMarkt, Amazon..." />
                    </div>
                    <div>
                      <label className="fm-label">{LABELS.acquiredDate}</label>
                      <input type="date" value={acquiredDate} onChange={(e) => setAcquiredDate(e.target.value)} className="fm-input" />
                    </div>
                    {/* Rechnung */}
                    <div>
                      <label className="fm-label">{LABELS.receipt}</label>
                      <input ref={receiptInputRef} type="file" accept="image/*,.pdf" onChange={handleReceiptSelect} className="hidden" />
                      {receiptFile ? (
                        <div className="flex items-center gap-2 p-2 bg-white rounded-btn border border-fm-border">
                          {receiptPreview ? (
                            <img src={receiptPreview} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <span className="text-lg">📄</span>
                          )}
                          <span className="text-sm text-fm-text truncate flex-1">{receiptFile.name}</span>
                          <button type="button" onClick={() => { setReceiptFile(null); setReceiptPreview(null) }} className="fm-btn-ghost p-1"><X size={14} /></button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => receiptInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-fm-border rounded-card text-sm text-fm-text-muted hover:border-fm-primary hover:text-fm-primary transition-colors">
                          <Upload size={16} className="mx-auto mb-1" /> {LABELS.uploadReceipt}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <button type="submit" disabled={saving || !itemName.trim()} className="fm-btn-primary w-full">
              {saving ? LABELS.loading : LABELS.save}
            </button>
          </form>
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="text-fm-text-muted mx-auto mb-3" />
          <p className="text-fm-text-muted">{LABELS.noItems}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const cat = CATEGORIES.find((c) => c.id === item.category)
            const loc = locationObj(item.location)
            return (
              <Link key={item.id} to={`/items/${item.id}`} className="fm-card overflow-hidden block">
                <div className="aspect-square bg-fm-bg-input flex items-center justify-center relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{cat?.icon || '📦'}</span>
                  )}
                  {item.location && item.location !== 'zuhause' && loc && (
                    <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${item.location === 'ausgeborgt' ? 'bg-red-100 text-red-700' : 'bg-fm-bg-input text-fm-text-light'}`}>
                      {loc.icon} {loc.name}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-heading font-semibold text-sm text-fm-text truncate">{item.name}</h4>
                  <p className="text-sm text-fm-primary font-bold mt-0.5">{parseFloat(item.value || 0).toFixed(0)} {LABELS.euro}</p>
                  {cat && <span className="text-xs text-fm-text-muted">{cat.icon} {cat.name}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
