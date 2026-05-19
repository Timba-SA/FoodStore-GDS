/**
 * ProductoCard — Card component for the public catalog grid.
 */

import { useState } from 'react'
import type { Producto } from '@/entities/producto/types'

interface Props {
  producto: Producto
  onAddToCart?: (producto: Producto) => void
  style?: React.CSSProperties
}

export default function ProductoCard({ producto, onAddToCart, style }: Props) {
  const [imgError, setImgError] = useState(false)
  const hasAlergenos = producto.es_alergeno || producto.ingredientes.some((i) => i.es_alergeno)
  const enStock = producto.stock > 0

  return (
    <div 
      className="group bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1.5 transition-all duration-500 animate-fade-in-up opacity-0"
      style={style}
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden">
        {producto.imagen_url && !imgError ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <span className="text-4xl select-none group-hover:scale-110 transition-transform duration-500 mb-2">🍽️</span>
            {producto.imagen_url && (
              <a 
                href={producto.imagen_url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-orange-600 hover:underline break-all relative z-10 line-clamp-2 px-2"
                onClick={(e) => e.stopPropagation()}
                title={producto.imagen_url}
              >
                {producto.imagen_url}
              </a>
            )}
          </div>
        )}
        {hasAlergenos && (
          <span className="absolute top-3 right-3 bg-orange-100/90 backdrop-blur-sm text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200/50 shadow-sm">
            ⚠️ Alérgenos
          </span>
        )}
        {!enStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <p className="text-xs text-gray-400 font-mono mb-1.5 tracking-wide">{producto.sku}</p>
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1.5 line-clamp-2">
          {producto.nombre}
        </h3>
        {producto.descripcion && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{producto.descripcion}</p>
        )}

        {/* Categories */}
        {producto.categorias.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {producto.categorias.slice(0, 2).map((c) => (
               <span key={c.id} className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {c.nombre}
              </span>
            ))}
            {producto.categorias.length > 2 && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full">
                +{producto.categorias.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
            ${parseFloat(producto.precio).toFixed(2)}
          </span>
          <button
            id={`btn-add-cart-${producto.id}`}
            onClick={() => onAddToCart?.(producto)}
            disabled={!enStock}
            className="text-xs font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
