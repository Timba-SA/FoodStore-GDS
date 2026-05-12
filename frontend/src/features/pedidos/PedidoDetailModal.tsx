/**
 * PedidoDetailModal — Shows full order details with a visual state timeline.
 */

import { usePedido, useCancelarPedido } from '@/entities/pedido/hooks'
import type { HistorialEstadoResponse } from '@/entities/pedido/types'

interface Props {
  pedidoId: number
  onClose: () => void
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente:       'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmado:      'bg-blue-100 text-blue-800 border-blue-300',
  en_preparacion:  'bg-purple-100 text-purple-800 border-purple-300',
  en_camino:       'bg-indigo-100 text-indigo-800 border-indigo-300',
  entregado:       'bg-green-100 text-green-800 border-green-300',
  cancelado:       'bg-red-100 text-red-800 border-red-300',
}

const ESTADO_ICONS: Record<string, string> = {
  pendiente:       '⏳',
  confirmado:      '✅',
  en_preparacion:  '👨‍🍳',
  en_camino:       '🚚',
  entregado:       '🎉',
  cancelado:       '❌',
}

function EstadoBadge({ nombre }: { nombre: string }) {
  const cls = ESTADO_COLORS[nombre] ?? 'bg-gray-100 text-gray-800 border-gray-300'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {ESTADO_ICONS[nombre] ?? '•'} {nombre.replace('_', ' ')}
    </span>
  )
}

function Timeline({ historial }: { historial: HistorialEstadoResponse[] }) {
  return (
    <div className="space-y-0">
      {historial.map((h, i) => (
        <div key={h.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${
              i === historial.length - 1 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'
            }`}>
              {ESTADO_ICONS[h.estado_nombre] ?? '•'}
            </div>
            {i < historial.length - 1 && (
              <div className="w-0.5 h-6 bg-gray-200" />
            )}
          </div>
          <div className="pb-4">
            <p className="text-sm font-semibold text-gray-800 capitalize">
              {h.estado_nombre.replace('_', ' ')}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(h.fecha_cambio).toLocaleString('es-AR', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {h.nota && <p className="text-xs text-gray-500 italic mt-0.5">{h.nota}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PedidoDetailModal({ pedidoId, onClose }: Props) {
  const { data: pedido, isLoading } = usePedido(pedidoId)
  const cancelar = useCancelarPedido()

  const canCancel = pedido && ['pendiente', 'confirmado'].includes(pedido.estado_nombre)

  async function handleCancel() {
    if (!confirm('¿Estás seguro que querés cancelar este pedido?')) return
    await cancelar.mutateAsync(pedidoId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {pedido ? `#${pedido.numero_pedido}` : 'Detalle de pedido'}
            </h2>
            {pedido && <EstadoBadge nombre={pedido.estado_nombre} />}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-lg">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : pedido ? (
            <>
              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Productos
                </p>
                <div className="space-y-2">
                  {pedido.detalles.map((d) => (
                    <div key={d.id} className="flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium text-gray-900">
                          {d.cantidad}× {d.nombre_snapshot ?? `Producto #${d.producto_id}`}
                        </p>
                        {d.personalizacion && d.personalizacion.length > 0 && (
                          <p className="text-xs text-gray-400">
                            Sin ingredientes ID: {d.personalizacion.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="text-gray-700 font-medium">${parseFloat(d.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>${parseFloat(pedido.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Envío</span><span>${parseFloat(pedido.costo_envio).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-orange-600">${parseFloat(pedido.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery address */}
              {pedido.direccion_snapshot && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Dirección de entrega
                  </p>
                  <p className="text-sm text-gray-700">
                    {pedido.direccion_snapshot.calle} {pedido.direccion_snapshot.numero}
                    {pedido.direccion_snapshot.departamento
                      ? `, Dpto ${pedido.direccion_snapshot.departamento}`
                      : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pedido.direccion_snapshot.ciudad}, {pedido.direccion_snapshot.provincia}
                  </p>
                </div>
              )}

              {/* Timeline */}
              {pedido.historial.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Historial
                  </p>
                  <Timeline historial={pedido.historial} />
                </div>
              )}

              {/* Notes */}
              {pedido.notas && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">Notas</p>
                  <p className="text-sm text-yellow-700">{pedido.notas}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-400">No se pudo cargar el pedido.</p>
          )}
        </div>

        {/* Footer */}
        {canCancel && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button
              id={`btn-cancel-pedido-${pedidoId}`}
              onClick={handleCancel}
              disabled={cancelar.isPending}
              className="w-full py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50"
            >
              {cancelar.isPending ? 'Cancelando...' : 'Cancelar pedido'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
