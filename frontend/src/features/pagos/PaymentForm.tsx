/**
 * PaymentForm — Integrates the MercadoPago SDK React component for secure card tokenization.
 *
 * PCI DSS SAQ-A compliance:
 * - The card number, CVV, and expiry are entered directly in MP's hosted fields.
 * - Our server ONLY receives the token (not raw card data).
 */

import { useState, useEffect } from 'react'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import { useProcessPayment } from '@/entities/pago/hooks'
import { usePedido } from '@/entities/pedido/hooks'
import type { PagoResponse } from '@/entities/pago/types'

interface Props {
  pedidoId: number
  onSuccess: (pago: PagoResponse) => void
  onError: (msg: string) => void
}

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || ''

export default function PaymentForm({ pedidoId, onSuccess, onError }: Props) {
  const { data: pedido } = usePedido(pedidoId)
  const processPayment = useProcessPayment()
  const [mpReady, setMpReady] = useState(false)

  useEffect(() => {
    if (MP_PUBLIC_KEY) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' })
      setMpReady(true)
    }
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleSubmit(formData: any) {
    try {
      const pago = await processPayment.mutateAsync({
        pedido_id: pedidoId,
        token: formData.token,
        installments: formData.installments,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        email: formData.payer?.email || '',
      })
      onSuccess(pago)
    } catch (e: unknown) {
      const detail =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      onError(typeof detail === 'string' ? detail : 'Error al procesar el pago. Intentá de nuevo.')
    }
  }

  if (!MP_PUBLIC_KEY) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 text-sm text-yellow-800">
        ⚠️ MercadoPago no está configurado en este entorno. Agregá{' '}
        <code className="font-mono bg-yellow-100 px-1 rounded">VITE_MP_PUBLIC_KEY</code> al{' '}
        <code className="font-mono bg-yellow-100 px-1 rounded">.env</code>.
      </div>
    )
  }

  if (!pedido) {
    return <div className="h-20 bg-gray-100 animate-pulse rounded-xl" />
  }

  return (
    <div className="space-y-4">
      {/* Amount display */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-semibold text-orange-900">
          Total a pagar — {pedido.numero_pedido}
        </span>
        <span className="text-xl font-bold text-orange-600">
          ${parseFloat(pedido.total).toFixed(2)}
        </span>
      </div>

      {/* MercadoPago secure card form */}
      {mpReady ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <CardPayment
            initialization={{
              amount: parseFloat(pedido.total),
              payer: { email: '' },
            }}
            onSubmit={handleSubmit}
            onError={(error) => onError(`Error MP: ${JSON.stringify(error)}`)}
            customization={{
              visual: {
                style: {
                  theme: 'default',
                  customVariables: {
                    baseColor: '#ea580c',
                    buttonBackground: '#ea580c',
                  },
                },
              },
            }}
          />
        </div>
      ) : (
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
          <span className="text-sm text-gray-400">Cargando formulario de pago...</span>
        </div>
      )}

      {processPayment.isPending && (
        <div className="text-center text-sm text-gray-500 animate-pulse">
          Procesando pago...
        </div>
      )}
    </div>
  )
}
