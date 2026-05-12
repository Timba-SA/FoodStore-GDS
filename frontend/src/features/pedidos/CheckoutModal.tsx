/**
 * CheckoutModal — Triggered from CartDrawer when the user clicks "Proceder al pago".
 * Lets the user select a delivery address and confirm the order.
 */

import { useState } from 'react'
import { useDirecciones } from '@/entities/direccion/hooks'
import { useCreatePedido } from '@/entities/pedido/hooks'
import { useCartStore } from '@/entities/cart/store'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function CheckoutModal({ onClose, onSuccess }: Props) {
  const { data: direcciones = [], isLoading: loadingDirs } = useDirecciones()
  const { items, getSubtotal } = useCartStore()
  const createPedido = useCreatePedido()

  const defaultDir = direcciones.find((d) => d.es_predeterminada) ?? direcciones[0]
  const [selectedDirId, setSelectedDirId] = useState<number | null>(defaultDir?.id ?? null)
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!selectedDirId) {
      setError('Seleccioná una dirección de entrega.')
      return
    }
    if (items.length === 0) {
      setError('El carrito está vacío.')
      return
    }

    setError(null)
    try {
      await createPedido.mutateAsync({
        direccion_entrega_id: selectedDirId,
        items: items.map((item) => ({
          producto_id: item.productoId,
          cantidad: item.cantidad,
          personalizacion: item.personalizacion,
        })),
        notas: notas || undefined,
      })
      onSuccess()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
            'Error al crear el pedido.'
          : 'Error al crear el pedido.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  const subtotal = getSubtotal().toFixed(2)
  const isPending = createPedido.isPending

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Confirmar pedido</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Resumen ({items.length} ítem{items.length !== 1 ? 's' : ''})
            </p>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.cantidad}× {item.producto.nombre}
                    {item.personalizacion.length > 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        (sin {item.personalizacion.length} ingrediente{item.personalizacion.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-gray-900">
                    ${(parseFloat(item.producto.precio) * item.cantidad).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span className="text-orange-600">${subtotal}</span>
            </div>
          </div>

          {/* Address selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Dirección de entrega
            </label>
            {loadingDirs ? (
              <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            ) : direcciones.length === 0 ? (
              <p className="text-sm text-red-500">
                No tenés direcciones guardadas.{' '}
                <a href="/dashboard/direcciones" className="underline text-orange-600">
                  Agregar una
                </a>
              </p>
            ) : (
              <div className="space-y-2">
                {direcciones.map((dir) => (
                  <label
                    key={dir.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      selectedDirId === dir.id
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="direccion"
                      value={dir.id}
                      checked={selectedDirId === dir.id}
                      onChange={() => setSelectedDirId(dir.id)}
                      className="mt-0.5 accent-orange-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {dir.calle} {dir.numero}
                        {dir.departamento ? `, Dpto ${dir.departamento}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dir.ciudad}, {dir.provincia}
                      </p>
                      {dir.es_predeterminada && (
                        <span className="text-[10px] text-orange-600 font-semibold">
                          Predeterminada
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Notas (opcional)
            </label>
            <textarea
              id="checkout-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Timbre 2B, dejar en portería..."
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-order"
              onClick={handleConfirm}
              disabled={isPending || direcciones.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {isPending ? 'Procesando...' : `Confirmar pedido — $${subtotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
