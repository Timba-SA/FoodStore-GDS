import client from '@/shared/api/client'
import type {
  UsuarioListItem,
  UsuarioCreate,
  UsuarioUpdate,
  DashboardMetrics,
  VentaDelDia,
  TopProducto,
  EstadoPedidoCount,
} from './types'
import type { User } from '@/features/auth/store/authStore'

const d = (r: { data: unknown }) => r.data

export const adminApi = {
  // Users
  listUsers: (skip = 0, limit = 50, includeDeleted = false): Promise<UsuarioListItem[]> =>
    client
      .get('/admin/usuarios', { params: { skip, limit, include_deleted: includeDeleted } })
      .then(d) as Promise<UsuarioListItem[]>,

  getUser: (id: number): Promise<UsuarioListItem> =>
    client.get(`/admin/usuarios/${id}`).then(d) as Promise<UsuarioListItem>,

  createUser: (data: UsuarioCreate): Promise<User> =>
    client.post('/admin/usuarios', data).then(d) as Promise<User>,

  updateUser: (id: number, data: UsuarioUpdate): Promise<User> =>
    client.put(`/admin/usuarios/${id}`, data).then(d) as Promise<User>,

  updateRoles: (id: number, roles_ids: number[]): Promise<User> =>
    client.put(`/admin/usuarios/${id}/roles`, { roles_ids }).then(d) as Promise<User>,

  deleteUser: (id: number): Promise<{ message: string }> =>
    client.delete(`/admin/usuarios/${id}`).then(d) as Promise<{ message: string }>,

  // Metrics
  getDashboard: (): Promise<DashboardMetrics> =>
    client.get('/admin/metricas/dashboard').then(d) as Promise<DashboardMetrics>,

  getVentas: (dias = 7): Promise<VentaDelDia[]> =>
    client.get('/admin/metricas/ventas', { params: { dias } }).then(d) as Promise<VentaDelDia[]>,

  getProductosTop: (limit = 5): Promise<TopProducto[]> =>
    client
      .get('/admin/metricas/productos-top', { params: { limit } })
      .then(d) as Promise<TopProducto[]>,

  getEstadosPedidos: (): Promise<EstadoPedidoCount[]> =>
    client.get('/admin/metricas/estados-pedidos').then(d) as Promise<EstadoPedidoCount[]>,
}
