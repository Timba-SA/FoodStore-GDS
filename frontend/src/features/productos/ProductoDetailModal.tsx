/**
 * ProductoDetailModal — Modal to view product details and customize before adding to cart.
 *
 * Allows the user to:
 * - See full product information.
 * - Choose which ingredients to EXCLUDE (personalizacion).
 * - Set a quantity.
 * - Add the item to the cart via useCartStore.addItem().
 */

import { useState } from 'react'
import type { Producto } from '@/entities/producto/types'
import { useCartStore } from '@/entities/cart/store'

interface Props {
  producto: Producto
  onClose: () => void
  onCartOpen: () => void
}

export default function ProductoDetailModal({ producto, onClose, onCartOpen }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [cantidad, setCantidad] = useState(1)
  const [excludedIds, setExcludedIds] = useState<number[]>([])

  function toggleExclude(id: number) {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleAdd() {
    addItem(producto, cantidad, excludedIds)
    onClose()
    onCartOpen()
  }

  const hasIngredientes = producto.ingredientes.length > 0
  const enStock = producto.stock > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Product image */}
        <div className="relative h-48 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-7xl">🍽️</span>
          )}
          <button
            id="detail-modal-close"
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/80 text-gray-600 hover:text-gray-900 rounded-full w-8 h-8 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
          {!enStock && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="bg-white text-gray-700 text-sm font-semibold px-4 py-1.5 rounded-full">
                Sin stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title + price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{producto.nombre}</h2>
              {producto.descripcion && (
                <p className="text-sm text-gray-500 mt-1">{producto.descripcion}</p>
              )}
            </div>
            <span className="text-2xl font-bold text-orange-600 flex-shrink-0">
              ${parseFloat(producto.precio).toFixed(2)}
            </span>
          </div>

          {/* Categories */}
          {producto.categorias.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {producto.categorias.map((c) => (
                <span
                  key={c.id}
                  className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full"
                >
                  {c.nombre}
                </span>
              ))}
            </div>
          )}

          {/* Personalizacion: exclude ingredients */}
          {hasIngredientes && enStock && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Personalizar <span className="text-gray-400 font-normal">(excluir ingredientes)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {producto.ingredientes.map((ing) => {
                  const isExcluded = excludedIds.includes(ing.id)
                  return (
                    <button
                      key={ing.id}
                      id={`excl-ing-${ing.id}`}
                      onClick={() => toggleExclude(ing.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                        isExcluded
                          ? 'bg-red-50 border-red-300 text-red-600'
                          : ing.es_alergeno
                          ? 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-400'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {isExcluded ? '✕ Sin ' : ''}{ing.nombre}
                      {ing.es_alergeno && !isExcluded && ' ⚠️'}
                    </button>
                  )
                })}
              </div>
              {excludedIds.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Se excluirán: {producto.ingredientes
                    .filter((i) => excludedIds.includes(i.id))
                    .map((i) => i.nombre)
                    .join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Quantity + Add */}
          {enStock && (
            <div className="flex items-center gap-3 pt-2">
              {/* Qty selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5">
                <button
                  id="detail-qty-dec"
                  onClick={() => setCantidad((q) => Math.max(1, q - 1))}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 text-sm transition"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-bold text-gray-800">{cantidad}</span>
                <button
                  id="detail-qty-inc"
                  onClick={() => setCantidad((q) => q + 1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 text-sm transition"
                >
                  +
                </button>
              </div>

              {/* Add to cart */}
              <button
                id="btn-add-to-cart-confirm"
                onClick={handleAdd}
                className="flex-1 bg-orange-600 text-white font-semibold py-2.5 rounded-xl hover:bg-orange-700 transition text-sm"
              >
                Agregar al carrito — ${(parseFloat(producto.precio) * cantidad).toFixed(2)}
              </button>
            </div>
          )}

          {!enStock && (
            <p className="text-center text-sm text-gray-400 pt-2">
              Este producto no tiene stock disponible.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
