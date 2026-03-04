import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useFamily } from '@/lib/FamilyContext'
import { LABELS } from '@/lib/constants'
import { LogOut, ChevronDown, Menu } from 'lucide-react'

export default function Header({ onMenuToggle }) {
  const { signOut } = useAuth()
  const { members, currentMember, setActiveMemberId } = useFamily()
  const [showMemberMenu, setShowMemberMenu] = useState(false)

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

      <div className="flex items-center gap-3">
        {/* Member Switcher */}
        {members.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowMemberMenu(!showMemberMenu)}
              className="fm-btn-ghost flex items-center gap-2 text-sm"
            >
              <span className="text-lg">{currentMember?.avatar_url || '👤'}</span>
              <span className="hidden sm:inline">{currentMember?.name}</span>
              <ChevronDown size={14} />
            </button>

            {showMemberMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMemberMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 fm-card-static p-2 animate-fade-in">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveMemberId(m.id)
                        setShowMemberMenu(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                        m.id === currentMember?.id
                          ? 'bg-fm-primary/10 text-fm-primary font-semibold'
                          : 'hover:bg-fm-bg-input text-fm-text'
                      }`}
                    >
                      <span className="text-lg">{m.avatar_url || '👤'}</span>
                      <div>
                        <div>{m.name}</div>
                        <div className="text-xs text-fm-text-muted">
                          {m.role === 'parent' ? LABELS.parent : LABELS.child}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={signOut}
          className="fm-btn-ghost p-2"
          title={LABELS.logout}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
