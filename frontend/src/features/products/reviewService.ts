import apiClient from '../../api/axios'

export interface Review {
  reviewId: number
  productId: number
  userId: number
  userName: string
  userAvatarUrl?: string
  rating: number
  comment?: string
  verifiedPurchase?: boolean
  helpfulCount?: number
  createdAt: string
}

export interface PagedReviews {
  content: Review[]
  totalElements: number
  totalPages: number
  number: number
}

/** reviewService — Gọi API đánh giá sản phẩm (lấy danh sách, tạo/sửa đánh giá). */
const reviewService = {
  getReviews: async (productId: number, page = 0, size = 10) => {
    const res = await apiClient.get(`/products/${productId}/reviews`, { params: { page, size } })
    return res.data.data as PagedReviews
  },

  addReview: async (productId: number, rating: number, comment: string) => {
    const res = await apiClient.post(`/products/${productId}/reviews`, { rating, comment })
    return res.data.data as Review
  },
}

export default reviewService
