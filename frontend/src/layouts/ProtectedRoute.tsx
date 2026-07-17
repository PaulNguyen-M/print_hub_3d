import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import type { JSX } from 'react'

interface ProtectedRouteProps {
  children: JSX.Element
}

/** ProtectedRoute — Route guard: yêu cầu đăng nhập; chưa đăng nhập thì chuyển về trang login. */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return children
}
