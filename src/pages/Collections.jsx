import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getCollections, createCollection, getCollectionValue } from '@/lib/api'
import { LABELS, COLLECTION_ICONS } from '@/lib/constants'
import { Plus, FolderOpen, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Collections() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [collections, setCollections] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1')
  const [values, setValues] = useState({})

  // New collection form
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('normal')
  const [newIcon, setNewIcon] = useState('📦')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCollections()
  }, [filter])

  async function loadCollections() {
    setLoading(true)
    const opts = filter !== 'all' ? { type: filter } : {}
    const { data } = await getCollections(opts)
    setCollections(data || [])

    // Load values for each collection
    const vals = {}
    await Promise.all(
      (data || []).map(async (c) => {
        const { data: val } = await getCollectionValue(c.id)
        vals[c.id] = val
      })
    )
    setValues(vals)
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return

    setSaving(true)
    const { data, error } = await createCollection({
      name: newName.trim(),
      type: newType,
      icon: newIcon,
    })

    if (error) {
      toast.error(error)
    } else {
      toast.success('Sammlung erstellt!')
      setShowForm(false)
      setNewName('')
      setNewType('normal')
      setNewIcon('📦')
      loadCollections()
    }
    setSaving(false)
  }

  const filters = [
    { key: 'all', label: LABELS.all },
    { key: 'toy', label: LABELS.toy },
    { key: 'normal', label: LABELS.normal },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="fm-page-title">{LABELS.collections}</h1>
        <button onClick={() => setShowForm(true)} className="fm-btn-primary text-sm">
          <Plus size={16} /> {LABELS.newCollection}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-heading font-medium transition-all ${
              filter === f.key
                ? 'bg-fm-primary text-white shadow-btn'
                : 'bg-white text-fm-text-light border border-fm-border hover:bg-fm-bg-input'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* New Collection Form */}
      {showForm && (
        <div className="fm-card-static p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-fm-text">{LABELS.newCollection}</h3>
            <button onClick={() => setShowForm(false)} className="fm-btn-ghost p-1">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="fm-label">{LABELS.name}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="fm-input"
                placeholder="z.B. Spielzeugautos, Schuhe..."
                autoFocus
              />
            </div>

            <div>
              <label className="fm-label">{LABELS.type}</label>
              <div className="flex gap-3">
                {['normal', 'toy'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewType(t)}
                    className={`flex-1 py-3 rounded-btn text-sm font-heading font-medium transition-all ${
                      newType === t
                        ? 'bg-fm-primary text-white shadow-btn'
                        : 'bg-fm-bg-input text-fm-text-light border border-fm-border'
                    }`}
                  >
                    {t === 'normal' ? '📦 Normal' : '🧸 Spielzeug'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="fm-label">Icon</label>
              <div className="flex flex-wrap gap-2">
                {COLLECTION_ICONS.slice(0, 20).map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewIcon(icon)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                      newIcon === icon
                        ? 'bg-fm-primary/20 ring-2 ring-fm-primary scale-110'
                        : 'bg-fm-bg-input hover:bg-fm-border'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving || !newName.trim()} className="fm-btn-primary w-full">
              {saving ? LABELS.loading : LABELS.save}
            </button>
          </form>
        </div>
      )}

      {/* Collections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="fm-card-static h-32 animate-pulse bg-fm-border/20" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={48} className="text-fm-text-muted mx-auto mb-3" />
          <p className="text-fm-text-muted">{LABELS.noCollections}</p>
          <button onClick={() => setShowForm(true)} className="fm-btn-primary mt-4">
            <Plus size={16} /> {LABELS.newCollection}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c) => (
            <Link
              key={c.id}
              to={`/collections/${c.id}`}
              className="fm-card p-5 block"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-fm-text truncate">{c.name}</h3>
                  <p className="text-sm text-fm-text-muted mt-0.5">
                    {c.itemCount || 0} {LABELS.items}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="fm-badge bg-fm-primary/10 text-fm-primary">
                      {(values[c.id] || 0).toFixed(0)} {LABELS.euro}
                    </span>
                    <span className={`fm-badge ${
                      c.type === 'toy' ? 'bg-fm-yellow/20 text-amber-700' : 'bg-fm-secondary/10 text-fm-secondary-dark'
                    }`}>
                      {c.type === 'toy' ? '🧸 Spielzeug' : '📦 Normal'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
