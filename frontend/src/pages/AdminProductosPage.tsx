/**
 * AdminProductosPage — Staff view for product management.
 * Supports create, edit, delete and stock adjustment.
 */

import { useState } from 'react'
import {
  useProductos,
  useCreateProducto,
  useUpdateProducto,
  useDeleteProducto,
  useUpdateStock,
} from '@/entities/producto/hooks'
import type { Producto, ProductoCreatePayload, ProductoUpdatePayload } from '@/entities/producto/types'
import ProductoFormModal from '@/features/productos/ProductoFormModal'

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-red-100 text-red-700">Sin stock</span>
  if (stock <= 5)
    return <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-yellow-100 text-yellow-700">{stock} (bajo)</span>
  return <span className="inline-flex px-2 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-700">{stock}</span>
}

export default function AdminProductosPage() {
  const [search, setSearch] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Producto | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [stockModal, setStockModal] = useState<Producto | null>(null)
  const [stockDelta, setStockDelta] = useState('')
  const [stockOp, setStockOp] = useState<'add' | 'subtract' | 'set'>('set')
  const [apiError, setApiError] = useState('')

  // For admin we pass search and include_inactive
  const { data: productos = [], isLoading, isError } = useProductos({
    search: search || undefined,
    include_inactive: includeInactive || undefined,
  })

  const createMutation = useCreateProducto()
  const updateMutation = useUpdateProducto()
  const deleteMutation = useDeleteProducto()
  const stockMutation = useUpdateStock()
  const isMutating = createMutation.isPending || updateMutation.isPending

  function openCreate() { setEditing(undefined); setApiError(''); setFormOpen(true) }
  function openEdit(p: Producto) { setEditing(p); setApiError(''); setFormOpen(true) }

  async function handleFormSubmit(payload: ProductoCreatePayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: payload as ProductoUpdatePayload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setFormOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail?.message ?? 'Error al guardar'
      setApiError(msg)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id)
      setDeletingId(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail?.message ?? 'Error al eliminar'
      setApiError(msg)
      setDeletingId(null)
    }
  }

  async function handleStockUpdate() {
    if (!stockModal) return
    try {
      await stockMutation.mutateAsync({
        id: stockModal.id,
        payload: { cantidad: parseInt(stockDelta, 10) || 0, operacion: stockOp },
      })
      setStockModal(null)
      setStockDelta('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: { message?: string } } } })?.response?.data?.detail?.message ?? 'Error al actualizar stock'
      setApiError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión del catálogo de productos</p>
        </div>
        <button id="btn-nuevo-producto" onClick={openCreate}
          className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm">
          <span className="text-lg leading-none">＋</span> Nuevo producto
        </button>
      </header>

      <main className="px-8 py-6 max-w-7xl mx-auto">
        {/* Search */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative max-w-xs flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input id="admin-productos-search" type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500" />
            Mostrar inactivos (eliminados)
          </label>
          <span className="text-xs text-gray-400 ml-auto">{productos.length} producto{productos.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Error banner */}
        {apiError && (
          <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <span>{apiError}</span>
            <button onClick={() => setApiError('')} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
          </div>
        )}

        {isLoading && <div className="flex justify-center h-48 items-center"><div className="h-8 w-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" /></div>}
        {isError && <div className="text-center py-12 text-red-600">Error al cargar los productos.</div>}

        {!isLoading && !isError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {productos.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <div className="text-5xl mb-4">📦</div>
                <p className="text-lg font-medium">Sin productos</p>
                <p className="text-sm mt-1">Creá el primero con el botón de arriba</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productos.map((p) => (
                    <tr key={p.id} className="hover:bg-orange-50/30 transition">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{p.nombre}</div>
                        {p.imagen_url && (
                          <a 
                            href={p.imagen_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-blue-500 hover:underline truncate max-w-[200px] block mt-1"
                            title={p.imagen_url}
                          >
                            🔗 {p.imagen_url}
                          </a>
                        )}
                        {p.categorias.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {p.categorias.slice(0, 2).map(c => (
                              <span key={c.id} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{c.nombre}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-orange-600">
                        ${parseFloat(p.precio).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StockBadge stock={p.stock} />
                          <button id={`btn-stock-${p.id}`} onClick={() => { setStockModal(p); setStockDelta(''); setStockOp('set') }}
                            className="text-[10px] text-blue-500 hover:text-blue-700 font-medium underline">
                            Ajustar
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button id={`btn-edit-${p.id}`} onClick={() => openEdit(p)}
                            className="text-orange-600 hover:text-orange-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition">
                            Editar
                          </button>
                          {p.activo ? (
                            <button id={`btn-delete-${p.id}`} onClick={() => setDeletingId(p.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                              Eliminar
                            </button>
                          ) : (
                            <button id={`btn-restore-${p.id}`} onClick={() => updateMutation.mutate({ id: p.id, payload: { activo: true } })}
                              className="text-green-600 hover:text-green-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
                              disabled={updateMutation.isPending}>
                              Activar
                            </button>
                          )}
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

      {/* Create/Edit modal */}
      {formOpen && (
        <ProductoFormModal
          producto={editing}
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar producto?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción es un borrado lógico y puede revertirse.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeletingId(null)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancelar
              </button>
              <button id="btn-confirm-delete" onClick={() => handleDelete(deletingId)} disabled={deleteMutation.isPending}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                {deleteMutation.isPending ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock modal */}
      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ajustar stock</h3>
            <p className="text-sm text-gray-500 mb-5">{stockModal.nombre} — stock actual: <strong>{stockModal.stock}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operación</label>
                <select value={stockOp} onChange={(e) => setStockOp(e.target.value as 'add' | 'subtract' | 'set')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="set">Establecer</option>
                  <option value="add">Sumar</option>
                  <option value="subtract">Restar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input id="stock-cantidad" type="number" min="0" value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setStockModal(null)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancelar
              </button>
              <button id="btn-confirm-stock" onClick={handleStockUpdate} disabled={stockMutation.isPending}
                className="px-5 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition">
                {stockMutation.isPending ? 'Guardando…' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 
