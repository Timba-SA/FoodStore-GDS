/**
 * Navbar — Top bar with mobile menu toggle and user dropdown. Premium redesign.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Menu, ShoppingCart, LogOut, UserCircle, ChevronDown, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useCartStore } from '@/entities/cart/store'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const totalItems = useCartStore((s) => s.getTotalItems())
  const openDrawer = useCartStore((s) => s.openDrawer)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleLogout() {
    clearAuth()
    navigate('/login')
    setDropdownOpen(false)
  }

  return (
    <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 flex items-center justify-between px-4 sticky top-0 z-30 flex-shrink-0 shadow-sm shadow-slate-100/50">
      {/* Left: hamburger (mobile only) */}
      <button
        id="btn-open-sidebar"
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1 px-4 lg:px-0" />

      {/* Right: Cart + User */}
      <div className="flex items-center gap-1.5">
        {/* Cart button */}
        {isAuthenticated && (
          <button
            id="btn-nav-cart"
            onClick={openDrawer}
            className="relative flex items-center justify-center w-9 h-9 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 group"
            aria-label="Carrito"
          >
            <ShoppingCart size={19} className="transition-transform group-hover:scale-110 duration-200" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-sm shadow-orange-500/40 border border-white">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </button>
        )}

        {/* User dropdown / Login */}
        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              id="btn-user-menu"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block max-w-[120px] truncate font-semibold">{user.nombre}</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-300/30 border border-slate-100 overflow-hidden z-50 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards', animationDuration: '0.2s' }}>
                <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.nombre}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    to="/perfil"
                    id="btn-nav-perfil"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserCircle size={16} className="text-slate-400" />
                    Mi Perfil
                  </Link>
                  <button
                    id="btn-nav-logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            id="btn-nav-login"
            className="flex items-center gap-1.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-1.5 rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-sm shadow-orange-500/20 hover:shadow-md transition-all duration-200"
          >
            <Sparkles size={13} />
            Iniciar Sesión
          </Link>
        )}
      </div>
    </header>
  )
}
