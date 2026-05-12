/**
 * CartDrawer — Sliding right-side drawer for the shopping cart.
 * Controlled via the isOpen/onClose props — toggled from the Navbar.
 */

import { useCartStore } from '@/entities/cart/store'
import CartItemCard from './CartItemCard'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: Props) {
  const { items, clearCart, getSubtotal, getTotalItems } = useCartStore()
  const totalItems = getTotalItems()
  const subtotal = getSubtotal().toFixed(2)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mi Carrito</h2>
            {totalItems > 0 && (
              <p className="text-xs text-gray-400">{totalItems} ítem{totalItems !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button
            id="cart-drawer-close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
              <p className="text-sm text-gray-400 mt-1">Explorá el catálogo y agregá productos</p>
              <button
                onClick={onClose}
                className="mt-5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition"
              >
                Ir al catálogo →
              </button>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">${subtotal}</span>
            </div>
            <button
              id="btn-checkout"
              className="w-full bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition text-sm"
              onClick={() => alert('Checkout próximamente')}
            >
              Proceder al pago
            </button>
            <button
              id="btn-clear-cart"
              onClick={clearCart}
              className="w-full text-sm text-gray-400 hover:text-red-500 transition text-center"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  )
}
