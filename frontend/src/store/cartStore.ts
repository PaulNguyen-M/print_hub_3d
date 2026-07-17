import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export interface CartItem {
  cartItemId: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  cartId: number;
  totalItems: number;
  totalPrice: number;
  items: CartItem[];
}

interface CartStore {
  cart: Cart | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCart: () => Cart | null;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

/** cartStore — Giỏ hàng phía client: đồng bộ với server qua API và lưu bền qua localStorage. */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      loading: false,
      error: null,

      /** Tải giỏ từ server (bỏ qua nếu chưa đăng nhập). */
      fetchCart: async () => {
        // Không fetch nếu chưa đăng nhập
        const token = localStorage.getItem('accessToken')
        if (!token) {
          set({ cart: null, loading: false })
          return
        }
        set({ loading: true, error: null });
        try {
          const { data } = await api.get('/cart');
          set({ cart: data.data });
        } catch (error) {
          set({ cart: null, error: (error as Error).message });
        } finally {
          set({ loading: false });
        }
      },

      /** Thêm sản phẩm vào giỏ. */
      addToCart: async (productId: number, quantity: number) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/cart/add', {
            productId,
            quantity,
          });
          set({ cart: data.data });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ loading: false });
        }
      },

      /** Xóa một sản phẩm khỏi giỏ. */
      removeFromCart: async (productId: number) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.delete(`/cart/item/${productId}`);
          set({ cart: data.data });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ loading: false });
        }
      },

      /** Đổi số lượng một món trong giỏ. */
      updateQuantity: async (productId: number, quantity: number) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.put(
            `/cart/item/${productId}/quantity`,
            {},
            { params: { quantity } }
          );
          set({ cart: data.data });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ loading: false });
        }
      },

      /** Dọn sạch giỏ hàng. */
      clearCart: async () => {
        set({ loading: true, error: null });
        try {
          await api.delete('/cart/clear');
          set({ cart: { cartId: 0, totalItems: 0, totalPrice: 0, items: [] } });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ loading: false });
        }
      },

      // Các getter tiện lấy giỏ / tổng số món / tổng tiền từ state
      getCart: () => get().cart,

      getTotalItems: () => get().cart?.totalItems || 0,

      getTotalPrice: () => get().cart?.totalPrice || 0,
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
