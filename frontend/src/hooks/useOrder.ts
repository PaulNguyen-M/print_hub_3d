import { useOrderStore } from '../store/orderStore';

export const useOrder = () => {
  const {
    orders,
    currentOrder,
    loading,
    error,
    totalCount,
    fetchOrders,
    fetchOrder,
    fetchOrderHistory,
    createOrder,
    updateOrderStatus,
    getOrderById,
  } = useOrderStore();

  return {
    orders,
    currentOrder,
    loading,
    error,
    totalCount,
    fetchOrders,
    fetchOrder,
    fetchOrderHistory,
    createOrder,
    updateOrderStatus,
    getOrderById,
  };
};
