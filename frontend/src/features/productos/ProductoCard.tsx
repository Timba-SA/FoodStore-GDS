/**
 * ProductoCard — Card component for the public catalog grid.
 */

import type { Producto } from '@/entities/producto/types'

interface Props {
  producto: Producto
  onAddToCart?: (producto: Producto) => void
}

export default function ProductoCard({ producto, onAddToCart }: Props) {
  const hasAlergenos = producto.ingredientes.some((i) => i.es_alergeno)
  const enStock = producto.stock > 0

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl select-none">🍽️</span>
        )}
        {hasAlergenos && (
          <span className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
            ⚠️ Alérgenos
          </span>
        )}
        {!enStock && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-gray-400 font-mono mb-1">{producto.sku}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
          {producto.nombre}
        </h3>
        {producto.descripcion && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{producto.descripcion}</p>
        )}

        {/* Categories */}
        {producto.categorias.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {producto.categorias.slice(0, 2).map((c) => (
              <span key={c.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {c.nombre}
              </span>
            ))}
            {producto.categorias.length > 2 && (
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                +{producto.categorias.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-orange-600">
            ${parseFloat(producto.precio).toFixed(2)}
          </span>
          <button
            id={`btn-add-cart-${producto.id}`}
            onClick={() => onAddToCart?.(producto)}
            disabled={!enStock}
            className="text-xs font-semibold bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
