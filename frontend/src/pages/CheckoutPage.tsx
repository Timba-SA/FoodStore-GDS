/**
 * CheckoutPage — Payment page for a specific PENDIENTE order.
 * Route: /dashboard/pedidos/:id/pagar
 *
 * Flow:
 * 1. Load the order. If not PENDIENTE, show message.
 * 2. Show PaymentForm (MP tokenization).
 * 3. After payment submitted, show result and poll for FSM transition.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePedido } from '@/entities/pedido/hooks'
import { usePagosByPedido } from '@/entities/pago/hooks'
import PaymentForm from '@/features/pagos/PaymentForm'
import type { PagoResponse } from '@/entities/pago/types'

const MP_STATUS_INFO: Record<string, { label: string; icon: string; color: string }> = {
  approved:   { label: 'Pago aprobado', icon: '🎉', color: 'text-green-700 bg-green-50 border-green-300' },
  rejected:   { label: 'Pago rechazado', icon: '❌', color: 'text-red-700 bg-red-50 border-red-300' },
  pending:    { label: 'Pago pendiente', icon: '⏳', color: 'text-yellow-700 bg-yellow-50 border-yellow-300' },
  in_process: { label: 'Pago en proceso', icon: '🔄', color: 'text-blue-700 bg-blue-50 border-blue-300' },
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const pedidoId = parseInt(id ?? '0', 10)
  const navigate = useNavigate()

  const { data: pedido, isLoading } = usePedido(pedidoId)
  const { data: pagos = [] } = usePagosByPedido(pedidoId)
  const [lastPago, setLastPago] = useState<PagoResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Check if an approved payment already exists (from poll or last submit)
  const approvedPago = pagos.find((p) => p.mp_status === 'approved')
  const isConfirmed = pedido?.estado_nombre === 'confirmado' || !!approvedPago

  function handleSuccess(pago: PagoResponse) {
    setLastPago(pago)
    setErrorMsg(null)
  }

  function handleError(msg: string) {
    setErrorMsg(msg)
    setLastPago(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando pedido...</div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">😕</span>
          <p className="mt-4 text-gray-600">Pedido no encontrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-8">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate('/dashboard/pedidos')}
            className="text-orange-200 hover:text-white text-sm mb-3 flex items-center gap-1 transition"
          >
            ← Mis Pedidos
          </button>
          <h1 className="text-2xl font-extrabold">Pagar pedido</h1>
          <p className="text-orange-100 text-sm mt-1">{pedido.numero_pedido}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Success state — confirmed by FSM or approved payment */}
        {isConfirmed ? (
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8 text-center">
            <span className="text-6xl block mb-4">🎉</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago aprobado!</h2>
            <p className="text-gray-500 mb-2">
              Tu pedido <span className="font-semibold">{pedido.numero_pedido}</span> fue confirmado.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Estamos preparando tu pedido. Podés seguir su estado en Mis Pedidos.
            </p>
            <button
              id="btn-back-pedidos"
              onClick={() => navigate('/dashboard/pedidos')}
              className="bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-700 transition"
            >
              Ver mis pedidos
            </button>
          </div>
        ) : pedido.estado_nombre !== 'pendiente' ? (
          /* Order not in PENDIENTE — can't pay */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <span className="text-5xl block mb-4">ℹ️</span>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Este pedido no está pendiente de pago</h2>
            <p className="text-gray-500 text-sm mb-6">
              Estado actual: <span className="font-semibold capitalize">{pedido.estado_nombre}</span>
            </p>
            <button
              onClick={() => navigate('/dashboard/pedidos')}
              className="border border-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              Volver a Mis Pedidos
            </button>
          </div>
        ) : (
          /* Payment form */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Datos de pago</h2>
            <p className="text-xs text-gray-400">
              🔒 Tus datos de tarjeta son procesados directamente por MercadoPago de forma segura.
            </p>

            {/* Last payment status badge */}
            {lastPago && lastPago.mp_status && (
              <div className={`border rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-semibold ${MP_STATUS_INFO[lastPago.mp_status]?.color ?? ''}`}>
                <span>{MP_STATUS_INFO[lastPago.mp_status]?.icon ?? '•'}</span>
                <span>{MP_STATUS_INFO[lastPago.mp_status]?.label ?? lastPago.mp_status}</span>
                {lastPago.mp_status === 'pending' && (
                  <span className="ml-auto text-xs font-normal">Verificando automáticamente...</span>
                )}
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <div className="border border-red-200 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                {errorMsg}
                <button
                  onClick={() => setErrorMsg(null)}
                  className="ml-2 underline hover:no-underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Show form if last attempt wasn't approved */}
            {(!lastPago || lastPago.mp_status !== 'approved') && (
              <PaymentForm
                pedidoId={pedidoId}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
          </div>
        )}

        {/* Payment history */}
        {pagos.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Intentos de pago
            </p>
            <div className="space-y-2">
              {pagos.map((p) => {
                const info = MP_STATUS_INFO[p.mp_status ?? '']
                return (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {info?.icon ?? '•'} {info?.label ?? p.mp_status ?? 'Desconocido'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(p.created_at).toLocaleString('es-AR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
