import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { LABELS } from '@/lib/constants'
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react'

export default function Register() {
  const { signUp, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  function translateError(msg = '') {
    if (msg.includes('already registered') || msg.includes('User already registered'))
      return 'Diese E-Mail-Adresse ist bereits registriert.'
    if (msg.includes('invalid email') || msg.includes('Invalid email'))
      return 'Ungültige E-Mail-Adresse.'
    if (msg.includes('Password should be'))
      return 'Passwort muss mindestens 6 Zeichen lang sein.'
    if (msg.includes('rate limit') || msg.includes('too many'))
      return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'
    if (msg.includes('konfiguriert')) return msg
    return 'Registrierung fehlgeschlagen. Bitte versuche es erneut.'
  }

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
    const { data, error } = await signUp(email, password)
    if (error) {
      setError(translateError(error.message))
    } else if (data?.session) {
      // Email auto-confirmed → immediately logged in
      navigate('/')
    } else {
      // Email confirmation required
      setEmailSent(true)
    }
    setLoading(false)
  }

  // Email confirmation sent screen
  if (emailSent) {
    return (
      <div className="min-h-screen bg-fm-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="fm-card-static p-8 space-y-4">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-heading font-bold text-fm-text">Bestätigungs-E-Mail gesendet!</h2>
            <p className="text-fm-text-muted text-sm">
              Wir haben eine Bestätigungsmail an <strong>{email}</strong> gesendet.
              Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
            </p>
            <Link to="/login" className="fm-btn-primary inline-flex mt-2">
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    )
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

          {!isConfigured && (
            <div className="fm-card-static p-3 bg-fm-yellow/10 border-fm-yellow/30">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Supabase ist nicht konfiguriert. Registrierung nicht möglich.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-input text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
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
              autoComplete="email"
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
              autoComplete="new-password"
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
              autoComplete="new-password"
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
