import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getItem, updateItem, deleteItem, getPlayLogs, createPlayLog } from '@/lib/api'
import { LABELS, CATEGORIES, LOCATIONS, OCCASIONS } from '@/lib/constants'
import { uploadImage, uploadReceipt, createPreview } from '@/lib/storage'
import { ArrowLeft, Trash2, Save, Gamepad2, Plus, Clock, Calendar, Upload, MapPin, Gift, ShoppingCart, FileText, ExternalLink, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [playLogs, setPlayLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('zuhause')
  const [borrowedTo, setBorrowedTo] = useState('')
  const [acquiredType, setAcquiredType] = useState('')
  const [acquiredDate, setAcquiredDate] = useState('')
  const [acquiredFrom, setAcquiredFrom] = useState('')
  const [acquiredOccasion, setAcquiredOccasion] = useState('')
  const [editing, setEditing] = useState(false)

  // Photo upload
  const photoInputRef = useRef(null)
  const receiptInputRef = useRef(null)

  // Play form
  const [showPlayForm, setShowPlayForm] = useState(false)
  const [playDuration, setPlayDuration] = useState('')
  const [playNotes, setPlayNotes] = useState('')

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [itemRes, logsRes] = await Promise.all([
      getItem(id),
      getPlayLogs({ itemId: id, limit: 20 }),
    ])
    const d = itemRes.data
    setItem(d)
    setPlayLogs(logsRes.data || [])
    if (d) {
      setName(d.name)
      setDescription(d.description || '')
      setValue(d.value || '')
      setCategory(d.category || '')
      setLocation(d.location || 'zuhause')
      setBorrowedTo(d.borrowed_to || '')
      setAcquiredType(d.acquired_type || '')
      setAcquiredDate(d.acquired_date || '')
      setAcquiredFrom(d.acquired_from || '')
      setAcquiredOccasion(d.acquired_occasion || '')
    }
    setLoading(false)
  }

  async function handleSave() {
    const updates = {
      name: name.trim(),
      description,
      value: parseFloat(value) || 0,
      category,
      location,
      borrowed_to: location === 'ausgeborgt' ? borrowedTo : '',
      acquired_type: acquiredType,
      acquired_date: acquiredDate || null,
      acquired_from: acquiredFrom,
      acquired_occasion: acquiredType === 'geschenkt' ? acquiredOccasion : '',
    }
    const { error } = await updateItem(id, updates)
    if (error) toast.error(error)
    else { toast.success('Gespeichert!'); setEditing(false); loadData() }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const { url, error } = await uploadImage(file, 'items', id)
    if (error) { toast.error(error); return }
    const { error: saveError } = await updateItem(id, { image_url: url })
    if (saveError) toast.error(saveError)
    else { toast.success('Foto gespeichert!'); loadData() }
  }

  async function handleRemovePhoto() {
    const { error } = await updateItem(id, { image_url: null })
    if (error) toast.error(error)
    else { toast.success('Foto entfernt'); loadData() }
  }

  async function handleReceiptUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const { url, error } = await uploadReceipt(file, id)
    if (error) { toast.error(error); return }
    const { error: saveError } = await updateItem(id, { receipt_url: url })
    if (saveError) toast.error(saveError)
    else { toast.success('Rechnung gespeichert!'); loadData() }
  }

  async function handleDelete() {
    if (!confirm(LABELS.confirmDeleteText)) return
    const { error } = await deleteItem(id)
    if (error) toast.error(error)
    else { toast.success('Teil gelöscht'); navigate(-1) }
  }

  async function handleLogPlay(e) {
    e.preventDefault()
    const { error } = await createPlayLog({ item_id: id, duration_minutes: parseInt(playDuration) || null, notes: playNotes })
    if (error) toast.error(error)
    else { toast.success('Spielsitzung erfasst!'); setShowPlayForm(false); setPlayDuration(''); setPlayNotes(''); loadData() }
  }

  if (loading) return <div className="animate-fade-in"><div className="h-64 bg-fm-border/20 rounded-card animate-pulse mb-4" /></div>
  if (!item) return <p className="text-center text-fm-text-muted py-16">Teil nicht gefunden</p>

  const isToy = item.fm_collections?.type === 'toy'
  const cat = CATEGORIES.find((c) => c.id === item.category)
  const loc = LOCATIONS.find((l) => l.id === item.location)
  const occ = OCCASIONS.find((o) => o.id === item.acquired_occasion)

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="fm-btn-ghost text-sm"><ArrowLeft size={16} /> Zurück</button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Photo Section */}
        <div className="fm-card-static overflow-hidden">
          <div className="aspect-square bg-fm-bg-input flex items-center justify-center relative">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl">{cat?.icon || '📦'}</span>
            )}
          </div>
          <div className="p-3 flex gap-2 justify-center">
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <button onClick={() => photoInputRef.current?.click()} className="fm-btn-ghost text-xs">
              <Upload size={14} /> {item.image_url ? LABELS.changePhoto : LABELS.uploadPhoto}
            </button>
            {item.image_url && (
              <button onClick={handleRemovePhoto} className="fm-btn-ghost text-xs text-red-400">
                <X size={14} /> {LABELS.removePhoto}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Main Info Card */}
          <div className="fm-card-static p-5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="fm-page-title">{editing ? '' : item.name}</h1>
              <div className="flex gap-2">
                {editing ? (
                  <button onClick={handleSave} className="fm-btn-primary text-sm"><Save size={16} /> {LABELS.save}</button>
                ) : (
                  <button onClick={() => setEditing(true)} className="fm-btn-ghost text-sm">{LABELS.edit}</button>
                )}
                <button onClick={handleDelete} className="fm-btn-ghost p-2 text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div><label className="fm-label">{LABELS.name}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="fm-input" /></div>
                <div><label className="fm-label">{LABELS.value} ({LABELS.euro})</label><input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="fm-input" min="0" step="0.01" /></div>
                <div><label className="fm-label">{LABELS.category}</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="fm-select"><option value="">-- Kategorie --</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
                <div><label className="fm-label">{LABELS.description}</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="fm-input" rows={3} /></div>

                {/* Location */}
                <div>
                  <label className="fm-label">{LABELS.location}</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="fm-select">
                    {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
                  </select>
                  {location === 'ausgeborgt' && (
                    <input type="text" value={borrowedTo} onChange={(e) => setBorrowedTo(e.target.value)} className="fm-input mt-2" placeholder="An wen ausgeborgt?" />
                  )}
                </div>

                {/* Acquired Info */}
                <div>
                  <label className="fm-label">{LABELS.acquiredType}</label>
                  <div className="flex gap-2">
                    {['gekauft', 'geschenkt'].map((t) => (
                      <button key={t} type="button" onClick={() => setAcquiredType(acquiredType === t ? '' : t)} className={`flex-1 py-2 rounded-btn text-sm font-medium transition-all ${acquiredType === t ? 'bg-fm-primary text-white shadow-btn' : 'bg-fm-bg-input text-fm-text-light border border-fm-border'}`}>
                        {t === 'gekauft' ? '🛒 ' + LABELS.bought : '🎁 ' + LABELS.gifted}
                      </button>
                    ))}
                  </div>
                </div>

                {acquiredType === 'geschenkt' && (
                  <>
                    <div><label className="fm-label">{LABELS.occasion}</label><select value={acquiredOccasion} onChange={(e) => setAcquiredOccasion(e.target.value)} className="fm-select"><option value="">{LABELS.noOccasion}</option>{OCCASIONS.map((o) => <option key={o.id} value={o.id}>{o.icon} {o.name}</option>)}</select></div>
                    <div><label className="fm-label">{LABELS.giftedFrom}</label><input type="text" value={acquiredFrom} onChange={(e) => setAcquiredFrom(e.target.value)} className="fm-input" placeholder="z.B. Oma, Onkel Ali..." /></div>
                  </>
                )}

                {acquiredType === 'gekauft' && (
                  <>
                    <div><label className="fm-label">{LABELS.store}</label><input type="text" value={acquiredFrom} onChange={(e) => setAcquiredFrom(e.target.value)} className="fm-input" placeholder="z.B. MediaMarkt, Amazon..." /></div>
                    <div><label className="fm-label">{LABELS.acquiredDate}</label><input type="date" value={acquiredDate} onChange={(e) => setAcquiredDate(e.target.value)} className="fm-input" /></div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-heading font-bold text-fm-primary">{parseFloat(item.value || 0).toFixed(2)} {LABELS.euro}</span>
                  {cat && <span className="fm-badge bg-fm-bg-input text-fm-text-light">{cat.icon} {cat.name}</span>}
                  {loc && (
                    <span className={`fm-badge ${item.location === 'ausgeborgt' ? 'bg-red-100 text-red-700' : 'bg-fm-secondary/10 text-fm-secondary-dark'}`}>
                      <MapPin size={12} className="inline mr-1" />{loc.icon} {loc.name}
                    </span>
                  )}
                </div>

                {item.location === 'ausgeborgt' && item.borrowed_to && (
                  <p className="text-sm text-red-600 font-medium">🔄 Ausgeborgt an: {item.borrowed_to}</p>
                )}

                {item.description && <p className="text-sm text-fm-text-light">{item.description}</p>}

                {/* Acquired Info Display */}
                {item.acquired_type && (
                  <div className="p-3 bg-fm-bg-input rounded-card space-y-1">
                    {item.acquired_type === 'geschenkt' ? (
                      <>
                        <p className="text-sm text-fm-text flex items-center gap-1.5">
                          <Gift size={14} className="text-fm-primary" />
                          <strong>Geschenk</strong>
                          {item.acquired_from && <span>von {item.acquired_from}</span>}
                          {occ && <span>zum {occ.icon} {occ.name}</span>}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-fm-text flex items-center gap-1.5">
                          <ShoppingCart size={14} className="text-fm-secondary" />
                          <strong>Gekauft</strong>
                          {item.acquired_from && <span>bei {item.acquired_from}</span>}
                          {item.acquired_date && <span>am {new Date(item.acquired_date).toLocaleDateString('de-DE')}</span>}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <p className="text-xs text-fm-text-muted">{LABELS.createdAt}: {new Date(item.created_at).toLocaleDateString('de-DE')}</p>
              </div>
            )}
          </div>

          {/* Receipt Section */}
          <div className="fm-card-static p-5">
            <h2 className="font-heading font-bold text-fm-text mb-3 flex items-center gap-2">
              <FileText size={18} className="text-fm-secondary" /> {LABELS.receipt}
            </h2>
            <input ref={receiptInputRef} type="file" accept="image/*,.pdf" onChange={handleReceiptUpload} className="hidden" />
            {item.receipt_url ? (
              <div className="flex items-center gap-3">
                {item.receipt_url.endsWith('.pdf') ? (
                  <span className="text-3xl">📄</span>
                ) : (
                  <img src={item.receipt_url} alt="Rechnung" className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <a href={item.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-fm-primary font-medium flex items-center gap-1 hover:underline">
                    <ExternalLink size={14} /> {LABELS.viewReceipt}
                  </a>
                </div>
                <button onClick={() => receiptInputRef.current?.click()} className="fm-btn-ghost text-xs">Ändern</button>
              </div>
            ) : (
              <button onClick={() => receiptInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-fm-border rounded-card text-sm text-fm-text-muted hover:border-fm-primary hover:text-fm-primary transition-colors">
                <Upload size={20} className="mx-auto mb-1" /> {LABELS.uploadReceipt}
              </button>
            )}
          </div>

          {/* Play Log (only for toys) */}
          {isToy && (
            <div className="fm-card-static p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-fm-text flex items-center gap-2"><Gamepad2 size={18} className="text-fm-primary" /> {LABELS.playLog}</h2>
                <button onClick={() => setShowPlayForm(!showPlayForm)} className="fm-btn-primary text-sm"><Plus size={14} /> {LABELS.logPlay}</button>
              </div>
              {showPlayForm && (
                <form onSubmit={handleLogPlay} className="bg-fm-bg-input p-4 rounded-card mb-4 space-y-3">
                  <div><label className="fm-label">{LABELS.duration}</label><input type="number" value={playDuration} onChange={(e) => setPlayDuration(e.target.value)} className="fm-input" placeholder="z.B. 30" min="1" /></div>
                  <div><label className="fm-label">{LABELS.notes}</label><input type="text" value={playNotes} onChange={(e) => setPlayNotes(e.target.value)} className="fm-input" placeholder="Optional..." /></div>
                  <button type="submit" className="fm-btn-primary w-full text-sm">{LABELS.save}</button>
                </form>
              )}
              <div className="text-sm text-fm-text-muted mb-3">{playLogs.length} {LABELS.times} gespielt</div>
              {playLogs.length === 0 ? (
                <p className="text-sm text-fm-text-muted text-center py-4">{LABELS.noPlayLogs}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {playLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 py-2 border-b border-fm-border last:border-0">
                      <span>🎮</span>
                      <div className="flex-1">
                        <p className="text-xs text-fm-text-muted flex items-center gap-2">
                          <Calendar size={12} /> {new Date(log.played_at).toLocaleDateString('de-DE')}
                          {log.duration_minutes && <><Clock size={12} /> {log.duration_minutes} Min.</>}
                        </p>
                        {log.notes && <p className="text-xs text-fm-text-light mt-0.5">{log.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
