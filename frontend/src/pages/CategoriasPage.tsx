/**
 * CategoriasPage — Administration view for hierarchical categories.
 *
 * Features:
 * - Flat table showing all categories with hierarchy indicator (↳ Parent)
 * - Create / Edit modal (CategoriaForm)
 * - Soft delete with confirmation
 * - Toggle inactive categories visibility
 * - Protected: requires 'admin' or 'stock' role
 */

import { useState } from 'react'
import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from '@/entities/categoria/hooks'
import type { Categoria, CategoriaCreatePayload, CategoriaUpdatePayload } from '@/entities/categoria/types'
import CategoriaForm from '@/features/categorias/CategoriaForm'

// Indent indicator for hierarchical display in the table
function HierarchyBadge({ parentId, all }: { parentId: number | null; all: Categoria[] }) {
  if (!parentId) return <span className="text-gray-400 text-xs">—</span>
  const parent = all.find((c) => c.id === parentId)
  return (
    <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
      ↳ {parent?.nombre ?? `#${parentId}`}
    </span>
  )
}

export default function CategoriasPage() {
  const [showInactive, setShowInactive] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [apiError, setApiError] = useState('')

  const { data: categorias = [], isLoading, isError } = useCategorias(showInactive)
  const createMutation = useCreateCategoria()
  const updateMutation = useUpdateCategoria()
  const deleteMutation = useDeleteCategoria()

  function openCreate() {
    setEditing(undefined)
    setApiError('')
    setFormOpen(true)
  }

  function openEdit(cat: Categoria) {
    setEditing(cat)
    setApiError('')
    setFormOpen(true)
  }

  async function handleFormSubmit(payload: CategoriaCreatePayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: payload as CategoriaUpdatePayload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setFormOpen(false)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail?.message ??
        'Error al guardar la categoría'
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
        'No se pudo eliminar la categoría'
      setApiError(msg)
      setDeletingId(null)
    }
  }

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión jerárquica del catálogo</p>
        </div>
        <button
          id="btn-nueva-categoria"
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          <span className="text-lg leading-none">＋</span>
          Nueva categoría
        </button>
      </header>

      <main className="px-8 py-6 max-w-6xl mx-auto">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-5">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              id="toggle-inactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Mostrar inactivas
          </label>
          <span className="text-xs text-gray-400">
            {categorias.length} categoría{categorias.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Global API error banner */}
        {apiError && (
          <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <span>{apiError}</span>
            <button onClick={() => setApiError('')} className="text-red-400 hover:text-red-600 ml-4 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Loading / Error states */}
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-600">
            Error al cargar las categorías. Verificá tu conexión.
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {categorias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🗂️</div>
                <p className="text-lg font-medium">No hay categorías todavía</p>
                <p className="text-sm mt-1">Creá la primera con el botón de arriba</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Padre</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categorias.map((cat) => (
                    <tr
                      key={cat.id}
                      className={`hover:bg-indigo-50/30 transition ${!cat.activa ? 'opacity-50' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {cat.nombre}
                        {cat.descripcion && (
                          <p className="text-xs text-gray-400 font-normal mt-0.5 truncate max-w-xs">
                            {cat.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <HierarchyBadge parentId={cat.parent_id} all={categorias} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cat.activa
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {cat.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`btn-edit-${cat.id}`}
                            onClick={() => openEdit(cat)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
                          >
                            Editar
                          </button>
                          <button
                            id={`btn-delete-${cat.id}`}
                            onClick={() => setDeletingId(cat.id)}
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

      {/* Create / Edit Modal */}
      {formOpen && (
        <CategoriaForm
          categoria={editing}
          allCategorias={categorias}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
          isLoading={isMutating}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar categoría?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción realiza un borrado lógico. No se puede hacer si tiene sub-categorías o
              productos activos.
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
