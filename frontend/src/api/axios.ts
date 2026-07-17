import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

/**
 * apiClient — Axios cấu hình sẵn cho backend: tự đính JWT vào mỗi request,
 * và tự dọn session + chuyển về trang đăng nhập khi gặp lỗi 401.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn / không hợp lệ → dọn sạch session để không còn thông tin cũ
      const onAuthPage = window.location.pathname.startsWith('/auth')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('auth-user')
      localStorage.removeItem('cart-store')
      // Chuyển về trang đăng nhập nếu đang ở trang cần auth (tránh hiển thị dữ liệu lệch)
      if (!onAuthPage) {
        window.location.assign('/auth/login')
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
