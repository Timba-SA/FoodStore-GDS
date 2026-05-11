/**
 * CategoriaForm — Modal form for creating and editing categories.
 * Filters invalid parent options (can't select self or descendants).
 */

import { useEffect, useMemo, useState } from 'react'
import type { Categoria, CategoriaCreatePayload } from '@/entities/categoria/types'

interface Props {
  /** Existing category to edit. Undefined = create mode. */
  categoria?: Categoria
  /** All flat categories to populate the parent selector. */
  allCategorias: Categoria[]
  onSubmit: (payload: CategoriaCreatePayload) => void
  onCancel: () => void
  isLoading?: boolean
}

/** Collect all descendant IDs of `id` from a flat list. Used to filter parent options. */
function getDescendantIds(id: number, all: Categoria[]): Set<number> {
  const ids = new Set<number>()
  const queue = [id]
  while (queue.length) {
    const current = queue.shift()!
    all.forEach((c) => {
      if (c.parent_id === current && !ids.has(c.id)) {
        ids.add(c.id)
        queue.push(c.id)
      }
    })
  }
  return ids
}

export default function CategoriaForm({
  categoria,
  allCategorias,
  onSubmit,
  onCancel,
  isLoading,
}: Props) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '')
  const [parentId, setParentId] = useState<number | null>(categoria?.parent_id ?? null)
  const [activa, setActiva] = useState(categoria?.activa ?? true)
  const [error, setError] = useState('')

  // When editing, filter out self and descendants from parent options
  const validParents = useMemo(() => {
    if (!categoria) return allCategorias
    const excluded = getDescendantIds(categoria.id, allCategorias)
    excluded.add(categoria.id) // can't be own parent
    return allCategorias.filter((c) => !excluded.has(c.id))
  }, [categoria, allCategorias])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setError('')
    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      parent_id: parentId,
      activa,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {categoria ? 'Editar categoría' : 'Nueva categoría'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="categoria-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Bebidas"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              id="categoria-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Opcional"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Categoría padre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría padre
            </label>
            <select
              id="categoria-parent"
              value={parentId ?? ''}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">— Sin padre (categoría raíz) —</option>
              {validParents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Activa */}
          <div className="flex items-center gap-3">
            <input
              id="categoria-activa"
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="categoria-activa" className="text-sm font-medium text-gray-700">
              Activa
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              id="categoria-submit"
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Guardando…' : categoria ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
