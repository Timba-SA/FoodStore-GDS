/**
 * TanStack Query hooks for the Pago entity.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pagoApi } from './api'
import { PEDIDOS_KEY } from '@/entities/pedido/hooks'
import type { PagoCreatePayload } from './types'

export const PAGOS_KEY = 'pagos'

export function usePagosByPedido(pedidoId: number) {
  return useQuery({
    queryKey: [PAGOS_KEY, pedidoId],
    queryFn: () => pagoApi.getByPedido(pedidoId),
    enabled: !!pedidoId,
    // Poll every 5s while waiting for MP webhook confirmation
    refetchInterval: 5000,
  })
}

export function useProcessPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PagoCreatePayload) => pagoApi.processPayment(payload),
    onSuccess: (_data, variables) => {
      // Invalidate both pagos and pedidos caches — order state might have changed
      queryClient.invalidateQueries({ queryKey: [PAGOS_KEY, variables.pedido_id] })
      queryClient.invalidateQueries({ queryKey: [PEDIDOS_KEY] })
    },
  })
}
