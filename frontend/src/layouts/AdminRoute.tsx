import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import type { JSX } from 'react'

interface AdminRouteProps {
  children: JSX.Element
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children
}
