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
import { usePagosByPedido, useCrearPreferencia } from '@/entities/pago/hooks'
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

  const crearPreferencia = useCrearPreferencia()

  const approvedPago = pagos.find((p) => p.mp_status === 'approved')
  const isConfirmed = pedido?.estado_nombre === 'confirmado' || !!approvedPago

  const handlePay = () => {
    setErrorMsg(null)
    crearPreferencia.mutate(pedidoId, {
      onSuccess: (data) => {
        window.location.href = data.init_point
      },
      onError: (err: any) => {
        const detail = err?.response?.data?.detail || 'Error al conectar con Mercado Pago. Intentá de nuevo.'
        setErrorMsg(detail)
      }
    })
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
          /* Checkout Pro Button Form */
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Checkout de Pago</h2>
                <p className="text-xs text-slate-400">
                  Vas a ser redirigido de forma segura al portal oficial de Mercado Pago.
                </p>
              </div>
            </div>

            {/* Total amount summary card */}
            <div className="bg-gradient-to-br from-orange-50/40 to-amber-50/20 border border-orange-100/60 rounded-2xl p-5 flex justify-between items-center shadow-[0_2px_15px_rgba(245,158,11,0.02)]">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider">
                  Total a abonar
                </span>
                <p className="text-xs font-medium text-slate-500">
                  Pedido {pedido.numero_pedido}
                </p>
              </div>
              <span className="text-2xl font-extrabold text-orange-600">
                ${parseFloat(pedido.total).toFixed(2)}
              </span>
            </div>

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
              <div className="border border-red-200 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700 flex justify-between items-center">
                <span>{errorMsg}</span>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="underline hover:no-underline font-semibold ml-2"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Checkout Pro Redirection Button */}
            <div className="space-y-4">
              <button
                type="button"
                disabled={crearPreferencia.isPending}
                onClick={handlePay}
                className="w-full bg-[#009ee3] hover:bg-[#008cc9] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
              >
                {crearPreferencia.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Conectando con Mercado Pago...
                  </>
                ) : (
                  <>
                    <span>Pagar con Mercado Pago</span>
                    <span className="text-lg">⚡</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  🔒 Transacción procesada de forma externa y segura
                </span>
              </div>
            </div>
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
