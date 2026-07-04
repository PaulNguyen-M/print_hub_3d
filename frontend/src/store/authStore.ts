import { create } from 'zustand'
import { queryClient } from '../lib/queryClient'
import { useChatStore } from './chatStore'

interface UserSession {
  id: number
  email: string
  fullName: string
  role: string
  profileImageUrl?: string
}

interface AuthState {
  user: UserSession | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setSession: (session: UserSession, accessToken: string, refreshToken: string) => void
  clearSession: () => void
}

const USER_KEY = 'auth-user'

/** Khôi phục user đã lưu từ localStorage (để refresh không mất thông tin). */
function loadStoredUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserSession) : null
  } catch {
    return null
  }
}

/** Xóa toàn bộ dữ liệu phụ thuộc người dùng (cart + cache server + chat). */
function clearUserScopedData() {
  localStorage.removeItem('cart-store')
  // Xóa toàn bộ React Query cache để không lẫn dữ liệu giữa các tài khoản
  queryClient.clear()
  // Dọn trạng thái chat để không lẫn hội thoại giữa các tài khoản
  useChatStore.getState().reset()
}

const storedToken = localStorage.getItem('accessToken')
const storedUser = loadStoredUser()

const useAuthStore = create<AuthState>((set) => ({
  // Chỉ coi là đã đăng nhập khi có CẢ token lẫn user → tránh trạng thái lệch sau refresh
  user: storedToken ? storedUser : null,
  accessToken: storedToken,
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: Boolean(storedToken && storedUser),

  setSession: (session, accessToken, refreshToken) => {
    // Đổi tài khoản: xóa dữ liệu của user cũ trước
    clearUserScopedData()
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(session))
    set({ user: session, accessToken, refreshToken, isAuthenticated: true })
  },

  clearSession: () => {
    clearUserScopedData()
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem(USER_KEY)
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },
}))

export default useAuthStore
