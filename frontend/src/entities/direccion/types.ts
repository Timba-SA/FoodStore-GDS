/**
 * TypeScript interfaces for the Direccion entity.
 */

export interface Direccion {
  id: number
  usuario_id: number
  calle: string
  numero: string
  departamento: string | null
  ciudad: string
  provincia: string
  codigo_postal: string
  pais: string
  es_predeterminada: boolean
}

export interface DireccionCreatePayload {
  calle: string
  numero: string
  departamento?: string
  ciudad: string
  provincia: string
  codigo_postal: string
  pais?: string
  es_predeterminada?: boolean
}

export interface DireccionUpdatePayload {
  calle?: string
  numero?: string
  departamento?: string
  ciudad?: string
  provincia?: string
  codigo_postal?: string
  pais?: string
  es_predeterminada?: boolean
}
