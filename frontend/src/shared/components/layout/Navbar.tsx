/**
 * Navbar — Top bar with mobile menu toggle and user dropdown.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Menu, ShoppingCart, LogOut, UserCircle, ChevronDown } from 'lucide-react'
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

  // Close dropdown on outside click
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
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-30 flex-shrink-0">
      {/* Left: hamburger (mobile only) */}
      <button
        id="btn-open-sidebar"
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-800 transition p-1.5 rounded-lg hover:bg-gray-100"
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      {/* Center / Breadcrumb — we leave a flexible spacer */}
      <div className="flex-1 px-4 lg:px-0" />

      {/* Right: Cart + User */}
      <div className="flex items-center gap-2">
        {/* Cart button — only for authenticated users */}
        {isAuthenticated && (
          <button
            id="btn-nav-cart"
            onClick={openDrawer}
            className="relative flex items-center justify-center w-9 h-9 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
            aria-label="Carrito"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs flex-shrink-0">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block max-w-[120px] truncate">{user.nombre}</span>
              <ChevronDown size={14} className={`text-gray-400 transition ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-900 truncate">{user.nombre}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>
                <Link
                  to="/perfil"
                  id="btn-nav-perfil"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserCircle size={16} className="text-gray-400" />
                  Mi Perfil
                </Link>
                <button
                  id="btn-nav-logout"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            id="btn-nav-login"
            className="text-sm font-semibold text-gray-700 hover:text-orange-600 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition"
          >
            Iniciar Sesión
          </Link>
        )}
      </div>
    </header>
  )
}
