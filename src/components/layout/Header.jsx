import { useLocation, useNavigate } from 'react-router-dom'
import { LABELS } from '@/lib/constants'
import { ChevronLeft, Menu } from 'lucide-react'

const PAGE_TITLES = {
  '/': LABELS.dashboard,
  '/collections': LABELS.collections,
  '/playlog': LABELS.playLog,
  '/statistics': LABELS.statistics,
  '/handel': 'Handel',
  '/handel/produkte': 'Produkte',
  '/tracker': 'Tracker',
  '/tracker/liste': 'Alle Tracker',
  '/more': 'Mehr',
}

export default function Header({ onMenuToggle }) {
  const location = useLocation()
  const navigate = useNavigate()

  // Determine page title
  const path = location.pathname
  let title = PAGE_TITLES[path] || LABELS.appName

  // Detail pages → show back button
  const isSubPage =
    (path.startsWith('/collections/') && path !== '/collections') ||
    (path.startsWith('/items/')) ||
    (path.startsWith('/handel/') && path !== '/handel' && path !== '/handel/produkte') ||
    (path.startsWith('/tracker/') && path !== '/tracker' && path !== '/tracker/liste')

  // Override titles for known sub-paths
  if (path.startsWith('/handel/produkte/') && path.includes('/einkauf/')) title = 'Neuer Einkauf'
  else if (path.startsWith('/handel/einkauf/') && path.includes('/verkauf/')) title = 'Neuer Verkauf'
  else if (path.startsWith('/handel/produkte/')) title = 'Produkt'
  else if (path.startsWith('/handel/einkauf/')) title = 'Einkauf'
  else if (path.startsWith('/tracker/') && path.includes('/materialien')) title = 'Materialien'
  else if (path.startsWith('/tracker/') && path !== '/tracker' && path !== '/tracker/liste') title = 'Tracker'
  else if (path.startsWith('/collections/')) title = 'Sammlung'
  else if (path.startsWith('/items/')) title = 'Gegenstand'

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-fm-border h-14 flex items-center px-4 lg:px-6">
      {/* Desktop: hamburger menu */}
      <button
        onClick={onMenuToggle}
        className="hidden lg:flex fm-btn-ghost p-2 mr-2"
      >
        <Menu size={20} />
      </button>

      {/* Mobile: back button on sub-pages */}
      {isSubPage && (
        <button
          onClick={() => navigate(-1)}
          className="lg:hidden fm-btn-ghost p-2 -ml-2 mr-1"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Title */}
      <h1 className="text-lg font-heading font-bold text-fm-text truncate flex-1">
        {title}
      </h1>
    </header>
  )
}
