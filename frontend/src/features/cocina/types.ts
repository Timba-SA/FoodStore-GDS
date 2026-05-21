/**
 * TypeScript typings for the Kitchen Display System (KDS).
 * Matches 1:1 the backend Pydantic and WebSocket schemas from Phase 2.
 */

export interface KdsOrderDetail {
  id: number
  producto_id: number
  nombre_snapshot: string | null
  cantidad: number
  personalizacion: number[] | null
}

export interface KdsOrder {
  id: number
  numero_pedido: string
  estado_nombre: string
  notas: string | null
  created_at: string // Serialized ISO datetime string
  detalles: KdsOrderDetail[]
}

export interface ProductoAvailabilityResponse {
  id: number
  nombre: string
  disponible: boolean
}

/**
 * Discriminated union for WebSocket events broadcasted by the Cocina server.
 */
export type WsEvent =
  | {
      event: 'pedido_actualizado'
      pedido_id: number
      estado: string
      usuario_id: number
    }
  | {
      event: 'pedido_creado'
      pedido_id: number
      estado: string
      usuario_id: number
    }

/**
 * Envelope for WebSocket messages.
 */
export interface WsMessage {
  type: string
  payload: WsEvent
}
