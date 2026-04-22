/**
 * Unit tests for RegisterForm component
 * Tests: Form rendering, validation, error handling, API integration
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import RegisterForm from '../RegisterForm'
import * as authApi from '../../../shared/api/auth'
import { useAuthStore } from '../store/authStore'

// Mock dependencies
vi.mock('../../../shared/api/auth')
vi.mock('../store/authStore')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Wrap component with Router for tests
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('RegisterForm Component', () => {
  const mockSetUser = vi.fn()
  const mockSetTokens = vi.fn()
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({
      setUser: mockSetUser,
      setTokens: mockSetTokens,
    })
  })

  // =========================================================================
  // RENDERING TESTS
  // =========================================================================

  describe('Form Rendering', () => {
    it('should render the registration form with all fields', () => {
      renderWithRouter(<RegisterForm />)

      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    })

    it('should render submit button', () => {
      renderWithRouter(<RegisterForm />)

      expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument()
    })

    it('should render header with title', () => {
      renderWithRouter(<RegisterForm />)

      expect(screen.getByText('Crear cuenta')).toBeInTheDocument()
    })

    it('should render link to login page', () => {
      renderWithRouter(<RegisterForm />)

      expect(screen.getByRole('link', { name: /inicia sesión/i })).toBeInTheDocument()
    })

    it('should have correct input types', () => {
      renderWithRouter(<RegisterForm />)

      expect(screen.getByPlaceholderText('Tu nombre completo')).toHaveAttribute('type', 'text')
      expect(screen.getByPlaceholderText('tu@email.com')).toHaveAttribute('type', 'email')
      expect(screen.getByPlaceholderText('Mínimo 8 caracteres')).toHaveAttribute('type', 'password')
      expect(screen.getByPlaceholderText('Repite tu contraseña')).toHaveAttribute('type', 'password')
    })
  })

  // =========================================================================
  // VALIDATION TESTS
  // =========================================================================

  describe('Form Validation', () => {
    it('should show error if nombre is empty', async () => {
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument()
      })
    })

    it('should show error if nombre is less than 2 characters', async () => {
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      await user.type(nombreInput, 'A')

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/debe tener al menos 2 caracteres/i)).toBeInTheDocument()
      })
    })

    it('should show error if email is invalid', async () => {
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')

      await user.type(nombreInput, 'Juan')
      await user.type(emailInput, 'not-an-email')

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
      })
    })

    it('should show error if password is less than 8 characters', async () => {
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')

      await user.type(nombreInput, 'Juan')
      await user.type(emailInput, 'juan@example.com')
      await user.type(passwordInput, 'short')

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/debe tener al menos 8 caracteres/i)).toBeInTheDocument()
      })
    })

    it('should show error if passwords do not match', async () => {
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')
      const confirmPasswordInput = screen.getByPlaceholderText('Repite tu contraseña')

      await user.type(nombreInput, 'Juan')
      await user.type(emailInput, 'juan@example.com')
      await user.type(passwordInput, 'SecurePass123!')
      await user.type(confirmPasswordInput, 'DifferentPass123!')

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument()
      })
    })

    it('should clear field error when user starts typing', async () => {
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })

      // Trigger validation error
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument()
      })

      // Start typing
      await user.type(nombreInput, 'J')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/el nombre es requerido/i)).not.toBeInTheDocument()
      })
    })
  })

  // =========================================================================
  // SUBMISSION TESTS
  // =========================================================================

  describe('Form Submission', () => {
    const validFormData = {
      nombre: 'Juan',
      email: 'juan@example.com',
      password: 'SecurePass123!',
      numero_telefono: '+5491123456789',
    }

    const mockResponse = {
      access_token: 'token123',
      refresh_token: 'refresh123',
      token_type: 'Bearer',
      user: {
        id: 1,
        nombre: 'Juan',
        email: 'juan@example.com',
        numero_telefono: '+5491123456789',
        roles: ['customer'],
        creado_en: new Date(),
        actualizado_en: new Date(),
      },
    }

    it('should submit form with valid data', async () => {
      ;(authApi.registerUser as any).mockResolvedValue(mockResponse)
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')
      const confirmPasswordInput = screen.getByPlaceholderText('Repite tu contraseña')
      const telefonoInput = screen.getByPlaceholderText('+54 1234 567890')

      await user.type(nombreInput, validFormData.nombre)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.password)
      await user.type(telefonoInput, validFormData.numero_telefono)

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(authApi.registerUser).toHaveBeenCalledWith(
          expect.objectContaining({
            nombre: validFormData.nombre,
            email: validFormData.email,
            password: validFormData.password,
            numero_telefono: validFormData.numero_telefono,
          })
        )
      })
    })

    it('should disable button while loading', async () => {
      ;(authApi.registerUser as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 1000))
      )
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')
      const confirmPasswordInput = screen.getByPlaceholderText('Repite tu contraseña')

      await user.type(nombreInput, validFormData.nombre)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.password)

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(submitButton).toHaveTextContent('Registrando...')
      })
    })

    it('should show error message on API failure', async () => {
      const errorMessage = 'El email ya está registrado'
      ;(authApi.registerUser as any).mockRejectedValue(new Error(errorMessage))
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')
      const confirmPasswordInput = screen.getByPlaceholderText('Repite tu contraseña')

      await user.type(nombreInput, validFormData.nombre)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.password)

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should call setUser and setTokens on successful registration', async () => {
      ;(authApi.registerUser as any).mockResolvedValue(mockResponse)
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')
      const confirmPasswordInput = screen.getByPlaceholderText('Repite tu contraseña')

      await user.type(nombreInput, validFormData.nombre)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.password)

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(mockResponse.user)
        expect(mockSetTokens).toHaveBeenCalledWith(
          mockResponse.access_token,
          mockResponse.refresh_token
        )
      })
    })
  })

  // =========================================================================
  // FIELD STATE TESTS
  // =========================================================================

  describe('Form State Management', () => {
    it('should trim whitespace from nombre and email on submit', async () => {
      const mockResponse = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        user: {
          id: 1,
          nombre: 'Juan',
          email: 'juan@example.com',
          numero_telefono: '',
          roles: ['customer'],
          creado_en: new Date(),
          actualizado_en: new Date(),
        },
      }
      ;(authApi.registerUser as any).mockResolvedValue(mockResponse)
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')
      const confirmPasswordInput = screen.getByPlaceholderText('Repite tu contraseña')

      await user.type(nombreInput, '  Juan  ')
      await user.type(emailInput, '  juan@example.com  ')
      await user.type(passwordInput, 'SecurePass123!')
      await user.type(confirmPasswordInput, 'SecurePass123!')

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(authApi.registerUser).toHaveBeenCalledWith(
          expect.objectContaining({
            nombre: 'Juan',
            email: 'juan@example.com',
          })
        )
      })
    })

    it('should make telefono undefined if empty', async () => {
      const mockResponse = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        user: {
          id: 1,
          nombre: 'Juan',
          email: 'juan@example.com',
          numero_telefono: undefined,
          roles: ['customer'],
          creado_en: new Date(),
          actualizado_en: new Date(),
        },
      }
      ;(authApi.registerUser as any).mockResolvedValue(mockResponse)
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')
      const confirmPasswordInput = screen.getByPlaceholderText('Repite tu contraseña')

      await user.type(nombreInput, 'Juan')
      await user.type(emailInput, 'juan@example.com')
      await user.type(passwordInput, 'SecurePass123!')
      await user.type(confirmPasswordInput, 'SecurePass123!')

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(authApi.registerUser).toHaveBeenCalledWith(
          expect.objectContaining({
            numero_telefono: undefined,
          })
        )
      })
    })
  })

  // =========================================================================
  // ACCESSIBILITY TESTS
  // =========================================================================

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      renderWithRouter(<RegisterForm />)

      const nombreInput = screen.getByLabelText(/nombre/i)
      expect(nombreInput).toHaveAttribute('id', 'nombre')

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute('id', 'email')

      const passwordInput = screen.getByLabelText(/^contraseña$/i)
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('should disable inputs while loading', async () => {
      const mockResponse = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        user: {
          id: 1,
          nombre: 'Juan',
          email: 'juan@example.com',
          numero_telefono: '',
          roles: ['customer'],
          creado_en: new Date(),
          actualizado_en: new Date(),
        },
      }
      ;(authApi.registerUser as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 1000))
      )
      renderWithRouter(<RegisterForm />)
      const user = userEvent.setup()

      const nombreInput = screen.getByPlaceholderText('Tu nombre completo')
      const emailInput = screen.getByPlaceholderText('tu@email.com')
      const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres')
      const confirmPasswordInput = screen.getByPlaceholderText('Repite tu contraseña')

      await user.type(nombreInput, 'Juan')
      await user.type(emailInput, 'juan@example.com')
      await user.type(passwordInput, 'SecurePass123!')
      await user.type(confirmPasswordInput, 'SecurePass123!')

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(nombreInput).toBeDisabled()
        expect(emailInput).toBeDisabled()
        expect(passwordInput).toBeDisabled()
      })
    })
  })
})
