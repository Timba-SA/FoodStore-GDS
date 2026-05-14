/**
 * ProductoFormModal — Modal for creating and editing products.
 * Includes multi-select for categories and ingredients.
 */

import { useState } from 'react'
import type { Producto, ProductoCreatePayload } from '@/entities/producto/types'
import { useIngredientes } from '@/entities/ingrediente/hooks'
import { useIngredientes as useIngredientesHook } from '@/entities/ingrediente/hooks'
import { useQuery } from '@tanstack/react-query'
import client from '@/shared/api/client'

interface Props {
  producto?: Producto
  onSubmit: (payload: ProductoCreatePayload) => void
  onCancel: () => void
  isLoading?: boolean
}

function useCategoriasAll() {
  return useQuery({
    queryKey: ['categorias', 'all'],
    queryFn: async () => {
      const { data } = await client.get('/categorias')
      return data as Array<{ id: number; nombre: string; activa: boolean; deleted_at: string | null }>
    },
  })
}

export default function ProductoFormModal({ producto, onSubmit, onCancel, isLoading }: Props) {
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '')
  const [precio, setPrecio] = useState(producto ? parseFloat(producto.precio).toString() : '')
  const [stock, setStock] = useState(producto?.stock?.toString() ?? '0')
  const [sku, setSku] = useState(producto?.sku ?? '')
  const [imagenUrl, setImagenUrl] = useState(producto?.imagen_url ?? '')
  const [activo, setActivo] = useState(producto?.activo ?? true)
  const [esAlergeno, setEsAlergeno] = useState(producto?.es_alergeno ?? false)
  const [categoriaIds, setCategoriaIds] = useState<number[]>(
    producto?.categorias.map((c) => c.id) ?? []
  )
  const [ingredienteIds, setIngredienteIds] = useState<number[]>(
    producto?.ingredientes.map((i) => i.id) ?? []
  )
  const [error, setError] = useState('')

  const { data: categorias = [] } = useCategoriasAll()
  const { data: ingredientes = [] } = useIngredientesHook()

  function toggleId(ids: number[], id: number): number[] {
    return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !sku.trim() || !precio) {
      setError('Nombre, SKU y precio son obligatorios')
      return
    }
    const precioNum = parseFloat(precio)
    if (isNaN(precioNum) || precioNum < 0) {
      setError('El precio debe ser un número >= 0')
      return
    }
    setError('')
    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      precio: precioNum,
      stock: parseInt(stock, 10) || 0,
      sku: sku.trim().toUpperCase(),
      imagen_url: imagenUrl.trim() || undefined,
      activo,
      es_alergeno: esAlergeno,
      categoria_ids: categoriaIds,
      ingrediente_ids: ingredienteIds,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-900/5 w-full max-w-2xl my-auto p-8 border border-white/20">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight">
          {producto ? 'Editar producto' : 'Nuevo producto'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="producto-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                id="producto-sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PROD-001"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono tracking-wider bg-slate-50/50 hover:bg-white"
              />
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (AR$) <span className="text-red-500">*</span>
              </label>
              <input
                id="producto-precio"
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                id="producto-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>

            {/* Imagen URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
              <input
                id="producto-imagen-url"
                type="url"
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              id="producto-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none bg-slate-50/50 hover:bg-white"
            />
          </div>

          {/* Activo */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              id="producto-activo"
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Disponible para la venta
          </label>

          {/* Es Alérgeno */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <input
              id="producto-es-alergeno"
              type="checkbox"
              checked={esAlergeno}
              onChange={(e) => setEsAlergeno(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
            />
            <div className="text-sm">
              <label htmlFor="producto-es-alergeno" className="font-medium text-orange-900 cursor-pointer block">
                ⚠️ Marcar manualmente como alérgeno
              </label>
              <p className="text-orange-700 mt-1">
                Si un ingrediente es alérgeno, el producto completo ya se considera alérgeno de forma automática.
              </p>
            </div>
          </div>

          {/* Categorías */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
              {categorias.filter(c => !c.deleted_at && c.activa).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaIds((ids) => toggleId(ids, cat.id))}
                  className={`text-xs px-3 py-1 rounded-full border transition ${
                    categoriaIds.includes(cat.id)
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
              {ingredientes.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => setIngredienteIds((ids) => toggleId(ids, ing.id))}
                  className={`text-xs px-3 py-1 rounded-full border transition ${
                    ingredienteIds.includes(ing.id)
                      ? ing.es_alergeno
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {ing.es_alergeno ? '⚠️ ' : ''}{ing.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel}
              className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" id="producto-submit" disabled={isLoading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95">
              {isLoading ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
