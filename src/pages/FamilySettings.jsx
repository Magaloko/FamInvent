import { useState } from 'react'
import { useFamily } from '@/lib/FamilyContext'
import { updateFamily, createMember, updateMember, deleteMember } from '@/lib/api'
import { LABELS, AVATARS } from '@/lib/constants'
import { Users, Plus, Trash2, Save, Edit2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FamilySettings() {
  const { family, members, reload } = useFamily()
  const [familyName, setFamilyName] = useState(family?.name || '')
  const [editingName, setEditingName] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [newChildAvatar, setNewChildAvatar] = useState('👦')
  const [editingMember, setEditingMember] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSaveName() {
    if (!familyName.trim()) return
    setSaving(true)
    const { error } = await updateFamily(family.id, { name: familyName.trim() })
    if (error) toast.error(error)
    else {
      toast.success('Gespeichert!')
      setEditingName(false)
      reload()
    }
    setSaving(false)
  }

  async function handleAddChild(e) {
    e.preventDefault()
    if (!newChildName.trim()) return
    setSaving(true)
    const { error } = await createMember({
      family_id: family.id,
      name: newChildName.trim(),
      role: 'child',
      avatar_url: newChildAvatar,
    })
    if (error) toast.error(error)
    else {
      toast.success('Kind hinzugefügt!')
      setShowAddChild(false)
      setNewChildName('')
      setNewChildAvatar('👦')
      reload()
    }
    setSaving(false)
  }

  async function handleUpdateMember(id, updates) {
    const { error } = await updateMember(id, updates)
    if (error) toast.error(error)
    else {
      toast.success('Gespeichert!')
      setEditingMember(null)
      reload()
    }
  }

  async function handleDeleteMember(id, name) {
    if (!confirm(`${name} wirklich entfernen?`)) return
    const { error } = await deleteMember(id)
    if (error) toast.error(error)
    else {
      toast.success('Mitglied entfernt')
      reload()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="fm-page-title flex items-center gap-2">
        <Users size={24} className="text-fm-primary" />
        {LABELS.family}
      </h1>

      {/* Family Name */}
      <div className="fm-card-static p-5">
        <h2 className="font-heading font-bold text-fm-text mb-3">{LABELS.familyName}</h2>
        {editingName ? (
          <div className="flex gap-3">
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="fm-input flex-1"
            />
            <button onClick={handleSaveName} disabled={saving} className="fm-btn-primary">
              <Save size={16} />
            </button>
            <button onClick={() => { setEditingName(false); setFamilyName(family.name) }} className="fm-btn-ghost">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-lg font-heading font-semibold text-fm-text">{family?.name}</p>
            <button onClick={() => setEditingName(true)} className="fm-btn-ghost text-sm">
              <Edit2 size={14} /> {LABELS.edit}
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="fm-card-static p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-fm-text">Familienmitglieder</h2>
          <button onClick={() => setShowAddChild(true)} className="fm-btn-primary text-sm">
            <Plus size={16} /> Kind
          </button>
        </div>

        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-fm-bg-input rounded-card">
              <span className="text-2xl">{m.avatar_url || '👤'}</span>
              <div className="flex-1">
                {editingMember === m.id ? (
                  <EditMemberInline
                    member={m}
                    onSave={(updates) => handleUpdateMember(m.id, updates)}
                    onCancel={() => setEditingMember(null)}
                  />
                ) : (
                  <>
                    <p className="font-heading font-semibold text-fm-text">{m.name}</p>
                    <p className="text-xs text-fm-text-muted">
                      {m.role === 'parent' ? LABELS.parent : LABELS.child}
                    </p>
                  </>
                )}
              </div>
              {editingMember !== m.id && (
                <div className="flex gap-1">
                  <button onClick={() => setEditingMember(m.id)} className="fm-btn-ghost p-1.5">
                    <Edit2 size={14} />
                  </button>
                  {m.role === 'child' && (
                    <button onClick={() => handleDeleteMember(m.id, m.name)} className="fm-btn-ghost p-1.5 text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Child Form */}
        {showAddChild && (
          <form onSubmit={handleAddChild} className="mt-4 p-4 border border-fm-border rounded-card space-y-3">
            <div>
              <label className="fm-label">Name des Kindes</label>
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                className="fm-input"
                placeholder="Vorname"
                autoFocus
              />
            </div>
            <div>
              <label className="fm-label">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setNewChildAvatar(a)}
                    className={`w-9 h-9 rounded-full text-lg flex items-center justify-center transition-all ${
                      newChildAvatar === a
                        ? 'bg-fm-primary/20 ring-2 ring-fm-primary'
                        : 'bg-fm-bg-input hover:bg-fm-border'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAddChild(false)} className="fm-btn-secondary flex-1">
                {LABELS.cancel}
              </button>
              <button type="submit" disabled={saving || !newChildName.trim()} className="fm-btn-primary flex-1">
                {saving ? LABELS.loading : LABELS.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function EditMemberInline({ member, onSave, onCancel }) {
  const [name, setName] = useState(member.name)
  const [avatar, setAvatar] = useState(member.avatar_url || '👤')

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="fm-input text-sm"
      />
      <div className="flex flex-wrap gap-1">
        {AVATARS.slice(0, 12).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            className={`w-7 h-7 rounded text-sm flex items-center justify-center ${
              avatar === a ? 'bg-fm-primary/20 ring-1 ring-fm-primary' : 'bg-white'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ name: name.trim(), avatar_url: avatar })} className="fm-btn-primary text-xs px-3 py-1.5">
          <Save size={12} />
        </button>
        <button onClick={onCancel} className="fm-btn-ghost text-xs px-3 py-1.5">
          {LABELS.cancel}
        </button>
      </div>
    </div>
  )
}
