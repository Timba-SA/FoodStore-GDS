/**
 * AdminUsuariosPage — User management for admins.
 * Route: /admin/usuarios
 */

import { useState } from 'react'
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUpdateRoles,
} from '@/entities/admin/hooks'
import type { UsuarioListItem, UsuarioCreate } from '@/entities/admin/types'

// Simple role constants — ideally fetched from API
const AVAILABLE_ROLES = [
  { id: 1, nombre: 'admin' },
  { id: 2, nombre: 'customer' },
  { id: 3, nombre: 'stock' },
]

const ROLE_BADGE: Record<string, string> = {
  admin:    'bg-red-100 text-red-700',
  customer: 'bg-blue-100 text-blue-700',
  stock:    'bg-green-100 text-green-700',
}

function UserModal({
  user,
  onClose,
}: {
  user?: UsuarioListItem | null
  onClose: () => void
}) {
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const [form, setForm] = useState<Partial<UsuarioCreate>>({
    nombre: user?.nombre ?? '',
    email: user?.email ?? '',
    password: '',
    numero_telefono: user?.numero_telefono ?? '',
    roles_ids: [],
  })
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          data: {
            nombre: form.nombre,
            numero_telefono: form.numero_telefono,
          },
        })
      } else {
        await createUser.mutateAsync(form as UsuarioCreate)
      }
      onClose()
    } catch (e: unknown) {
      const detail =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setError(typeof detail === 'string' ? detail : 'Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          {user ? 'Editar usuario' : 'Nuevo usuario'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            id="user-nombre"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Nombre completo"
            value={form.nombre ?? ''}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          {!user && (
            <>
              <input
                id="user-email"
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Email"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                id="user-password"
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Contraseña (mín. 8 caracteres)"
                value={form.password ?? ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </>
          )}
          <input
            id="user-telefono"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Teléfono (opcional)"
            value={form.numero_telefono ?? ''}
            onChange={(e) => setForm({ ...form, numero_telefono: e.target.value })}
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              id="btn-save-user"
              type="submit"
              disabled={createUser.isPending || updateUser.isPending}
              className="flex-1 bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              {createUser.isPending || updateUser.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsuariosPage() {
  const { data: users = [], isLoading } = useAdminUsers()
  const deleteUser = useDeleteUser()
  const updateRoles = useUpdateRoles()

  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<UsuarioListItem | null>(null)
  const [search, setSearch] = useState('')

  const filtered = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    await deleteUser.mutateAsync(id)
  }

  async function handleRoleToggle(user: UsuarioListItem, roleName: string) {
    const role = AVAILABLE_ROLES.find((r) => r.nombre === roleName)
    if (!role) return
    const hasRole = user.roles.includes(roleName)
    const newRoleIds = hasRole
      ? AVAILABLE_ROLES.filter((r) => user.roles.includes(r.nombre) && r.nombre !== roleName).map(
          (r) => r.id,
        )
      : [
          ...AVAILABLE_ROLES.filter((r) => user.roles.includes(r.nombre)).map((r) => r.id),
          role.id,
        ]
    await updateRoles.mutateAsync({ id: user.id, roles_ids: newRoleIds })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-10">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold">Usuarios</h1>
            <p className="text-orange-100 mt-1">Gestión de usuarios del sistema</p>
          </div>
          <button
            id="btn-new-user"
            onClick={() => { setEditUser(null); setShowModal(true) }}
            className="bg-white/20 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/30 transition text-sm"
          >
            + Nuevo usuario
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <input
          id="search-users"
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Roles</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{u.nombre}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {AVAILABLE_ROLES.map((role) => {
                          const has = u.roles.includes(role.nombre)
                          return (
                            <button
                              key={role.id}
                              id={`role-${u.id}-${role.nombre}`}
                              onClick={() => handleRoleToggle(u, role.nombre)}
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full transition ${
                                has
                                  ? ROLE_BADGE[role.nombre] ?? 'bg-gray-100 text-gray-700'
                                  : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'
                              }`}
                            >
                              {role.nombre}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          id={`btn-edit-${u.id}`}
                          onClick={() => { setEditUser(u); setShowModal(true) }}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          id={`btn-delete-${u.id}`}
                          onClick={() => handleDelete(u.id)}
                          className="text-xs text-red-500 hover:underline font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">No se encontraron usuarios.</p>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null) }}
        />
      )}
    </div>
  )
}
