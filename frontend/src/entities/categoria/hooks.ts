/**
 * TanStack Query hooks for the Categorias entity.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriasApi } from './api'
import type { CategoriaCreatePayload, CategoriaUpdatePayload } from './types'

export const CATEGORIAS_KEYS = {
  all: ['categorias'] as const,
  list: (includeInactive = false) => ['categorias', 'list', { includeInactive }] as const,
  tree: (includeInactive = false) => ['categorias', 'tree', { includeInactive }] as const,
  detail: (id: number) => ['categorias', id] as const,
}

export function useCategorias(includeInactive = false) {
  return useQuery({
    queryKey: CATEGORIAS_KEYS.list(includeInactive),
    queryFn: () => categoriasApi.getAll(includeInactive),
  })
}

export function useCategoriasTree(includeInactive = false) {
  return useQuery({
    queryKey: CATEGORIAS_KEYS.tree(includeInactive),
    queryFn: () => categoriasApi.getTree(includeInactive),
  })
}

export function useCategoria(id: number) {
  return useQuery({
    queryKey: CATEGORIAS_KEYS.detail(id),
    queryFn: () => categoriasApi.getById(id),
    enabled: id > 0,
  })
}

export function useCreateCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoriaCreatePayload) => categoriasApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIAS_KEYS.all })
    },
  })
}

export function useUpdateCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoriaUpdatePayload }) =>
      categoriasApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIAS_KEYS.all })
    },
  })
}

export function useDeleteCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoriasApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORIAS_KEYS.all })
    },
  })
}
