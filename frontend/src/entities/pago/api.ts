/**
 * API client for the Pagos endpoints.
 */

import client from '@/shared/api/client'
import type { PagoCreatePayload, PagoResponse } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getData = (r: any) => r.data

export const pagoApi = {
  processPayment: (payload: PagoCreatePayload): Promise<PagoResponse> =>
    client.post('/pagos', payload).then(getData),

  getByPedido: (pedidoId: number): Promise<PagoResponse[]> =>
    client.get(`/pagos/pedido/${pedidoId}`).then(getData),
}
