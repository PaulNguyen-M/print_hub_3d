import apiClient from '../../api/axios'
import type { Shop, ShopProduct } from '../shop/shopService'

export interface SellerApplication {
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

/** sellerService — API người bán: đăng ký mở sạp, lấy/cập nhật sạp của mình, sản phẩm của sạp. */
const sellerService = {
  /** Submit an application to open a shop. */
  apply: async (shopName: string, description: string) => {
    const res = await apiClient.post('/seller/apply', { shopName, description })
    return res.data.data as SellerApplication
  },

  /** The current user's most recent application (or null). */
  getMyApplication: async () => {
    const res = await apiClient.get('/seller/application')
    return res.data.data as SellerApplication | null
  },

  /** The current user's own shop (null if not a seller). */
  getMyShop: async () => {
    const res = await apiClient.get('/seller/shop')
    return res.data.data as Shop | null
  },

  /** Update the current user's shop profile + featured products. */
  updateShop: async (data: {
    name?: string
    description?: string
    logoUrl?: string
    bannerUrl?: string
    featuredProductIds?: number[]
  }) => {
    const res = await apiClient.put('/seller/shop', data)
    return res.data.data as Shop
  },

  /** All products in the seller's own shop (for the customize picker). */
  getMyShopProducts: async (slug: string, page = 0, size = 100) => {
    const res = await apiClient.get(`/shops/${slug}/products`, { params: { page, size, sort: 'newest' } })
    return res.data.data.content as ShopProduct[]
  },
}

export default sellerService
