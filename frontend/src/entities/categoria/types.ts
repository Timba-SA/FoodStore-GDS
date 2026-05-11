/**
 * TypeScript interfaces for the Categorias domain.
 */

export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  slug: string
  imagen_url: string | null
  activa: boolean
  parent_id: number | null
  creado_en: string
  actualizado_en: string
}

export interface CategoriaTree {
  id: number
  nombre: string
  descripcion: string | null
  slug: string
  imagen_url: string | null
  activa: boolean
  parent_id: number | null
  children: CategoriaTree[]
}

export interface CategoriaCreatePayload {
  nombre: string
  descripcion?: string
  slug?: string
  imagen_url?: string
  activa?: boolean
  parent_id?: number | null
}

export interface CategoriaUpdatePayload {
  nombre?: string
  descripcion?: string
  slug?: string
  imagen_url?: string
  activa?: boolean
  parent_id?: number | null
}
