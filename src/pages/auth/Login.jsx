import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { LABELS } from '@/lib/constants'
import { LogIn, AlertCircle } from 'lucide-react'

function translateError(msg) {
  if (!msg) return 'Anmeldung fehlgeschlagen'
  if (msg.includes('Invalid login credentials')) return 'E-Mail oder Passwort falsch'
  if (msg.includes('Email not confirmed')) return 'E-Mail-Adresse nicht bestätigt. Bitte prüfe dein Postfach'
  if (msg.includes('Too many requests')) return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut'
  if (msg.includes('User not found')) return 'Kein Konto mit dieser E-Mail-Adresse gefunden'
  if (msg.includes('network') || msg.includes('fetch')) return 'Netzwerkfehler. Bitte prüfe deine Internetverbindung'
  return msg
}

export default function Login() {
  const { signIn, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    if (error) {
      setError(translateError(error.message))
    } else {
      navigate('/')
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
          <p className="text-fm-text-light mt-1">Deine Familien-Inventar-App</p>
        </div>

        {!isConfigured && (
          <div className="fm-card-static p-4 mb-6 bg-fm-yellow/10 border-fm-yellow/30">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Supabase ist nicht konfiguriert. Bitte setze die Umgebungsvariablen in <code className="bg-amber-100 px-1 rounded">.env</code>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="fm-card-static p-6 space-y-4">
          <h2 className="text-xl font-heading font-bold text-fm-text">
            {LABELS.login}
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
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="fm-btn-primary w-full"
          >
            <LogIn size={18} />
            {loading ? LABELS.loading : LABELS.login}
          </button>

          <p className="text-center text-sm text-fm-text-light">
            {LABELS.noAccount}{' '}
            <Link to="/register" className="text-fm-primary font-semibold hover:underline">
              {LABELS.register}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
