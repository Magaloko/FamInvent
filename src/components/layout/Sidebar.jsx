import { NavLink } from 'react-router-dom'
import { LABELS } from '@/lib/constants'
import { LayoutDashboard, FolderOpen, Gamepad2, BarChart3, X } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: LABELS.dashboard },
  { to: '/collections', icon: FolderOpen, label: LABELS.collections },
  { to: '/playlog', icon: Gamepad2, label: LABELS.playLog },
  { to: '/statistics', icon: BarChart3, label: LABELS.statistics },
]

export default function Sidebar({ open, onClose }) {
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
        {/* Logo area */}
        <div className="px-6 h-14 flex items-center justify-between border-b border-fm-border">
          <h2 className="font-heading font-bold text-fm-text text-lg">
            {LABELS.appName}
          </h2>
          <button onClick={onClose} className="lg:hidden fm-btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `fm-sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-fm-border">
          <p className="text-xs text-fm-text-muted text-center">
            FamInventar v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
