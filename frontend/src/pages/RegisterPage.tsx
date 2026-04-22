/**
 * Register Page
 */

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/authStore'
import RegisterForm from '../features/auth/RegisterForm'

export const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div>
      <RegisterForm />
    </div>
  )
}

export default RegisterPage
