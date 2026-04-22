/**
 * Authentication API client
 */

import client from './client'

export interface User {
  id: number
  nombre: string
  email: string
  numero_telefono?: string | null
  roles: string[]
  creado_en: string
  actualizado_en: string
}

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

/**
 * Register a new user
 *
 * @param data - Registration data
 * @returns Token response with user data
 * @throws AxiosError with status 409 if email already exists
 */
export async function registerUser(data: RegisterRequest): Promise<TokenResponse> {
  try {
    const response = await client.post<TokenResponse>('/auth/register', data)
    return response.data
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error('El email ya está registrado')
    }
    if (error.response?.status === 400) {
      throw new Error('Datos inválidos. Verifica que el email sea válido y la contraseña tenga mínimo 8 caracteres')
    }
    throw new Error('Error al registrar usuario')
  }
}

/**
 * Login user
 *
 * @param email - User email
 * @param password - User password
 * @returns Token response with user data
 * @throws AxiosError with status 401 if credentials invalid
 */
export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  try {
    const response = await client.post<TokenResponse>('/auth/login', {
      email,
      password,
    })
    return response.data
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Email o contraseña inválidos')
    }
    if (error.response?.status === 429) {
      throw new Error('Demasiados intentos. Intenta de nuevo más tarde')
    }
    throw new Error('Error al iniciar sesión')
  }
}

/**
 * Refresh access token
 *
 * @param refreshToken - Refresh token
 * @returns New token response
 * @throws AxiosError with status 401 if token invalid/expired
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  try {
    const response = await client.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  } catch (error: any) {
    throw new Error('Error al renovar token')
  }
}

/**
 * Logout user
 *
 * @param refreshToken - Current refresh token to revoke
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  try {
    await client.post('/auth/logout', {
      refresh_token: refreshToken,
    })
  } catch (error: any) {
    // Even if logout fails, we clear local state
    console.warn('Error during logout:', error)
  }
}
