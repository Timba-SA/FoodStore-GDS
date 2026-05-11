/**
 * Authentication API — aligned to backend contract.
 *
 * All functions update authStore as the single source of truth.
 * Error messages map backend {error, message} bodies to user-friendly strings.
 */

import client from './client'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { User } from '@/features/auth/store/authStore'

// ------------------------------------------------------------------ //
// Types — mirror backend schemas exactly                               //
// ------------------------------------------------------------------ //

export type { User }

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface RegisterRequest {
  nombre: string
  email: string
  password: string
  numero_telefono?: string
}

export interface LoginRequest {
  email: string
  password: string
}

// ------------------------------------------------------------------ //
// Error mapping                                                        //
// ------------------------------------------------------------------ //

function mapAuthError(error: unknown, fallback: string): never {
  const axiosError = error as {
    response?: { status: number; data?: { error?: string; message?: string } }
  }
  const status = axiosError?.response?.status
  const detail = axiosError?.response?.data

  if (status === 409) throw new Error('El email ya está registrado')
  if (status === 401) {
    const msg = detail?.message || 'Credenciales inválidas'
    throw new Error(msg)
  }
  if (status === 429) throw new Error('Demasiados intentos. Intenta de nuevo más tarde')
  if (detail?.message) throw new Error(detail.message)
  throw new Error(fallback)
}

// ------------------------------------------------------------------ //
// API functions                                                        //
// ------------------------------------------------------------------ //

/**
 * Register a new user and persist auth state in the store.
 */
export async function registerUser(data: RegisterRequest): Promise<TokenResponse> {
  try {
    const response = await client.post<TokenResponse>('/auth/register', data)
    const tokenData = response.data

    useAuthStore.getState().setAuth(
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.user
    )

    return tokenData
  } catch (error) {
    mapAuthError(error, 'Error al registrar usuario')
  }
}

/**
 * Login with email/password and persist auth state in the store.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<TokenResponse> {
  try {
    const response = await client.post<TokenResponse>('/auth/login', {
      email,
      password,
    })
    const tokenData = response.data

    useAuthStore.getState().setAuth(
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.user
    )

    return tokenData
  } catch (error) {
    mapAuthError(error, 'Error al iniciar sesión')
  }
}

/**
 * Refresh access token manually (the Axios interceptor handles this
 * automatically, but this can be called explicitly if needed).
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  try {
    const response = await client.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    const tokenData = response.data

    useAuthStore.getState().setAuth(
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.user
    )

    return tokenData
  } catch (error) {
    mapAuthError(error, 'Error al renovar sesión')
  }
}

/**
 * Logout: revoke refresh token on backend, then clear local auth state.
 * Idempotent — if the backend call fails, we still clear local state.
 */
export async function logoutUser(): Promise<void> {
  const { refreshToken, clearAuth } = useAuthStore.getState()

  if (refreshToken) {
    try {
      await client.post('/auth/logout', { refresh_token: refreshToken })
    } catch {
      // Backend logout failed — still clear locally (idempotent)
      console.warn('[auth] Backend logout failed, clearing local state anyway')
    }
  }

  clearAuth()
}

/**
 * Fetch the current user profile from /auth/me and update the store.
 * Useful after page reload to re-sync user data.
 */
export async function fetchCurrentUser(): Promise<User> {
  try {
    const response = await client.get<User>('/auth/me')
    const user = response.data
    // Keep tokens, just update the user object
    const { accessToken, refreshToken, setAuth } = useAuthStore.getState()
    if (accessToken && refreshToken) {
      setAuth(accessToken, refreshToken, user)
    }
    return user
  } catch (error) {
    mapAuthError(error, 'Error al obtener perfil de usuario')
  }
}
