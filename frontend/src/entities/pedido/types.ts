/**
 * TypeScript interfaces for the Pedido domain.
 */

export interface CartItemPayload {
  producto_id: number
  cantidad: number
  personalizacion: number[]
}

export interface PedidoCreatePayload {
  direccion_entrega_id: number
  items: CartItemPayload[]
  notas?: string
}

export interface DetallePedidoResponse {
  id: number
  producto_id: number
  nombre_snapshot: string | null
  cantidad: number
  precio_unitario: string
  subtotal: string
  personalizacion: number[] | null
}

export interface HistorialEstadoResponse {
  id: number
  estado_nombre: string
  fecha_cambio: string
  usuario_id: number | null
  nota: string | null
}

export interface PedidoResponse {
  id: number
  usuario_id: number
  numero_pedido: string
  estado_nombre: string
  subtotal: string
  impuestos: string
  costo_envio: string
  total: string
  direccion_entrega_id: number | null
  direccion_snapshot: Record<string, string> | null
  notas: string | null
  created_at: string
  detalles: DetallePedidoResponse[]
  historial: HistorialEstadoResponse[]
}

export interface PedidoListResponse {
  id: number
  numero_pedido: string
  estado_nombre: string
  total: string
  created_at: string
}
