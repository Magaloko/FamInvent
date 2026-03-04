import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, ShoppingCart, ClipboardList, MoreHorizontal } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/collections', icon: FolderOpen, label: 'Inventar' },
  { to: '/handel', icon: ShoppingCart, label: 'Handel' },
  { to: '/tracker', icon: ClipboardList, label: 'Tracker' },
  { to: '/more', icon: MoreHorizontal, label: 'Mehr' },
]

export default function BottomNav() {
  const location = useLocation()

  const moreActive = ['/playlog', '/statistics', '/more'].some((p) => location.pathname.startsWith(p))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-fm-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-1 pb-safe">
        {NAV_ITEMS.map((item) => {
          const isMore = item.to === '/more'
          return (
            <NavLink
              key={item.to}
              to={isMore ? '/more' : item.to}
              end={item.end}
              className={({ isActive }) =>
                `fm-nav-item ${(isMore ? moreActive : isActive) ? 'active' : ''}`
              }
            >
              <item.icon size={22} strokeWidth={1.8} />
              <span className="text-[10px]">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
