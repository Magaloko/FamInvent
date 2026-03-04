import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { Gamepad2, BarChart3, LogOut, Info } from 'lucide-react'

export default function More() {
  const { signOut, user } = useAuth()

  const links = [
    { to: '/playlog', icon: Gamepad2, label: 'Spielprotokoll', desc: 'Spielsitzungen verwalten', color: 'text-fm-primary' },
    { to: '/statistics', icon: BarChart3, label: 'Statistik', desc: 'Werte, Spielen, Kategorien', color: 'text-fm-secondary' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="fm-page-title">Mehr</h1>

      {/* User Info */}
      <div className="fm-card-static p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-fm-primary/10 flex items-center justify-center">
          <span className="text-lg">👤</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-bold text-fm-text truncate">{user?.email || 'Benutzer'}</p>
          <p className="text-xs text-fm-text-muted">FamInventar v1.0</p>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="fm-card p-4 flex items-center gap-4 block">
            <div className={`p-2 rounded-btn bg-fm-bg-input ${link.color}`}>
              <link.icon size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-heading font-bold text-fm-text">{link.label}</p>
              <p className="text-xs text-fm-text-muted">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button onClick={signOut} className="fm-btn-danger w-full mt-4">
        <LogOut size={18} /> Abmelden
      </button>
    </div>
  )
}
