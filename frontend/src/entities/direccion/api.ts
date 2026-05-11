/**
 * API functions for the /direcciones endpoints.
 */

import client from '@/shared/api/client'
import type { Direccion, DireccionCreatePayload, DireccionUpdatePayload } from './types'

export const direccionesApi = {
  getAll: async (): Promise<Direccion[]> => {
    const { data } = await client.get<Direccion[]>('/direcciones')
    return data
  },

  create: async (payload: DireccionCreatePayload): Promise<Direccion> => {
    const { data } = await client.post<Direccion>('/direcciones', payload)
    return data
  },

  update: async (id: number, payload: DireccionUpdatePayload): Promise<Direccion> => {
    const { data } = await client.put<Direccion>(`/direcciones/${id}`, payload)
    return data
  },

  setPrincipal: async (id: number): Promise<Direccion> => {
    const { data } = await client.patch<Direccion>(`/direcciones/${id}/principal`)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/direcciones/${id}`)
  },
}
