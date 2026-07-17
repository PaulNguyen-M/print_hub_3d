import { useOrderStore } from '../store/orderStore';

/** useOrder — Hook tiện truy cập orderStore (đơn hàng phía người mua). */
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
