import { useState } from 'react'
import { useGetKdsOrders, useUpdateKdsProductAvailability } from '@/features/cocina/api/cocinaApi'
import { useKdsSocket } from '@/features/cocina/hooks/useKdsSocket'
import { SoundToggle } from '@/features/cocina/components/SoundToggle'
import { KdsCard } from '@/features/cocina/components/KdsCard'
import { useProductos } from '@/entities/producto/hooks'
import { 
  ChefHat, 
  Sliders, 
  Search, 
  X, 
  Loader2, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react'
import type { Producto } from '@/entities/producto/types'

interface CocinaProducto extends Producto {
  disponible?: boolean
}

export default function CocinaPage() {
  const { data: orders = [], isLoading, isError, refetch } = useGetKdsOrders()
  const { isConnectionHealthy, reconnectNow } = useKdsSocket()
  const { data: productsData = [] } = useProductos({ limit: 100 })
  const { mutate: updateProductAvailability, isPending: isUpdatingAvailability } = useUpdateKdsProductAvailability()

  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const porPreparar = orders.filter((o) => o.estado_nombre === 'confirmado')
  const enPreparacion = orders.filter((o) => o.estado_nombre === 'en_preparacion')

  // Filter products based on search query
  const filteredProducts = (productsData as CocinaProducto[]).filter((p) =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-6 py-4 flex-shrink-0 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/30 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              KDS — Food Store
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Módulo de Cocina
            </p>
          </div>
        </div>

        {/* Right tools and configuration */}
        <div className="flex items-center gap-4">
          <SoundToggle />
          
          <button
            onClick={() => setIsPanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-200 transition active:scale-95 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-orange-500" />
            <span>Productos</span>
          </button>
        </div>
      </header>

      {/* Connection and Health Status Bar */}
      <div className={`px-6 py-2 flex-shrink-0 flex items-center justify-between text-xs font-bold transition-all duration-300 border-b ${
        isConnectionHealthy 
          ? 'bg-slate-900/80 border-emerald-500/20 text-emerald-400' 
          : 'bg-amber-950/20 border-amber-500/20 text-amber-400'
      }`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isConnectionHealthy && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnectionHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="uppercase tracking-widest text-[10px]">
            {isConnectionHealthy ? 'Servicio WebSocket Activo (Tiempo Real)' : 'WebSocket Desconectado — Polling Activo (30s)'}
          </span>
        </div>
        
        {!isConnectionHealthy && (
          <button
            onClick={reconnectNow}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 uppercase tracking-wider text-[9px] transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Reconectar
          </button>
        )}
      </div>

      {/* Main Board Content */}
      <main className="flex-1 overflow-hidden p-6 flex gap-6 min-h-0 bg-slate-950">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-slate-400 text-sm font-semibold tracking-wide">Cargando tablero KDS...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-950/30 border border-rose-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200">Error al cargar órdenes</h3>
              <p className="text-slate-500 text-sm mt-1">Ocurrió un problema de red al conectar con el servidor KDS.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-bold text-white transition active:scale-95 cursor-pointer"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : (
          <>
            {/* Column 1: Por Preparar */}
            <section className="flex-1 flex flex-col bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden shadow-inner">
              <div className="px-6 py-4.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-100">Por preparar</h2>
                </div>
                <span className="px-3 py-1 rounded-xl bg-orange-950/40 border border-orange-500/20 text-xs font-black text-orange-400">
                  {porPreparar.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
                {porPreparar.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 py-20">
                    <span className="text-4xl mb-3 block">🍽️</span>
                    <p className="text-slate-500 text-sm font-medium">Sin pedidos pendientes por preparar.</p>
                  </div>
                ) : (
                  porPreparar.map((order) => (
                    <KdsCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </section>

            {/* Column 2: En Preparación */}
            <section className="flex-1 flex flex-col bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden shadow-inner">
              <div className="px-6 py-4.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-100">En preparación</h2>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs font-black text-emerald-400">
                  {enPreparacion.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
                {enPreparacion.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 py-20">
                    <span className="text-4xl mb-3 block">🔥</span>
                    <p className="text-slate-500 text-sm font-medium">Sin pedidos en cocción activa.</p>
                  </div>
                ) : (
                  enPreparacion.map((order) => (
                    <KdsCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Sliding Sidebar Panel: Product temporary stock toggler */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsPanelOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 transition-transform duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-900">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-black text-slate-100 tracking-tight">Disponibilidad Temporal</h3>
              </div>
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Search */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700 transition"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/40">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No se encontraron productos.
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isAvailable = product.disponible ?? true

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                        isAvailable 
                          ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-800 text-slate-100' 
                          : 'bg-rose-950/10 border-rose-950/40 hover:border-rose-900/30 text-rose-300'
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <span className="font-semibold text-sm block tracking-wide">{product.nombre}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          {product.categorias?.[0]?.nombre || 'Sin Categoría'}
                        </span>
                      </div>

                      {/* Toggle button */}
                      <button
                        disabled={isUpdatingAvailability}
                        onClick={() => updateProductAvailability({ id: product.id, disponible: !isAvailable })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isAvailable ? 'bg-orange-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isAvailable ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
