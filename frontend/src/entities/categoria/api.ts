/**
 * API functions for the /categorias endpoints.
 */

import client from '@/shared/api/client'
import type {
  Categoria,
  CategoriaTree,
  CategoriaCreatePayload,
  CategoriaUpdatePayload,
} from './types'

export const categoriasApi = {
  /** Fetch flat list of categories */
  getAll: async (includeInactive = false): Promise<Categoria[]> => {
    const { data } = await client.get<Categoria[]>('/categorias', {
      params: { include_inactive: includeInactive },
    })
    return data
  },

  /** Fetch nested tree of categories */
  getTree: async (includeInactive = false): Promise<CategoriaTree[]> => {
    const { data } = await client.get<CategoriaTree[]>('/categorias', {
      params: { tree: true, include_inactive: includeInactive },
    })
    return data
  },

  /** Fetch single category by ID */
  getById: async (id: number): Promise<Categoria> => {
    const { data } = await client.get<Categoria>(`/categorias/${id}`)
    return data
  },

  /** Create a new category (ADMIN | STOCK) */
  create: async (payload: CategoriaCreatePayload): Promise<Categoria> => {
    const { data } = await client.post<Categoria>('/categorias', payload)
    return data
  },

  /** Update an existing category (ADMIN | STOCK) */
  update: async (id: number, payload: CategoriaUpdatePayload): Promise<Categoria> => {
    const { data } = await client.put<Categoria>(`/categorias/${id}`, payload)
    return data
  },

  /** Soft delete a category (ADMIN | STOCK) */
  delete: async (id: number): Promise<void> => {
    await client.delete(`/categorias/${id}`)
  },
}
