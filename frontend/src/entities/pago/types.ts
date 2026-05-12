/**
 * TypeScript interfaces for the Pago domain.
 */

export interface PagoCreatePayload {
  pedido_id: number
  token: string
  installments: number
  payment_method_id: string
  issuer_id?: string
  email: string
}

export interface PagoResponse {
  id: number
  pedido_id: number
  monto: string
  mp_payment_id: string | null
  mp_status: string | null
  estado: string
  idempotency_key: string | null
  referencia_externa: string | null
  created_at: string
}

export type MpStatus = 'approved' | 'rejected' | 'pending' | 'in_process' | null
