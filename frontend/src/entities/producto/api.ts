/**
 * API functions for the /productos endpoints.
 */

import client from '@/shared/api/client'
import type {
  Producto,
  ProductoCreatePayload,
  ProductoFilters,
  ProductoStockUpdate,
  ProductoUpdatePayload,
  ProductosFilters,
} from './types'

export const productosApi = {
  getAll: async (filters: ProductosFilters = {}): Promise<Producto[]> => {
    const { data } = await client.get<Producto[]>('/productos', { params: filters })
    return data
  },

  getById: async (id: number): Promise<Producto> => {
    const { data } = await client.get<Producto>(`/productos/${id}`)
    return data
  },

  create: async (payload: ProductoCreatePayload): Promise<Producto> => {
    const { data } = await client.post<Producto>('/productos', payload)
    return data
  },

  update: async (id: number, payload: ProductoUpdatePayload): Promise<Producto> => {
    const { data } = await client.put<Producto>(`/productos/${id}`, payload)
    return data
  },

  updateStock: async (id: number, payload: ProductoStockUpdate): Promise<Producto> => {
    const { data } = await client.patch<Producto>(`/productos/${id}/stock`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/productos/${id}`)
  },
}
