/**
 * Shared Axios client with:
 *  - Bearer token injected from authStore (not localStorage)
 *  - Single-flight refresh queue: concurrent 401s share one refresh call
 *  - Automatic retry of pending requests after successful refresh
 *  - Redirect to /login on refresh failure
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import { useAuthStore } from '@/features/auth/store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1'

// ------------------------------------------------------------------ //
// Axios instance                                                       //
// ------------------------------------------------------------------ //

const client: AxiosInstance = axios.create({
  baseURL: `${API_URL}/${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ------------------------------------------------------------------ //
// Single-flight refresh state                                          //
//                                                                      //
// If N requests fail with 401 simultaneously, only ONE refresh call   //
// is made. The others wait on the same promise and retry with the new  //
// access token once it resolves.                                       //
// ------------------------------------------------------------------ //

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function resolvePending(token: string) {
  pendingQueue.forEach(({ resolve }) => resolve(token))
  pendingQueue = []
}

function rejectPending(error: unknown) {
  pendingQueue.forEach(({ reject }) => reject(error))
  pendingQueue = []
}

// ------------------------------------------------------------------ //
// Request interceptor — inject access token from store                 //
// ------------------------------------------------------------------ //

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ------------------------------------------------------------------ //
// Response interceptor — single-flight refresh on 401                  //
// ------------------------------------------------------------------ //

client.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Only handle 401 that haven't been retried yet
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const { refreshToken, setAccessToken, setRefreshToken, clearAuth } =
      useAuthStore.getState()

    // No refresh token → clear session and redirect
    if (!refreshToken) {
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newAccessToken) => {
        originalRequest._retry = true
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return client(originalRequest)
      })
    }

    // First 401 — kick off the refresh
    originalRequest._retry = true
    isRefreshing = true

    try {
      // Use a raw axios call to avoid infinite loop through our interceptor
      const response = await axios.post(
        `${API_URL}/${API_VERSION}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )

      const { access_token, refresh_token: new_refresh_token } = response.data

      // Update store (not localStorage)
      setAccessToken(access_token)
      if (new_refresh_token) {
        setRefreshToken(new_refresh_token)
      }

      // Unblock pending queue
      resolvePending(access_token)

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${access_token}`
      return client(originalRequest)
    } catch (refreshError) {
      // Refresh failed (token invalid/replay detected) → clear session
      rejectPending(refreshError)
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default client
