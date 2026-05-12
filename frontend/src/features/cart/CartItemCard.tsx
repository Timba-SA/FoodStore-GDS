/**
 * CartItemCard — Renders a single cart line item.
 * Shows product info, personalizacion exclusions, quantity controls and delete.
 */

import { useCartStore } from '@/entities/cart/store'
import type { CartItem } from '@/entities/cart/types'

interface Props {
  item: CartItem
}

export default function CartItemCard({ item }: Props) {
  const { removeItem, updateQuantity } = useCartStore()
  const { producto, cantidad, personalizacion } = item

  // Resolve the names of excluded ingredients from the product snapshot
  const excludedNames = producto.ingredientes
    .filter((i) => personalizacion.includes(i.id))
    .map((i) => i.nombre)

  const subtotal = (parseFloat(producto.precio) * cantidad).toFixed(2)

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Product thumbnail */}
      <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl">🍽️</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
          {producto.nombre}
        </p>
        <p className="text-xs text-orange-600 font-medium">${parseFloat(producto.precio).toFixed(2)} c/u</p>
        {excludedNames.length > 0 && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            Sin: {excludedNames.join(', ')}
          </p>
        )}

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            id={`cart-dec-${item.id}`}
            onClick={() => updateQuantity(item.id, cantidad - 1)}
            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm leading-none transition"
          >
            −
          </button>
          <span className="text-sm font-semibold text-gray-800 w-5 text-center">{cantidad}</span>
          <button
            id={`cart-inc-${item.id}`}
            onClick={() => updateQuantity(item.id, cantidad + 1)}
            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm leading-none transition"
          >
            +
          </button>
          <span className="text-xs text-gray-400 ml-1">= ${subtotal}</span>
        </div>
      </div>

      {/* Delete */}
      <button
        id={`cart-remove-${item.id}`}
        onClick={() => removeItem(item.id)}
        className="text-gray-300 hover:text-red-400 transition flex-shrink-0 self-start mt-1"
        aria-label="Eliminar"
      >
        ✕
      </button>
    </div>
  )
}
