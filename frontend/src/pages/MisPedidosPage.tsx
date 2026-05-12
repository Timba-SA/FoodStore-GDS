/**
 * MisPedidosPage — Lists the authenticated user's orders.
 * Route: /dashboard/pedidos
 */

import { useState } from 'react'
import { usePedidos } from '@/entities/pedido/hooks'
import PedidoDetailModal from '@/features/pedidos/PedidoDetailModal'

const ESTADO_BADGE: Record<string, string> = {
  pendiente:       'bg-yellow-100 text-yellow-800',
  confirmado:      'bg-blue-100 text-blue-800',
  en_preparacion:  'bg-purple-100 text-purple-800',
  en_camino:       'bg-indigo-100 text-indigo-800',
  entregado:       'bg-green-100 text-green-800',
  cancelado:       'bg-red-100 text-red-800',
}

const ESTADO_ICONS: Record<string, string> = {
  pendiente:      '⏳',
  confirmado:     '✅',
  en_preparacion: '👨‍🍳',
  en_camino:      '🚚',
  entregado:      '🎉',
  cancelado:      '❌',
}

export default function MisPedidosPage() {
  const { data: pedidos = [], isLoading } = usePedidos()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-1">Mis Pedidos</h1>
          <p className="text-orange-100">Seguí el estado de tus pedidos en tiempo real</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🛒</span>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Todavía no tenés pedidos</h2>
            <p className="text-gray-400 mb-6">Cuando hagas tu primer pedido aparecerá acá.</p>
            <a
              href="/catalogo"
              className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition text-sm"
            >
              Ver catálogo
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((p) => {
              const badgeCls = ESTADO_BADGE[p.estado_nombre] ?? 'bg-gray-100 text-gray-800'
              const icon = ESTADO_ICONS[p.estado_nombre] ?? '•'
              return (
                <button
                  key={p.id}
                  id={`pedido-card-${p.id}`}
                  onClick={() => setSelectedId(p.id)}
                  className="w-full text-left bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between hover:border-orange-300 hover:shadow-sm transition group"
                >
                  <div>
                    <p className="font-bold text-gray-900 text-sm group-hover:text-orange-600 transition">
                      {p.numero_pedido}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeCls}`}>
                      {icon} {p.estado_nombre.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      ${parseFloat(p.total).toFixed(2)}
                    </span>
                    <span className="text-gray-300 group-hover:text-orange-400 transition">›</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {selectedId !== null && (
        <PedidoDetailModal
          pedidoId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
