/**
 * DireccionCard — Displays a single delivery address with actions.
 */

import type { Direccion } from '@/entities/direccion/types'

interface Props {
  direccion: Direccion
  onEdit: (d: Direccion) => void
  onDelete: (id: number) => void
  onSetPrincipal: (id: number) => void
  isSettingPrincipal?: boolean
  isDeleting?: boolean
}

export default function DireccionCard({
  direccion,
  onEdit,
  onDelete,
  onSetPrincipal,
  isSettingPrincipal,
  isDeleting,
}: Props) {
  return (
    <div
      className={`relative bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
        direccion.es_predeterminada
          ? 'border-orange-400 ring-2 ring-orange-200'
          : 'border-gray-100'
      }`}
    >
      {/* Default badge */}
      {direccion.es_predeterminada && (
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          ★ Predeterminada
        </span>
      )}

      {/* Address info */}
      <div className="pr-28">
        <p className="font-semibold text-gray-900 text-sm">
          {direccion.calle} {direccion.numero}
          {direccion.departamento && (
            <span className="text-gray-500 font-normal">, Dpto. {direccion.departamento}</span>
          )}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {direccion.ciudad}, {direccion.provincia} {direccion.codigo_postal}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{direccion.pais}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <button
          id={`btn-edit-dir-${direccion.id}`}
          onClick={() => onEdit(direccion)}
          className="text-xs font-medium text-orange-600 hover:text-orange-800 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
        >
          Editar
        </button>
        {!direccion.es_predeterminada && (
          <button
            id={`btn-set-default-${direccion.id}`}
            onClick={() => onSetPrincipal(direccion.id)}
            disabled={isSettingPrincipal}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition"
          >
            {isSettingPrincipal ? 'Actualizando…' : 'Fijar como predeterminada'}
          </button>
        )}
        <button
          id={`btn-delete-dir-${direccion.id}`}
          onClick={() => onDelete(direccion.id)}
          disabled={isDeleting}
          className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition ml-auto"
        >
          {isDeleting ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}
