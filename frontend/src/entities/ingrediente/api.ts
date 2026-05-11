/**
 * API functions for the /ingredientes endpoints.
 */

import client from '@/shared/api/client'
import type {
  Ingrediente,
  IngredienteCreatePayload,
  IngredienteUpdatePayload,
} from './types'

export interface IngredientesFilters {
  include_inactive?: boolean
  solo_alergenos?: boolean
  search?: string
}

export const ingredientesApi = {
  getAll: async (filters: IngredientesFilters = {}): Promise<Ingrediente[]> => {
    const { data } = await client.get<Ingrediente[]>('/ingredientes', { params: filters })
    return data
  },

  getById: async (id: number): Promise<Ingrediente> => {
    const { data } = await client.get<Ingrediente>(`/ingredientes/${id}`)
    return data
  },

  create: async (payload: IngredienteCreatePayload): Promise<Ingrediente> => {
    const { data } = await client.post<Ingrediente>('/ingredientes', payload)
    return data
  },

  update: async (id: number, payload: IngredienteUpdatePayload): Promise<Ingrediente> => {
    const { data } = await client.put<Ingrediente>(`/ingredientes/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/ingredientes/${id}`)
  },
}
