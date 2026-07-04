import apiClient from '../../api/axios'

export interface AdminDashboardOverview {
  totalUsers: number
  activeUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  pendingPrintingRequests: number
  monthlyRevenue: Array<{ period: string; revenue: number }>
}

export interface RevenuePoint {
  period: string
  revenue: number
}

export interface RevenueStats {
  totalRevenue: number
  averageOrderValue: number
  orderCount: number
  monthlyRevenue: RevenuePoint[]
}

export interface AdminProduct {
  productId: number
  name: string
  sellerName: string
  sellerEmail?: string
  shopName?: string
  thumbnailUrl?: string
  price: number
  stockQuantity: number
  active: boolean
  status: 'PENDING' | 'ACTIVE' | 'REJECTED'
  rejectionReason?: string
  createdAt: string
}

export interface AdminOrder {
  orderId: number
  orderNumber: string
  customerName: string
  totalAmount: number
  orderStatus: string
  paymentMethod?: string
  trackingNumber?: string
  createdAt: string
}

export interface AdminUser {
  userId: number
  email: string
  fullName: string
  role: string
  active: boolean
  verified: boolean
  createdAt: string
}

export interface AdminPrintingRequest {
  requestId: number
  userName: string
  fileName: string
  modelStatus: string
  quoteAmount: number
  createdAt: string
}

export interface AdminSellerApplication {
  applicationId: number
  applicantId: number
  applicantName: string
  applicantEmail: string
  shopName: string
  description?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  openingFee: number
  feePaid: boolean
  rejectionReason?: string
  reviewedAt?: string
  shopId?: number
  shopSlug?: string
  createdAt: string
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

const adminService = {
  getDashboardOverview: async () => {
    const response = await apiClient.get('/admin/dashboard')
    return response.data.data as AdminDashboardOverview
  },

  getRevenueStats: async () => {
    const response = await apiClient.get('/admin/revenue')
    return response.data.data as RevenueStats
  },

  getProducts: async (page: number, size: number, status?: string) => {
    const response = await apiClient.get('/admin/products', {
      params: { page, size, sortBy: 'createdAt', direction: 'DESC', ...(status ? { status } : {}) }
    })
    return response.data.data as PagedResponse<AdminProduct>
  },

  approveProduct: async (productId: number) => {
    const response = await apiClient.post(`/admin/products/${productId}/approve`)
    return response.data.data as AdminProduct
  },

  rejectProduct: async (productId: number, reason: string) => {
    const response = await apiClient.post(`/admin/products/${productId}/reject`, null, {
      params: { reason }
    })
    return response.data.data as AdminProduct
  },

  updateProductStatus: async (productId: number, active: boolean) => {
    await apiClient.put(`/admin/products/${productId}/status`, null, {
      params: { active }
    })
  },

  getOrders: async (page: number, size: number) => {
    const response = await apiClient.get('/admin/orders', {
      params: { page, size, sortBy: 'createdAt', direction: 'DESC' }
    })
    return response.data.data as PagedResponse<AdminOrder>
  },

  advanceOrderStatus: async (orderId: number, nextStatus: string) => {
    await apiClient.put(`/admin/orders/${orderId}/status`, null, {
      params: { status: nextStatus }
    })
  },

  confirmOrder: async (orderId: number) => {
    await apiClient.post(`/admin/orders/${orderId}/confirm`)
  },

  completeOrder: async (orderId: number) => {
    await apiClient.post(`/admin/orders/${orderId}/complete`)
  },

  getUsers: async (page: number, size: number) => {
    const response = await apiClient.get('/admin/users', {
      params: { page, size, sortBy: 'createdAt', direction: 'DESC' }
    })
    return response.data.data as PagedResponse<AdminUser>
  },

  updateUserStatus: async (userId: number, active: boolean) => {
    await apiClient.put(`/admin/users/${userId}/status`, null, {
      params: { active }
    })
  },

  updateUserRole: async (userId: number, role: string) => {
    await apiClient.put(`/admin/users/${userId}/role`, null, {
      params: { role }
    })
  },

  getPrintingRequests: async (page: number, size: number) => {
    const response = await apiClient.get('/admin/printing-requests', {
      params: { page, size, sortBy: 'createdAt', direction: 'DESC' }
    })
    return response.data.data as PagedResponse<AdminPrintingRequest>
  },

  updatePrintingRequestStatus: async (requestId: number, status: string) => {
    await apiClient.put(`/admin/printing-requests/${requestId}/status`, null, {
      params: { status }
    })
  },

  getSellerApplications: async (page: number, size: number, status?: string) => {
    const response = await apiClient.get('/admin/seller-applications', {
      params: { page, size, ...(status ? { status } : {}) }
    })
    return response.data.data as PagedResponse<AdminSellerApplication>
  },

  approveSellerApplication: async (applicationId: number) => {
    const response = await apiClient.post(`/admin/seller-applications/${applicationId}/approve`)
    return response.data.data as AdminSellerApplication
  },

  rejectSellerApplication: async (applicationId: number, rejectionReason: string) => {
    const response = await apiClient.post(`/admin/seller-applications/${applicationId}/reject`, {
      rejectionReason
    })
    return response.data.data as AdminSellerApplication
  }
}

export default adminService
