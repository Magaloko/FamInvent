import { useAuth } from '@/lib/AuthContext'
import { LABELS } from '@/lib/constants'
import { LogOut, Menu } from 'lucide-react'

export default function Header({ onMenuToggle }) {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-fm-border px-4 lg:px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden fm-btn-ghost p-2"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-heading font-bold text-fm-text">
          {LABELS.appName}
        </h1>
      </div>

      <button
        onClick={signOut}
        className="fm-btn-ghost p-2"
        title={LABELS.logout}
      >
        <LogOut size={18} />
      </button>
    </header>
  )
}
