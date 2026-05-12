/**
 * CatalogoPage — Public product catalog with filters and grid layout.
 */

import { useState, useCallback } from 'react'
import { useProductos } from '@/entities/producto/hooks'
import ProductoCard from '@/features/productos/ProductoCard'
import ProductoDetailModal from '@/features/productos/ProductoDetailModal'
import CartDrawer from '@/features/cart/CartDrawer'
import type { Producto, ProductosFilters } from '@/entities/producto/types'

// Minimal debounce hook
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useCallback(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CatalogoPage() {
  const [search, setSearch] = useState('')
  const [sinAlergenos, setSinAlergenos] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const debouncedSearch = useDebounce(search, 400)

  const filters: ProductosFilters = {
    search: debouncedSearch || undefined,
    sin_alergenos: sinAlergenos || undefined,
    min_price: minPrice ? parseFloat(minPrice) : undefined,
    max_price: maxPrice ? parseFloat(maxPrice) : undefined,
  }

  const { data: productos = [], isLoading, isError } = useProductos(filters)

  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  function handleAddToCart(producto: Producto) {
    setSelectedProducto(producto)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-2">Nuestro Catálogo</h1>
          <p className="text-orange-100 text-lg">Explorá todos nuestros productos frescos y deliciosos</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8 flex gap-8">
        {/* Sidebar filters */}
        <aside className="w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-4 space-y-5">
            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Filtros</h2>

            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <input
                id="catalogo-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre del producto…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio (AR$)</label>
              <div className="flex gap-2">
                <input
                  id="catalogo-min-price"
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Mín"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  id="catalogo-max-price"
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Máx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Allergen filter */}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                id="catalogo-sin-alergenos"
                type="checkbox"
                checked={sinAlergenos}
                onChange={(e) => setSinAlergenos(e.target.checked)}
                className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
              />
              Sin alérgenos
            </label>

            {/* Reset */}
            <button
              onClick={() => {
                setSearch('')
                setSinAlergenos(false)
                setMinPrice('')
                setMaxPrice('')
              }}
              className="w-full text-xs text-orange-600 hover:text-orange-800 font-medium text-left"
            >
              Limpiar filtros
            </button>
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
              {productos.map((p) => (
                <ProductoCard key={p.id} producto={p} onAddToCart={handleAddToCart} />
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
          onCartOpen={() => setCartOpen(true)}
        />
      )}

      {/* Cart drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
