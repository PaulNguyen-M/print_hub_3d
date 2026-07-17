import apiClient from '../../api/axios'

export interface Shop {
  shopId: number
  name: string
  slug: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  status: string
  rating?: number
  totalReviews?: number
  totalProducts?: number
  totalSales?: number
  totalFollowers?: number
  ownerId?: number
  ownerName?: string
  ownerAvatarUrl?: string
  isFollowing?: boolean | null
  canReview?: boolean
  ratingDistribution?: Record<number, number>
  createdAt?: string
  featuredProductIds?: number[]
}

export interface ShopProduct {
  id: number
  title: string
  price: number
  thumbnailUrl?: string
  imageUrl?: string
  category?: string
  rating?: number
  reviewCount?: number
  totalSold?: number
}

export interface ShopReview {
  shopReviewId: number
  userId: number
  userName: string
  userAvatarUrl?: string
  rating: number
  comment?: string
  createdAt: string
  verifiedPurchase?: boolean
}

export interface Paged<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/** shopService — Gọi API sạp: thông tin, sản phẩm, đánh giá, theo dõi và sản phẩm nổi bật. */
const shopService = {
  getShop: async (slug: string) => {
    const res = await apiClient.get(`/shops/${slug}`)
    return res.data.data as Shop
  },

  getShopProducts: async (slug: string, page = 0, size = 12, sort = 'newest', search?: string) => {
    const res = await apiClient.get(`/shops/${slug}/products`, {
      params: { page, size, sort, ...(search ? { search } : {}) },
    })
    return res.data.data as Paged<ShopProduct>
  },

  getShopReviews: async (slug: string, page = 0, size = 20) => {
    const res = await apiClient.get(`/shops/${slug}/reviews`, { params: { page, size } })
    return res.data.data as Paged<ShopReview>
  },

  toggleFollow: async (slug: string) => {
    const res = await apiClient.post(`/shops/${slug}/follow`)
    return res.data.data as { following: boolean }
  },

  reviewShop: async (slug: string, rating: number, comment: string) => {
    const res = await apiClient.post(`/shops/${slug}/reviews`, { rating, comment })
    return res.data.data as ShopReview
  },

  getFeaturedProducts: async (slug: string) => {
    const res = await apiClient.get(`/shops/${slug}/featured`)
    return res.data.data as ShopProduct[]
  },
}

export default shopService
