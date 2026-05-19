/**
 * API client for the Pedidos endpoints.
 * Mirrors the pattern used in direccionesApi.
 */

import client from '@/shared/api/client'
import type {
  PedidoCreatePayload,
  PedidoResponse,
  PedidoListResponse,
} from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getData = (r: any) => r.data

export const pedidoApi = {
  create: (payload: PedidoCreatePayload): Promise<PedidoResponse> =>
    client.post('/pedidos', payload).then(getData),

  list: (estado?: string): Promise<PedidoListResponse[]> =>
    client.get('/pedidos', { params: estado ? { estado } : undefined }).then(getData),

  getById: (id: number): Promise<PedidoResponse> =>
    client.get(`/pedidos/${id}`).then(getData),

  avanzarEstado: (id: number, nuevo_estado: string, nota?: string): Promise<PedidoResponse> =>
    client.patch(`/pedidos/${id}/estado`, { nuevo_estado, nota }).then(getData),

  cancelar: (id: number): Promise<void> =>
    client.delete(`/pedidos/${id}`).then(() => undefined),

  ocultar: (id: number): Promise<void> =>
    client.delete(`/pedidos/${id}/ocultar`).then(() => undefined),
}
