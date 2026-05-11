import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated, selectUser } from './store/authStore'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

/**
 * Higher-Order Component to protect routes based on authentication and roles.
 * 
 * If the user is not authenticated, they are redirected to /login.
 * If the user does not have ANY of the allowedRoles, they are redirected to a 403 or home page.
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const user = useAuthStore(selectUser)
  const hasRole = useAuthStore((state) => state.hasRole)
  const location = useLocation()

  if (!isAuthenticated || !user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If roles are specified, verify the user has at least one of them
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      // User is logged in but doesn't have the required role
      return <Navigate to="/403" replace />
    }
  }

  return <Outlet />
}
