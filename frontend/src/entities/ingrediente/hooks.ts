/**
 * TanStack Query hooks for the Ingredientes entity.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ingredientesApi, type IngredientesFilters } from './api'
import type { IngredienteCreatePayload, IngredienteUpdatePayload } from './types'

export const INGREDIENTES_KEYS = {
  all: ['ingredientes'] as const,
  list: (filters: IngredientesFilters) => ['ingredientes', 'list', filters] as const,
  detail: (id: number) => ['ingredientes', id] as const,
}

export function useIngredientes(filters: IngredientesFilters = {}) {
  return useQuery({
    queryKey: INGREDIENTES_KEYS.list(filters),
    queryFn: () => ingredientesApi.getAll(filters),
  })
}

export function useIngrediente(id: number) {
  return useQuery({
    queryKey: INGREDIENTES_KEYS.detail(id),
    queryFn: () => ingredientesApi.getById(id),
    enabled: id > 0,
  })
}

export function useCreateIngrediente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: IngredienteCreatePayload) => ingredientesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: INGREDIENTES_KEYS.all }),
  })
}

export function useUpdateIngrediente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: IngredienteUpdatePayload }) =>
      ingredientesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: INGREDIENTES_KEYS.all }),
  })
}

export function useDeleteIngrediente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ingredientesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: INGREDIENTES_KEYS.all }),
  })
}
