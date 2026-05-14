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
}

export default function ProductoDetailModal({ producto, onClose }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const openDrawer = useCartStore((s) => s.openDrawer)
  const [cantidad, setCantidad] = useState(1)
  const [excludedIds, setExcludedIds] = useState<number[]>([])
  const [imgError, setImgError] = useState(false)

  function toggleExclude(id: number) {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleAdd() {
    addItem(producto, cantidad, excludedIds)
    onClose()
    openDrawer()
  }

  const hasIngredientes = producto.ingredientes.length > 0
  const enStock = producto.stock > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-900/10 w-full max-w-md overflow-hidden border border-white/20 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        {/* Product image */}
        <div className="relative h-56 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center overflow-hidden">
          {producto.imagen_url && !imgError ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover animate-fade-in-up"
            />
          ) : (
            <span className="text-7xl animate-float">🍽️</span>
          )}
          <button
            id="detail-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/50 backdrop-blur-md text-slate-600 hover:text-slate-900 hover:bg-white/90 rounded-full w-9 h-9 flex items-center justify-center text-sm transition-all duration-300 hover:scale-105 hover:rotate-90 shadow-sm"
          >
            ✕
          </button>
          {!enStock && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-white/90 text-gray-800 text-sm font-bold px-5 py-2 rounded-full shadow-lg">
                Sin stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-7 space-y-5">
          {/* Title + price */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{producto.nombre}</h2>
              {producto.descripcion && (
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{producto.descripcion}</p>
              )}
            </div>
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 flex-shrink-0">
              ${parseFloat(producto.precio).toFixed(2)}
            </span>
          </div>

          {/* Categories */}
          {producto.categorias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {producto.categorias.map((c) => (
                <span
                  key={c.id}
                  className="text-[11px] font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full shadow-sm"
                >
                  {c.nombre}
                </span>
              ))}
            </div>
          )}

          {/* Personalizacion: exclude ingredients */}
          {hasIngredientes && enStock && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm font-bold text-slate-800 mb-3 tracking-wide">
                Personalizar <span className="text-slate-400 font-medium ml-1">(excluir ingredientes)</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {producto.ingredientes.map((ing) => {
                  const isExcluded = excludedIds.includes(ing.id)
                  return (
                    <button
                      key={ing.id}
                      id={`excl-ing-${ing.id}`}
                      onClick={() => toggleExclude(ing.id)}
                      className={`text-[13px] px-4 py-2 rounded-xl border transition-all duration-300 font-medium shadow-sm ${
                        isExcluded
                          ? 'bg-red-50 border-red-200 text-red-600 scale-95'
                          : ing.es_alergeno
                          ? 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-300 hover:-translate-y-0.5'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md'
                      }`}
                    >
                      {isExcluded ? '✕ Sin ' : ''}{ing.nombre}
                      {ing.es_alergeno && !isExcluded && ' ⚠️'}
                    </button>
                  )
                })}
              </div>
              {excludedIds.length > 0 && (
                <p className="text-[13px] text-red-500 font-medium mt-3 bg-red-50/50 p-2 rounded-lg">
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
            <div className="flex items-center gap-4 pt-3">
              {/* Qty selector */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 shadow-inner">
                <button
                  id="detail-qty-dec"
                  onClick={() => setCantidad((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-orange-600 text-lg transition-all"
                >
                  −
                </button>
                <span className="w-10 text-center text-base font-bold text-slate-800">{cantidad}</span>
                <button
                  id="detail-qty-inc"
                  onClick={() => setCantidad((q) => q + 1)}
                  className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-orange-600 text-lg transition-all"
                >
                  +
                </button>
              </div>

              {/* Add to cart */}
              <button
                id="btn-add-to-cart-confirm"
                onClick={handleAdd}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform active:scale-95 text-sm tracking-wide"
              >
                Agregar — ${(parseFloat(producto.precio) * cantidad).toFixed(2)}
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
