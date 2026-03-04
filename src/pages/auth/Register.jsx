import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { LABELS } from '@/lib/constants'
import { UserPlus } from 'lucide-react'

export default function Register() {
  const { signUp, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password)
    if (error) {
      setError(error.message || 'Registrierung fehlgeschlagen')
    } else {
      navigate('/setup')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-fm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-fm-primary flex items-center justify-center mx-auto mb-4 shadow-btn">
            <span className="text-3xl">📦</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-fm-text">
            {LABELS.appName}
          </h1>
          <p className="text-fm-text-light mt-1">Neues Konto erstellen</p>
        </div>

        <form onSubmit={handleSubmit} className="fm-card-static p-6 space-y-4">
          <h2 className="text-xl font-heading font-bold text-fm-text">
            {LABELS.register}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-input text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="fm-label">{LABELS.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fm-input"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="fm-label">{LABELS.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fm-input"
              placeholder="Mindestens 6 Zeichen"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="fm-label">{LABELS.passwordConfirm}</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="fm-input"
              placeholder="Passwort wiederholen"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="fm-btn-primary w-full"
          >
            <UserPlus size={18} />
            {loading ? LABELS.loading : LABELS.register}
          </button>

          <p className="text-center text-sm text-fm-text-light">
            {LABELS.hasAccount}{' '}
            <Link to="/login" className="text-fm-primary font-semibold hover:underline">
              {LABELS.login}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
