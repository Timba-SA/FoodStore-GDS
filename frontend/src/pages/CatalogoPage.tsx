/**
 * CatalogoPage — Public product catalog with filters and grid layout.
 */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProductos } from '@/entities/producto/hooks'
import { useCategorias } from '@/entities/categoria/hooks'
import ProductoCard from '@/features/productos/ProductoCard'
import ProductoDetailModal from '@/features/productos/ProductoDetailModal'
import type { Producto, ProductosFilters } from '@/entities/producto/types'

export default function CatalogoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramCategoria = searchParams.get('categoria')

  const { data: categorias = [] } = useCategorias()
  const selectedCategoriaId = categorias.find(c => c.slug === paramCategoria)?.id

  const [search, setSearch] = useState('')
  const [sinAlergenos, setSinAlergenos] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const filters: ProductosFilters = {
    search: search || undefined,
    categoria_id: selectedCategoriaId,
    sin_alergenos: sinAlergenos || undefined,
    min_price: minPrice ? parseFloat(minPrice) : undefined,
    max_price: maxPrice ? parseFloat(maxPrice) : undefined,
    only_available: true,
  }

  const { data: productos = [], isLoading, isError } = useProductos(filters)

  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)

  function handleAddToCart(producto: Producto) {
    setSelectedProducto(producto)
  }

  return (
    <div className="bg-gray-50 flex-1">

      <div className="max-w-6xl mx-auto px-8 py-8 flex gap-8">
        {/* Sidebar filters */}
        <aside className="w-64 shrink-0">
          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-lg shadow-slate-200/50 border border-white/80 p-6 sticky top-24 space-y-6">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Filtros</h2>

            {paramCategoria && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-orange-800">
                  Categoría: {categorias.find(c => c.slug === paramCategoria)?.nombre || paramCategoria}
                </span>
                <button 
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams)
                    newParams.delete('categoria')
                    setSearchParams(newParams)
                  }}
                  className="text-orange-500 hover:text-orange-700 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Buscar</label>
              <input
                id="catalogo-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre del producto…"
                className="w-full border border-slate-200 bg-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Precio (AR$)</label>
              <div className="flex gap-2">
                <input
                  id="catalogo-min-price"
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Mín"
                  className="w-full border border-slate-200 bg-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400"
                />
                <input
                  id="catalogo-max-price"
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Máx"
                  className="w-full border border-slate-200 bg-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Allergen filter */}
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  id="catalogo-sin-alergenos"
                  type="checkbox"
                  checked={sinAlergenos}
                  onChange={(e) => setSinAlergenos(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-orange-500 checked:bg-orange-500 hover:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                />
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <span className="group-hover:text-orange-600 transition-colors">Sin alérgenos</span>
            </label>

            {/* Reset */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setSearch('')
                  setSinAlergenos(false)
                  setMinPrice('')
                  setMaxPrice('')
                }}
                className="w-full py-2.5 text-xs font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors tracking-wide uppercase"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </aside>

        {/* Main grid */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">
              {isLoading ? 'Cargando…' : `${productos.length} producto${productos.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
              ))}
            </div>
          )}

          {isError && (
            <div className="text-center py-20 text-red-600">
              Error al cargar el catálogo. Intentá de nuevo.
            </div>
          )}

          {!isLoading && !isError && productos.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg font-medium">Sin resultados</p>
              <p className="text-sm mt-1">Probá ajustando los filtros</p>
            </div>
          )}

          {!isLoading && !isError && productos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {productos.map((p, i) => (
                <ProductoCard 
                  key={p.id} 
                  producto={p} 
                  onAddToCart={handleAddToCart} 
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Product detail modal */}
      {selectedProducto && (
        <ProductoDetailModal
          producto={selectedProducto}
          onClose={() => setSelectedProducto(null)}
        />
      )}
    </div>
  )
}
