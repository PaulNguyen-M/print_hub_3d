import { useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import useAuthStore from '../store/authStore';

export const useCart = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.id)

  const {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  } = useCartStore();

  // Fetch cart từ server mỗi khi user thay đổi (login/logout/switch account)
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchCart()
    } else {
      // Không authenticated → reset cart về null
      useCartStore.setState({ cart: null })
    }
  }, [isAuthenticated, userId])

  return {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    isEmpty: !cart || cart.items.length === 0,
  };
};
