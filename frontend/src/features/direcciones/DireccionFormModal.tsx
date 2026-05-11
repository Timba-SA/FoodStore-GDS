/**
 * DireccionFormModal — Modal to create or edit a delivery address.
 */

import { useState } from 'react'
import type { Direccion, DireccionCreatePayload } from '@/entities/direccion/types'

interface Props {
  direccion?: Direccion
  onSubmit: (payload: DireccionCreatePayload) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function DireccionFormModal({ direccion, onSubmit, onCancel, isLoading }: Props) {
  const [calle, setCalle] = useState(direccion?.calle ?? '')
  const [numero, setNumero] = useState(direccion?.numero ?? '')
  const [departamento, setDepartamento] = useState(direccion?.departamento ?? '')
  const [ciudad, setCiudad] = useState(direccion?.ciudad ?? '')
  const [provincia, setProvincia] = useState(direccion?.provincia ?? '')
  const [codigoPostal, setCodigoPostal] = useState(direccion?.codigo_postal ?? '')
  const [pais, setPais] = useState(direccion?.pais ?? 'Argentina')
  const [esPredeterminada, setEsPredeterminada] = useState(direccion?.es_predeterminada ?? false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!calle.trim() || !numero.trim() || !ciudad.trim() || !provincia.trim() || !codigoPostal.trim()) {
      setError('Calle, número, ciudad, provincia y código postal son obligatorios')
      return
    }
    setError('')
    onSubmit({
      calle: calle.trim(),
      numero: numero.trim(),
      departamento: departamento.trim() || undefined,
      ciudad: ciudad.trim(),
      provincia: provincia.trim(),
      codigo_postal: codigoPostal.trim(),
      pais: pais.trim() || 'Argentina',
      es_predeterminada: esPredeterminada,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {direccion ? 'Editar dirección' : 'Nueva dirección'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Calle */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calle <span className="text-red-500">*</span>
              </label>
              <input
                id="dir-calle"
                type="text"
                value={calle}
                onChange={(e) => setCalle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                id="dir-numero"
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento / Piso</label>
            <input
              id="dir-departamento"
              type="text"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              placeholder="Ej: 3ro B (opcional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                id="dir-ciudad"
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia <span className="text-red-500">*</span>
              </label>
              <input
                id="dir-provincia"
                type="text"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Código Postal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal <span className="text-red-500">*</span>
              </label>
              <input
                id="dir-cp"
                type="text"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <input
                id="dir-pais"
                type="text"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Predeterminada */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              id="dir-predeterminada"
              type="checkbox"
              checked={esPredeterminada}
              onChange={(e) => setEsPredeterminada(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Establecer como dirección predeterminada
          </label>

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
              id="dir-submit"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Guardando…' : direccion ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
