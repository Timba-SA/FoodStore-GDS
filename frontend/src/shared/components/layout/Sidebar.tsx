/**
 * Sidebar — Role-based vertical navigation.
 */

import {
  Store,
  LogIn,
  UserCircle,
  Package,
  MapPin,
  Layers,
  Box,
  Tags,
  Apple,
  ClipboardList,
  LineChart,
  Users,
  X,
  ShoppingCart,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { NAVIGATION_LINKS } from './navigation'
import type { NavLink as NavLinkConfig } from './navigation'

import type { LucideIcon } from 'lucide-react'

// ── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Store,
  LogIn,
  UserCircle,
  Package,
  MapPin,
  Layers,
  Box,
  Tags,
  Apple,
  ClipboardList,
  LineChart,
  Users,
  ShoppingCart,
}

function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name]
  return Icon ? <Icon size={size} /> : null
}

// ── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const userRoles: string[] = user?.roles ?? []

  function canSee(link: NavLinkConfig): boolean {
    if (link.roles === null) return true              // public
    if (!isAuthenticated) return false               // auth required
    if (link.roles.length === 0) return true         // any auth user
    return link.roles.some((r) => userRoles.includes(r))
  }

  const visible = NAVIGATION_LINKS.filter(canSee)

  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <NavLink to="/" className="flex items-center gap-2" onClick={onClose}>
          <span className="text-xl font-extrabold text-orange-600 tracking-tight">
            Food<span className="text-gray-900">Store</span>
          </span>
        </NavLink>
        {/* Close button — only visible on mobile */}
        {onClose && (
          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visible.map((link) => (
          <div key={link.path}>
            {link.dividerBefore && (
              <div className="my-2 border-t border-gray-100" />
            )}
            <NavLink
              to={link.path}
              id={`nav-${link.path.replace(/\//g, '-').replace(/^-/, '')}`}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-orange-600' : 'text-gray-400'}>
                    <NavIcon name={link.icon} />
                  </span>
                  {link.label}
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* User badge at bottom */}
      {isAuthenticated && user && (
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm flex-shrink-0">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.nombre}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
