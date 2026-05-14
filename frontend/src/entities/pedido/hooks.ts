/**
 * TanStack Query hooks for the Pedidos entity.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidoApi } from './api'
import { useCartStore } from '@/entities/cart/store'
import type { PedidoCreatePayload } from './types'

export const PEDIDOS_KEY = 'pedidos'

export function usePedidos(estado?: string) {
  return useQuery({
    queryKey: [PEDIDOS_KEY, estado],
    queryFn: () => pedidoApi.list(estado),
  })
}

export function usePedido(id: number) {
  return useQuery({
    queryKey: [PEDIDOS_KEY, id],
    queryFn: () => pedidoApi.getById(id),
    enabled: !!id,
  })
}

export function useCreatePedido() {
  const queryClient = useQueryClient()
  const clearCart = useCartStore((s) => s.clearCart)

  return useMutation({
    mutationFn: (payload: PedidoCreatePayload) => pedidoApi.create(payload),
    onSuccess: () => {
      // Clear the cart after a successful order creation
      clearCart()
      queryClient.invalidateQueries({ queryKey: [PEDIDOS_KEY] })
    },
  })
}

export function useAvanzarEstado() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, nuevo_estado, nota }: { id: number; nuevo_estado: string; nota?: string }) =>
      pedidoApi.avanzarEstado(id, nuevo_estado, nota),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PEDIDOS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] })
    },
  })
}

export function useCancelarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => pedidoApi.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PEDIDOS_KEY] })
    },
  })
}
