/**
 * PerfilPage — User's own profile editing.
 * Route: /perfil
 */

import { useState } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import client from '@/shared/api/client'

export default function PerfilPage() {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  const [nombre, setNombre] = useState(user?.nombre ?? '')
  const [telefono, setTelefono] = useState(user?.numero_telefono ?? '')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Password change
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg, setPassMsg] = useState<string | null>(null)
  const [passErr, setPassErr] = useState<string | null>(null)

  async function handleUpdatePerfil(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      const res = await client.put('/perfil', { nombre, numero_telefono: telefono })
      const updated = res.data
      // Update the auth store with fresh user data
      if (user && accessToken && refreshToken) {
        setAuth(accessToken, refreshToken, {
          ...user,
          nombre: updated.nombre,
          numero_telefono: updated.numero_telefono,
        })
      }
      setSuccessMsg('Perfil actualizado correctamente.')
    } catch {
      setErrorMsg('Error al actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPassLoading(true)
    setPassMsg(null)
    setPassErr(null)
    try {
      await client.post('/perfil/cambiar-contrasena', {
        password_actual: passActual,
        password_nueva: passNueva,
      })
      setPassMsg('Contraseña actualizada correctamente.')
      setPassActual('')
      setPassNueva('')
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setPassErr(typeof detail === 'string' ? detail : 'Error al cambiar la contraseña.')
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold">Mi Perfil</h1>
          <p className="text-orange-100 mt-1">{user?.email}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile data */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Datos personales</h2>
          <form onSubmit={handleUpdatePerfil} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nombre
              </label>
              <input
                id="perfil-nombre"
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Teléfono
              </label>
              <input
                id="perfil-telefono"
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            {successMsg && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                ✅ {successMsg}
              </p>
            )}
            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                {errorMsg}
              </p>
            )}
            <button
              id="btn-save-perfil"
              type="submit"
              disabled={saving}
              className="w-full bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Password change */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Cambiar contraseña</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              id="pass-actual"
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Contraseña actual"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              required
            />
            <input
              id="pass-nueva"
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Contraseña nueva (mín. 8 caracteres)"
              value={passNueva}
              onChange={(e) => setPassNueva(e.target.value)}
              required
              minLength={8}
            />
            {passMsg && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                ✅ {passMsg}
              </p>
            )}
            {passErr && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                {passErr}
              </p>
            )}
            <button
              id="btn-change-pass"
              type="submit"
              disabled={passLoading}
              className="w-full bg-gray-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {passLoading ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
