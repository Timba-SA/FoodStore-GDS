/**
 * Auth store — single source of truth for authentication state.
 *
 * Tokens are stored here (via Zustand persist) and ONLY accessed
 * through this store. The Axios client reads from here, never from
 * localStorage directly.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/shared/query/queryClient'

// ------------------------------------------------------------------ //
// Types — aligned to backend UserResponse schema                       //
// ------------------------------------------------------------------ //

export interface User {
  id: number
  nombre: string
  email: string
  numero_telefono?: string | null
  roles: string[]
  creado_en: string
  actualizado_en: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Atomic action: set tokens + user in one call (avoids partial state)
  setAuth: (accessToken: string, refreshToken: string, user: User) => void
  // Update only the access token (used by the refresh interceptor)
  setAccessToken: (accessToken: string) => void
  // Update only the refresh token (used after rotation)
  setRefreshToken: (refreshToken: string) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
  hasRole: (allowedRoles: string[]) => boolean
}

// ------------------------------------------------------------------ //
// Store                                                                //
// ------------------------------------------------------------------ //

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setRefreshToken: (refreshToken) => set({ refreshToken }),

      setLoading: (loading) => set({ isLoading: loading }),

      clearAuth: () => {
        queryClient.clear()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
        
      hasRole: (allowedRoles) => {
        const user = get().user
        if (!user || !user.roles) return false
        return allowedRoles.some((r) => user.roles.includes(r))
      },
    }),
    {
      name: 'auth-storage',
      // Only persist auth data — isLoading is transient
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// ------------------------------------------------------------------ //
// Selector helpers (use these in components to avoid over-renders)    //
// ------------------------------------------------------------------ //

export const selectAccessToken = (s: AuthState) => s.accessToken
export const selectRefreshToken = (s: AuthState) => s.refreshToken
export const selectUser = (s: AuthState) => s.user
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated
