/**
 * TypeScript interfaces for the Ingredientes domain.
 */

export interface Ingrediente {
  id: number
  nombre: string
  descripcion: string | null
  es_alergeno: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface IngredienteCreatePayload {
  nombre: string
  descripcion?: string
  es_alergeno?: boolean
}

export interface IngredienteUpdatePayload {
  nombre?: string
  descripcion?: string
  es_alergeno?: boolean
}
