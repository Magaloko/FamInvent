import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { useFamily } from '@/lib/FamilyContext'
import { createFamily, createMember } from '@/lib/api'
import { LABELS, AVATARS } from '@/lib/constants'
import { ArrowRight, Plus, X, Users, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FamilySetup() {
  const { user } = useAuth()
  const { reload } = useFamily()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [familyName, setFamilyName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentAvatar, setParentAvatar] = useState('👨')
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)

  function addChild() {
    setChildren([...children, { name: '', avatar: '👦' }])
  }

  function removeChild(index) {
    setChildren(children.filter((_, i) => i !== index))
  }

  function updateChild(index, field, value) {
    const updated = [...children]
    updated[index] = { ...updated[index], [field]: value }
    setChildren(updated)
  }

  async function handleFinish() {
    if (!familyName.trim() || !parentName.trim()) return

    setLoading(true)
    try {
      const { data: family, error: famError } = await createFamily(familyName.trim())
      if (famError) throw new Error(famError)

      await createMember({
        id: user.id,
        family_id: family.id,
        name: parentName.trim(),
        role: 'parent',
        avatar_url: parentAvatar,
      })

      for (const child of children) {
        if (child.name.trim()) {
          await createMember({
            family_id: family.id,
            name: child.name.trim(),
            role: 'child',
            avatar_url: child.avatar,
          })
        }
      }

      toast.success('Familie erstellt!')
      await reload()
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Fehler beim Erstellen')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-fm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Users size={48} className="text-fm-primary mx-auto mb-3" />
          <h1 className="text-2xl font-heading font-bold text-fm-text">
            {LABELS.setupFamily}
          </h1>
          <p className="text-fm-text-light mt-1">
            {LABELS.step} {step} von 2
          </p>
          <div className="flex gap-2 justify-center mt-3">
            <div className={`h-1.5 w-16 rounded-full ${step >= 1 ? 'bg-fm-primary' : 'bg-fm-border'}`} />
            <div className={`h-1.5 w-16 rounded-full ${step >= 2 ? 'bg-fm-primary' : 'bg-fm-border'}`} />
          </div>
        </div>

        <div className="fm-card-static p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="fm-label">{LABELS.familyName}</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="fm-input"
                  placeholder="z.B. Familie Müller"
                  autoFocus
                />
              </div>

              <div>
                <label className="fm-label">Dein Name</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="fm-input"
                  placeholder="Dein Vorname"
                />
              </div>

              <div>
                <label className="fm-label">Dein Avatar</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {AVATARS.slice(0, 12).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setParentAvatar(a)}
                      className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                        parentAvatar === a
                          ? 'bg-fm-primary/20 ring-2 ring-fm-primary scale-110'
                          : 'bg-fm-bg-input hover:bg-fm-border'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!familyName.trim() || !parentName.trim()}
                className="fm-btn-primary w-full"
              >
                {LABELS.next} <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="fm-label mb-0">Kinder hinzufügen</label>
                  <button onClick={addChild} className="fm-btn-ghost text-xs">
                    <Plus size={16} /> Kind
                  </button>
                </div>

                {children.length === 0 && (
                  <p className="text-sm text-fm-text-muted text-center py-6">
                    Keine Kinder hinzugefügt. Du kannst sie auch später ergänzen.
                  </p>
                )}

                <div className="space-y-3">
                  {children.map((child, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-fm-bg-input rounded-card">
                      <div className="relative">
                        <select
                          value={child.avatar}
                          onChange={(e) => updateChild(i, 'avatar', e.target.value)}
                          className="w-10 h-10 text-xl text-center appearance-none bg-transparent cursor-pointer"
                        >
                          {AVATARS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => updateChild(i, 'name', e.target.value)}
                        className="fm-input flex-1"
                        placeholder="Name des Kindes"
                      />
                      <button
                        onClick={() => removeChild(i)}
                        className="fm-btn-ghost p-1 text-red-400 hover:text-red-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="fm-btn-secondary flex-1">
                  {LABELS.back}
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="fm-btn-primary flex-1"
                >
                  <CheckCircle size={18} />
                  {loading ? LABELS.loading : LABELS.finish}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
