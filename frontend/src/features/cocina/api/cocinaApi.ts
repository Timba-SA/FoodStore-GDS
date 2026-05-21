/**
 * API client and TanStack Query hooks for the Kitchen Display System (KDS).
 */

import client from '@/shared/api/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { KdsOrder, ProductoAvailabilityResponse } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getData = (r: any) => r.data

export const cocinaApi = {
  /**
   * Fetch active kitchen orders (confirmado, en_preparacion) sorted oldest first.
   */
  getActiveOrders: (): Promise<KdsOrder[]> =>
    client.get('/cocina/pedidos').then(getData),

  /**
   * Toggle temporary availability for a product.
   */
  updateProductAvailability: (
    id: number,
    disponible: boolean
  ): Promise<ProductoAvailabilityResponse> =>
    client.patch(`/cocina/productos/${id}/disponibilidad`, { disponible }).then(getData),

  /**
   * Advance or change order status in the FSM state machine.
   */
  updateOrderStatus: (
    id: number,
    nuevo_estado: string,
    nota?: string
  ): Promise<KdsOrder> =>
    client.patch(`/pedidos/${id}/estado`, { nuevo_estado, nota }).then(getData),
}

export const KDS_ORDERS_KEY = 'kds-orders'

/**
 * Hook to retrieve active kitchen orders.
 */
export function useGetKdsOrders() {
  return useQuery<KdsOrder[]>({
    queryKey: [KDS_ORDERS_KEY],
    queryFn: () => cocinaApi.getActiveOrders(),
  })
}

/**
 * Hook to update an order's status (e.g., transition from confirmado to en_preparacion, etc.).
 */
export function useUpdateKdsOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      nuevo_estado,
      nota,
    }: {
      id: number
      nuevo_estado: string
      nota?: string
    }) => cocinaApi.updateOrderStatus(id, nuevo_estado, nota),
    onSuccess: () => {
      // Invalidate KDS orders list, user orders, and admin orders to ensure sync
      queryClient.invalidateQueries({ queryKey: [KDS_ORDERS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] })
    },
  })
}

/**
 * Hook to temporarily toggle a product's availability.
 */
export function useUpdateKdsProductAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, disponible }: { id: number; disponible: boolean }) =>
      cocinaApi.updateProductAvailability(id, disponible),
    onSuccess: () => {
      // Invalidate queries for products list and stock control
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}
