/**
 * TanStack Query hooks for the Direccion entity.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { direccionesApi } from './api'
import type { DireccionCreatePayload, DireccionUpdatePayload } from './types'

export const DIRECCIONES_KEYS = {
  all: ['direcciones'] as const,
}

export function useDirecciones() {
  return useQuery({
    queryKey: DIRECCIONES_KEYS.all,
    queryFn: () => direccionesApi.getAll(),
  })
}

export function useCreateDireccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DireccionCreatePayload) => direccionesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIRECCIONES_KEYS.all }),
  })
}

export function useUpdateDireccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DireccionUpdatePayload }) =>
      direccionesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIRECCIONES_KEYS.all }),
  })
}

export function useSetDireccionPrincipal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => direccionesApi.setPrincipal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIRECCIONES_KEYS.all }),
  })
}

export function useDeleteDireccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => direccionesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DIRECCIONES_KEYS.all }),
  })
}
