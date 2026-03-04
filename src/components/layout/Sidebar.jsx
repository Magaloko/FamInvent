import { NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { LABELS } from '@/lib/constants'
import {
  LayoutDashboard, FolderOpen, Gamepad2, BarChart3, X,
  ShoppingCart, Package, ClipboardList, ListChecks, LogOut,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/', icon: LayoutDashboard, label: LABELS.dashboard, end: true },
    ],
  },
  {
    label: 'Inventar',
    items: [
      { to: '/collections', icon: FolderOpen, label: LABELS.collections },
      { to: '/playlog', icon: Gamepad2, label: LABELS.playLog },
      { to: '/statistics', icon: BarChart3, label: LABELS.statistics },
    ],
  },
  {
    label: 'Handel',
    items: [
      { to: '/handel', icon: ShoppingCart, label: 'Dashboard', end: true },
      { to: '/handel/produkte', icon: Package, label: 'Produkte' },
    ],
  },
  {
    label: 'Tracker',
    items: [
      { to: '/tracker', icon: ClipboardList, label: 'Dashboard', end: true },
      { to: '/tracker/liste', icon: ListChecks, label: 'Alle Tracker' },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const { signOut, user } = useAuth()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-fm-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 h-14 flex items-center justify-between border-b border-fm-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h2 className="font-heading font-bold text-fm-text text-lg">
              {LABELS.appName}
            </h2>
          </div>
          <button onClick={onClose} className="lg:hidden fm-btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-[10px] uppercase tracking-wider text-fm-text-muted px-3 mb-1 font-heading font-bold">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `fm-sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-fm-border flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-fm-primary/10 flex items-center justify-center">
              <span className="text-sm">👤</span>
            </div>
            <p className="text-xs text-fm-text-light truncate flex-1">
              {user?.email || 'Benutzer'}
            </p>
          </div>
          <button onClick={signOut} className="fm-btn-ghost w-full text-red-500 hover:bg-red-50 hover:text-red-600 text-xs justify-start">
            <LogOut size={16} /> Abmelden
          </button>
        </div>
      </aside>
    </>
  )
}
