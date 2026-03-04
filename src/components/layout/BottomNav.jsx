import { NavLink, useNavigate } from 'react-router-dom'
import { LABELS } from '@/lib/constants'
import { LayoutDashboard, FolderOpen, PlusCircle, Gamepad2, BarChart3 } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: LABELS.dashboard },
  { to: '/collections', icon: FolderOpen, label: LABELS.collections },
  { to: null, icon: PlusCircle, label: LABELS.add, isCenter: true },
  { to: '/playlog', icon: Gamepad2, label: 'Spiel' },
  { to: '/statistics', icon: BarChart3, label: 'Stats' },
]

export default function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-fm-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {NAV_ITEMS.map((item, i) => {
          if (item.isCenter) {
            return (
              <button
                key={i}
                onClick={() => navigate('/collections?new=1')}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-12 h-12 rounded-full bg-fm-primary flex items-center justify-center shadow-btn">
                  <PlusCircle size={24} className="text-white" />
                </div>
              </button>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `fm-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
