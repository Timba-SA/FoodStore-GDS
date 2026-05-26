import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'

interface ProtectedRouteProps {
  allowedRoles?: string[]
  redirectTo?: string
}

export default function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole } = useAuthStore()
  const location = useLocation()

  console.log('[ProtectedRoute] Guard Check:', {
    path: location.pathname,
    isAuthenticated,
    userEmail: user?.email,
    userRoles: user?.roles,
    allowedRoles,
    hasRequiredRole: allowedRoles ? hasRole(allowedRoles) : true
  })

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
