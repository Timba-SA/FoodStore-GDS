/**
 * IngredienteForm — Modal for creating and editing ingredients.
 */

import { useState } from 'react'
import type { Ingrediente, IngredienteCreatePayload } from '@/entities/ingrediente/types'

interface Props {
  ingrediente?: Ingrediente
  onSubmit: (payload: IngredienteCreatePayload) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function IngredienteForm({ ingrediente, onSubmit, onCancel, isLoading }: Props) {
  const [nombre, setNombre] = useState(ingrediente?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(ingrediente?.descripcion ?? '')
  const [esAlergeno, setEsAlergeno] = useState(ingrediente?.es_alergeno ?? false)
  const [error, setError] = useState('')

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
      es_alergeno: esAlergeno,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {ingrediente ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="ingrediente-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Gluten, Maní, Lácteos"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              id="ingrediente-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Descripción opcional"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Es Alérgeno */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <input
              id="ingrediente-es-alergeno"
              type="checkbox"
              checked={esAlergeno}
              onChange={(e) => setEsAlergeno(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            />
            <div>
              <label htmlFor="ingrediente-es-alergeno" className="text-sm font-semibold text-orange-800 cursor-pointer">
                ⚠️ Es un alérgeno
              </label>
              <p className="text-xs text-orange-600 mt-0.5">
                Marcar si este ingrediente puede causar reacciones alérgicas.
              </p>
            </div>
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
              id="ingrediente-submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Guardando…' : ingrediente ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
