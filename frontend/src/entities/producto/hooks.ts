/**
 * TanStack Query hooks for the Producto entity.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productosApi } from './api'
import type { ProductoCreatePayload, ProductoStockUpdate, ProductoUpdatePayload, ProductosFilters } from './types'

export const PRODUCTOS_KEYS = {
  all: ['productos'] as const,
  list: (filters: ProductosFilters) => ['productos', 'list', filters] as const,
  detail: (id: number) => ['productos', id] as const,
}

export function useProductos(filters: ProductosFilters = {}) {
  return useQuery({
    queryKey: PRODUCTOS_KEYS.list(filters),
    queryFn: () => productosApi.getAll(filters),
  })
}

export function useProducto(id: number) {
  return useQuery({
    queryKey: PRODUCTOS_KEYS.detail(id),
    queryFn: () => productosApi.getById(id),
    enabled: id > 0,
  })
}

export function useCreateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductoCreatePayload) => productosApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTOS_KEYS.all }),
  })
}

export function useUpdateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductoUpdatePayload }) =>
      productosApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTOS_KEYS.all }),
  })
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductoStockUpdate }) =>
      productosApi.updateStock(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTOS_KEYS.all }),
  })
}

export function useDeleteProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productosApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTOS_KEYS.all }),
  })
}
