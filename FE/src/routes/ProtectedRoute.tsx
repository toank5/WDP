import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { USER_ROLES } from '@eyewear/shared'

type ProtectedRouteProps = {
  children: ReactNode
  allowedRoles?: USER_ROLES[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as USER_ROLES)) {
    return <Navigate to="/" replace />
  }

  return children
}
