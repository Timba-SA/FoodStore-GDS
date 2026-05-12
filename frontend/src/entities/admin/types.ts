/**
 * Types for admin entities.
 */

export interface UsuarioListItem {
  id: number
  nombre: string
  email: string
  numero_telefono: string | null
  activo: boolean
  roles: string[]
  created_at: string
  deleted_at: string | null
}

export interface UsuarioCreate {
  nombre: string
  email: string
  password: string
  numero_telefono?: string
  roles_ids: number[]
}

export interface UsuarioUpdate {
  nombre?: string
  email?: string
  numero_telefono?: string
  activo?: boolean
}

// ── Metrics ──────────────────────────────────────────────────────────────────

export interface TopProducto {
  nombre: string
  cantidad: number
}

export interface DashboardMetrics {
  total_pedidos: number
  total_ingresos: number
  pedidos_hoy: number
  ingresos_hoy: number
  top_producto: TopProducto | null
}

export interface VentaDelDia {
  fecha: string
  ingresos: number
}

export interface EstadoPedidoCount {
  estado: string
  cantidad: number
}
