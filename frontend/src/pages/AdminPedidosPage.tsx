/**
 * AdminPedidosPage — All orders with status change capability.
 * Route: /admin/pedidos
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAvanzarEstado } from '@/entities/pedido/hooks'
import client from '@/shared/api/client'
import type { PedidoListResponse } from '@/entities/pedido/types'

function useAdminPedidos(estado?: string) {
  return useQuery({
    queryKey: ['admin-pedidos', estado],
    queryFn: async () => {
      const res = await client.get('/admin/pedidos', {
        params: estado ? { estado } : undefined,
      })
      return res.data as PedidoListResponse[]
    },
  })
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente:       'bg-yellow-100 text-yellow-800',
  confirmado:      'bg-blue-100 text-blue-800',
  en_preparacion:  'bg-purple-100 text-purple-800',
  en_camino:       'bg-indigo-100 text-indigo-800',
  entregado:       'bg-green-100 text-green-800',
  cancelado:       'bg-red-100 text-red-800',
}

const NEXT_STATE: Record<string, string> = {
  pendiente:      'confirmado',
  confirmado:     'en_preparacion',
  en_preparacion: 'en_camino',
  en_camino:      'entregado',
}

const NEXT_LABEL: Record<string, string> = {
  pendiente:      '👨‍🍳 Mandar a Cocina',
  confirmado:     '👨‍🍳 Preparando',
  en_preparacion: '🚚 En camino',
  en_camino:      '✅ Entregado',
}

export default function AdminPedidosPage() {
  const [filterEstado, setFilterEstado] = useState('')
  const { data: pedidos = [], isLoading } = useAdminPedidos(filterEstado || undefined)
  const avanzar = useAvanzarEstado()
  const [search, setSearch] = useState('')

  const filtered = pedidos.filter((p) =>
    p.numero_pedido.toLowerCase().includes(search.toLowerCase()),
  )

  async function handleAvanzar(id: number, estado: string) {
    const next = NEXT_STATE[estado]
    if (!next) return
    await avanzar.mutateAsync({ id, nuevo_estado: next })
  }

  const ESTADOS = ['pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado']

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold">Gestión de Pedidos</h1>
          <p className="text-orange-100 mt-1">Todos los pedidos del sistema</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            id="search-pedidos"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-full max-w-xs"
            placeholder="Buscar por Nº pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            id="filter-estado"
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nº Pedido</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => {
                  const badgeCls = ESTADO_BADGE[p.estado_nombre] ?? 'bg-gray-100 text-gray-700'
                  const nextLabel = NEXT_LABEL[p.estado_nombre]
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-semibold text-gray-900">{p.numero_pedido}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(p.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeCls}`}>
                          {p.estado_nombre.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">
                        ${parseFloat(p.total).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {nextLabel && (
                          <button
                            id={`btn-avanzar-${p.id}`}
                            onClick={() => handleAvanzar(p.id, p.estado_nombre)}
                            disabled={avanzar.isPending}
                            className="text-xs bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
                          >
                            {nextLabel}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">No se encontraron pedidos.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
