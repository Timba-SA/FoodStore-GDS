/**
 * User Registration Form Component
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser, RegisterRequest } from '../../shared/api/auth'

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState<RegisterRequest>({
    nombre: '',
    email: '',
    password: '',
    numero_telefono: '',
  })

  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Form field handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    setError(null)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    if (fieldErrors.confirmPassword) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.confirmPassword
        return newErrors
      })
    }
  }

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (formData.numero_telefono && formData.numero_telefono.length > 20) {
      newErrors.numero_telefono = 'El teléfono es demasiado largo'
    }

    setFieldErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  // registerUser() calls setAuth() internally — no need to touch the store here
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await registerUser({
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        password: formData.password,
        numero_telefono: formData.numero_telefono || undefined,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al registrar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              inicia sesión si ya tienes cuenta
            </a>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          )}

          {/* Nombre field */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                fieldErrors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Tu nombre completo"
              value={formData.nombre}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {fieldErrors.nombre && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.nombre}</p>
            )}
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                fieldErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm password field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isLoading}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Telefono field (optional) */}
          <div>
            <label htmlFor="numero_telefono" className="block text-sm font-medium text-gray-700">
              Teléfono (opcional)
            </label>
            <input
              id="numero_telefono"
              name="numero_telefono"
              type="tel"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                fieldErrors.numero_telefono ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+54 1234 567890"
              value={formData.numero_telefono}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {fieldErrors.numero_telefono && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.numero_telefono}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegisterForm
