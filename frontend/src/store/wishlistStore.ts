import { create } from 'zustand'
import api from '../api/axios'

export interface WishlistProduct {
  id: number
  title: string
  price: number
  thumbnailUrl?: string
  category?: string
  rating?: number
  reviewCount?: number
  shopName?: string
  shopSlug?: string
  totalSold?: number
}

interface WishlistStore {
  ids: Set<number>
  fetchIds: () => Promise<void>
  toggle: (productId: number) => Promise<boolean>
  clear: () => void
}

export const useWishlistStore = create<WishlistStore>((set) => ({
  ids: new Set<number>(),

  fetchIds: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ ids: new Set() })
      return
    }
    try {
      const { data } = await api.get('/wishlist/ids')
      set({ ids: new Set<number>(data.data ?? []) })
    } catch {
      // im lặng
    }
  },

  toggle: async (productId) => {
    const { data } = await api.post(`/wishlist/${productId}/toggle`)
    const favorited: boolean = data.data.favorited
    set((state) => {
      const ids = new Set(state.ids)
      if (favorited) ids.add(productId)
      else ids.delete(productId)
      return { ids }
    })
    return favorited
  },

  clear: () => set({ ids: new Set() }),
}))

export async function getWishlist(): Promise<WishlistProduct[]> {
  const res = await api.get('/wishlist')
  return res.data.data
}
