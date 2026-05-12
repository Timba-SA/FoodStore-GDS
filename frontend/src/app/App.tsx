import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import CartDrawer from '@/features/cart/CartDrawer'
import { useCartStore } from '@/entities/cart/store'

export default function App() {
  const [cartOpen, setCartOpen] = useState(false)
  const totalItems = useCartStore((s) => s.getTotalItems())

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-orange-600 tracking-tight">
            Food<span className="text-gray-900">Store</span>
          </Link>
          <div className="flex items-center gap-6">
            <ul className="flex gap-4 text-sm">
              <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition">Home</Link></li>
              <li><Link to="/catalogo" className="text-gray-600 hover:text-gray-900 transition">Catálogo</Link></li>
              <li><Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition">Dashboard</Link></li>
              <li><Link to="/dashboard/pedidos" className="text-gray-600 hover:text-gray-900 transition">Mis Pedidos</Link></li>
              <li><Link to="/login" className="text-gray-600 hover:text-gray-900 transition">Login</Link></li>
            </ul>

            {/* Cart button */}
            <button
              id="btn-open-cart"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-700 transition"
            >
              🛒
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
              <span className="hidden sm:inline">Carrito</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="container text-center text-gray-600">
          <p>&copy; 2024 FoodStore. All rights reserved.</p>
        </div>
      </footer>

      {/* Global cart drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
