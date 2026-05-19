/**
 * TypeScript interfaces for the Producto domain.
 */

export interface CategoriaInline {
  id: number
  nombre: string
  slug: string
  imagen_url: string | null
}

export interface IngredienteInline {
  id: number
  nombre: string
  es_alergeno: boolean
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio: string  // Decimal comes as string from JSON
  stock: number
  sku: string
  imagen_url: string | null
  activo: boolean
  es_alergeno: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  categorias: CategoriaInline[]
  ingredientes: IngredienteInline[]
}

export interface ProductoCreatePayload {
  nombre: string
  descripcion?: string
  precio: number
  stock?: number
  sku: string
  imagen_url?: string
  activo?: boolean
  es_alergeno?: boolean
  categoria_ids?: number[]
  ingrediente_ids?: number[]
}

export interface ProductoUpdatePayload {
  nombre?: string
  descripcion?: string
  precio?: number
  stock?: number
  sku?: string
  imagen_url?: string
  activo?: boolean
  es_alergeno?: boolean
  categoria_ids?: number[]
  ingrediente_ids?: number[]
}

export interface ProductoStockUpdate {
  cantidad: number
  operacion: 'add' | 'subtract' | 'set'
}

export interface ProductosFilters {
  search?: string
  categoria_id?: number
  min_price?: number
  max_price?: number
  sin_alergenos?: boolean
  include_inactive?: boolean
  skip?: number
  limit?: number
}
