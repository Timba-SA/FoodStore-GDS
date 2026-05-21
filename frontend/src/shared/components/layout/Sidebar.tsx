/**
 * Sidebar — Role-based vertical navigation. Premium redesign.
 */

import {
  Store, LogIn, UserCircle, Package, MapPin, Layers,
  Box, Tags, Apple, ClipboardList, LineChart, Users, X, ShoppingCart, ChefHat,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { NAVIGATION_LINKS } from './navigation'
import type { NavLink as NavLinkConfig } from './navigation'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Store, LogIn, UserCircle, Package, MapPin, Layers,
  Box, Tags, Apple, ClipboardList, LineChart, Users, ShoppingCart, ChefHat,
}

function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name]
  return Icon ? <Icon size={size} /> : null
}

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const userRoles: string[] = user?.roles ?? []

  function canSee(link: NavLinkConfig): boolean {
    if (isAuthenticated && link.hideWhenAuth) return false
    if (link.roles === null) return true
    if (!isAuthenticated) return false
    if (link.roles.length === 0) return true
    return link.roles.some((r) => userRoles.includes(r))
  }

  const visible = NAVIGATION_LINKS.filter(canSee)

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-100/80">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <NavLink to="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/30 flex-shrink-0">
            <Store size={16} className="text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            <span className="text-orange-600">Food</span>
            <span className="text-slate-900">Store</span>
          </span>
        </NavLink>
        {onClose && (
          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visible.map((link) => (
          <div key={link.path}>
            {link.dividerBefore && (
              <div className="my-3 flex items-center gap-2 px-3">
                <div className="h-px bg-slate-100 flex-1" />
              </div>
            )}
            <NavLink
              to={link.path}
              id={`nav-${link.path.replace(/\//g, '-').replace(/^-/, '')}`}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm border border-orange-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-colors duration-200 ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    <NavIcon name={link.icon} />
                  </span>
                  <span className="truncate">{link.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* User badge at bottom */}
      {isAuthenticated && user && (
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.nombre}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
