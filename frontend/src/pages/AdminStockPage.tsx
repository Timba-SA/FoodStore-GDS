/**
 * AdminStockPage — Fast stock editing for all products.
 * Route: /admin/stock
 */

import { useState } from 'react'
import { useProductos } from '@/entities/producto/hooks'
import client from '@/shared/api/client'
import { useQueryClient } from '@tanstack/react-query'

export default function AdminStockPage() {
  const { data: productos = [], isLoading } = useProductos()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()),
  )

  function handleStockChange(id: number, value: string) {
    setEditing((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSave(id: number) {
    const value = parseInt(editing[id] ?? '', 10)
    if (isNaN(value) || value < 0) return
    setSaving(id)
    try {
      await client.patch(`/productos/${id}/stock`, { cantidad: value, operacion: 'set' })
      await qc.invalidateQueries({ queryKey: ['productos'] })
      setEditing((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
    } catch {
      alert('Error al guardar el stock')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold">Control de Stock</h1>
          <p className="text-orange-100 mt-1">Actualizá el stock de los productos rápidamente</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <input
          id="search-stock"
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => {
                  const currentStock = p.stock ?? 0
                  const editingValue = editing[p.id]
                  const isDirty = editingValue !== undefined && editingValue !== String(currentStock)
                  const isLow = currentStock < 5
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900">{p.nombre}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        ${parseFloat(p.precio).toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            id={`stock-${p.id}`}
                            type="number"
                            min={0}
                            className={`w-20 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                              isLow ? 'border-red-300 text-red-600' : 'border-gray-200'
                            }`}
                            value={editingValue ?? currentStock}
                            onChange={(e) => handleStockChange(p.id, e.target.value)}
                          />
                          {isLow && !isDirty && (
                            <span className="text-xs text-red-500 font-semibold">⚠️ Bajo</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isDirty && (
                          <button
                            id={`btn-save-stock-${p.id}`}
                            onClick={() => handleSave(p.id)}
                            disabled={saving === p.id}
                            className="text-xs bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
                          >
                            {saving === p.id ? '...' : 'Guardar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">No se encontraron productos.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
