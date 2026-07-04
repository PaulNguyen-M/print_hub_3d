import useAuthStore from '../store/authStore'

export default function useAuth() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  return {
    user,
    isAuthenticated,
    setSession,
    clearSession
  }
}
