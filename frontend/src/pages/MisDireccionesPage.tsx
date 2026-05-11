/**
 * MisDireccionesPage — User dashboard page to manage delivery addresses.
 */

import { useState } from 'react'
import {
  useDirecciones,
  useCreateDireccion,
  useUpdateDireccion,
  useDeleteDireccion,
  useSetDireccionPrincipal,
} from '@/entities/direccion/hooks'
import type { Direccion, DireccionCreatePayload, DireccionUpdatePayload } from '@/entities/direccion/types'
import DireccionCard from '@/features/direcciones/DireccionCard'
import DireccionFormModal from '@/features/direcciones/DireccionFormModal'

export default function MisDireccionesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Direccion | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [apiError, setApiError] = useState('')

  const { data: direcciones = [], isLoading, isError } = useDirecciones()
  const createMutation = useCreateDireccion()
  const updateMutation = useUpdateDireccion()
  const deleteMutation = useDeleteDireccion()
  const setPrincipalMutation = useSetDireccionPrincipal()

  const isMutating = createMutation.isPending || updateMutation.isPending

  function openCreate() {
    setEditing(undefined)
    setApiError('')
    setFormOpen(true)
  }

  function openEdit(d: Direccion) {
    setEditing(d)
    setApiError('')
    setFormOpen(true)
  }

  async function handleFormSubmit(payload: DireccionCreatePayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: payload as DireccionUpdatePayload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setFormOpen(false)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail
          ?.message ?? 'Error al guardar la dirección'
      setApiError(msg)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id)
      setDeletingId(null)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail
          ?.message ?? 'Error al eliminar la dirección'
      setApiError(msg)
      setDeletingId(null)
    }
  }

  async function handleSetPrincipal(id: number) {
    try {
      await setPrincipalMutation.mutateAsync(id)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail
          ?.message ?? 'Error al actualizar la dirección predeterminada'
      setApiError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Direcciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestioná tus direcciones de entrega</p>
        </div>
        <button
          id="btn-nueva-direccion"
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
        >
          <span className="text-lg leading-none">＋</span> Nueva dirección
        </button>
      </header>

      <main className="px-8 py-8 max-w-3xl mx-auto">
        {/* Error banner */}
        {apiError && (
          <div className="mb-5 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <span>{apiError}</span>
            <button
              onClick={() => setApiError('')}
              className="text-red-400 hover:text-red-600 ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-red-600">
            Error al cargar las direcciones. Intentá de nuevo.
          </div>
        )}

        {!isLoading && !isError && direcciones.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">📍</div>
            <p className="text-lg font-medium">No tenés direcciones guardadas</p>
            <p className="text-sm mt-1">Agregá tu primera dirección de entrega</p>
            <button
              onClick={openCreate}
              className="mt-5 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
            >
              Agregar dirección
            </button>
          </div>
        )}

        {!isLoading && !isError && direcciones.length > 0 && (
          <div className="space-y-4">
            {direcciones.map((d) => (
              <DireccionCard
                key={d.id}
                direccion={d}
                onEdit={openEdit}
                onDelete={(id) => setDeletingId(id)}
                onSetPrincipal={handleSetPrincipal}
                isSettingPrincipal={setPrincipalMutation.isPending}
                isDeleting={deleteMutation.isPending && deletingId === d.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit modal */}
      {formOpen && (
        <DireccionFormModal
          direccion={editing}
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar dirección?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-dir"
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
