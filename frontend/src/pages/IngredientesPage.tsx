/**
 * IngredientesPage — Admin view for the ingredients catalogue.
 *
 * Features:
 *  - Table with allergen badge (⚠️ red/orange)
 *  - Filters: text search, toggle solo alérgenos, toggle inactivos
 *  - Create / Edit modal (IngredienteForm)
 *  - Soft delete with confirmation dialog
 */

import { useState } from 'react'
import {
  useIngredientes,
  useCreateIngrediente,
  useUpdateIngrediente,
  useDeleteIngrediente,
} from '@/entities/ingrediente/hooks'
import type {
  Ingrediente,
  IngredienteCreatePayload,
  IngredienteUpdatePayload,
} from '@/entities/ingrediente/types'
import IngredienteForm from '@/features/ingredientes/IngredienteForm'

function AlergenoBadge({ esAlergeno }: { esAlergeno: boolean }) {
  if (!esAlergeno) return <span className="text-gray-300 text-xs">—</span>
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-800 bg-orange-100 border border-orange-200 px-2.5 py-0.5 rounded-full">
      ⚠️ Alérgeno
    </span>
  )
}

export default function IngredientesPage() {
  const [search, setSearch] = useState('')
  const [soloAlergenos, setSoloAlergenos] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingrediente | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [apiError, setApiError] = useState('')

  // Debounce search slightly — pass raw string (fast enough for typical catalogues)
  const { data: ingredientes = [], isLoading, isError } = useIngredientes({
    search: search || undefined,
    solo_alergenos: soloAlergenos || undefined,
    include_inactive: showInactive || undefined,
  })

  const createMutation = useCreateIngrediente()
  const updateMutation = useUpdateIngrediente()
  const deleteMutation = useDeleteIngrediente()

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  function openCreate() {
    setEditing(undefined)
    setApiError('')
    setFormOpen(true)
  }

  function openEdit(ing: Ingrediente) {
    setEditing(ing)
    setApiError('')
    setFormOpen(true)
  }

  async function handleFormSubmit(payload: IngredienteCreatePayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: payload as IngredienteUpdatePayload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setFormOpen(false)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail?.message ??
        'Error al guardar el ingrediente'
      setApiError(msg)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id)
      setDeletingId(null)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail?.message ??
        'No se pudo eliminar el ingrediente'
      setApiError(msg)
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingredientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión del catálogo de ingredientes y alérgenos</p>
        </div>
        <button
          id="btn-nuevo-ingrediente"
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
        >
          <span className="text-lg leading-none">＋</span>
          Nuevo ingrediente
        </button>
      </header>

      <main className="px-8 py-6 max-w-6xl mx-auto">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              id="ingrediente-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Toggles */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              id="toggle-solo-alergenos"
              checked={soloAlergenos}
              onChange={(e) => setSoloAlergenos(e.target.checked)}
              className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            />
            Solo alérgenos
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              id="toggle-inactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-400"
            />
            Mostrar inactivos
          </label>

          <span className="text-xs text-gray-400 ml-auto">
            {ingredientes.length} ingrediente{ingredientes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* API error banner */}
        {apiError && (
          <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <span>{apiError}</span>
            <button onClick={() => setApiError('')} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-600">
            Error al cargar los ingredientes. Verificá tu conexión.
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {ingredientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🧪</div>
                <p className="text-lg font-medium">No hay ingredientes todavía</p>
                <p className="text-sm mt-1">
                  {search || soloAlergenos
                    ? 'Probá ajustando los filtros'
                    : 'Creá el primero con el botón de arriba'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Descripción</th>
                    <th className="px-6 py-4">Alérgeno</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ingredientes.map((ing) => (
                    <tr
                      key={ing.id}
                      className={`hover:bg-orange-50/30 transition ${ing.deleted_at ? 'opacity-50' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{ing.nombre}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {ing.descripcion ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <AlergenoBadge esAlergeno={ing.es_alergeno} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !ing.deleted_at
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {!ing.deleted_at ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`btn-edit-${ing.id}`}
                            onClick={() => openEdit(ing)}
                            className="text-orange-600 hover:text-orange-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
                          >
                            Editar
                          </button>
                          <button
                            id={`btn-delete-${ing.id}`}
                            onClick={() => setDeletingId(ing.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {formOpen && (
        <IngredienteForm
          ingrediente={editing}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
          isLoading={isMutating}
        />
      )}

      {/* Delete confirmation */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar ingrediente?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Borrado lógico. No se puede hacer si está asociado a productos activos.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete"
                onClick={() => handleDelete(deletingId)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleteMutation.isPending ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
