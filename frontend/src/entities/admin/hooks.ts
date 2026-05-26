import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from './api'
import type { UsuarioCreate, UsuarioUpdate } from './types'

export const ADMIN_USERS_KEY = 'admin-users'
export const ADMIN_METRICS_KEY = 'admin-metrics'

// ── User hooks ────────────────────────────────────────────────────────────────

export function useAdminUsers(includeDeleted = false) {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, includeDeleted],
    queryFn: () => adminApi.listUsers(0, 200, includeDeleted),
  })
}

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, id],
    queryFn: () => adminApi.getUser(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UsuarioCreate) => adminApi.createUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UsuarioUpdate }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  })
}

export function useUpdateRoles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) =>
      adminApi.updateRoles(id, roles),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  })
}

// ── Metrics hooks ─────────────────────────────────────────────────────────────

export function useDashboardMetrics() {
  return useQuery({
    queryKey: [ADMIN_METRICS_KEY, 'dashboard'],
    queryFn: adminApi.getDashboard,
    refetchInterval: 30_000, // auto-refresh every 30s
  })
}

export function useVentasMetrics(dias = 7) {
  return useQuery({
    queryKey: [ADMIN_METRICS_KEY, 'ventas', dias],
    queryFn: () => adminApi.getVentas(dias),
    refetchInterval: 60_000,
  })
}

export function useProductosTop(limit = 5) {
  return useQuery({
    queryKey: [ADMIN_METRICS_KEY, 'productos-top', limit],
    queryFn: () => adminApi.getProductosTop(limit),
    refetchInterval: 60_000,
  })
}

export function useEstadosPedidos() {
  return useQuery({
    queryKey: [ADMIN_METRICS_KEY, 'estados-pedidos'],
    queryFn: adminApi.getEstadosPedidos,
    refetchInterval: 30_000,
  })
}
