import { create } from 'zustand';
import api from '../api/axios';

export interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderTimeline {
  status: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface PaymentTransaction {
  transactionId: number;
  transactionType: string;
  amount: number;
  responseCode?: string;
  responseMessage?: string;
  createdAt: string;
}

export interface Payment {
  paymentId: number;
  orderId: number;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentGateway: string;
  gatewayTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  transactions: PaymentTransaction[];
}

export interface Order {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  shippingAddress: string;
  shippingCity: string;
  shippingStateProvince: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  timeline: OrderTimeline[];
  payment?: Payment;
}

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  totalCount: number;

  // Actions
  fetchOrders: (page?: number, size?: number) => Promise<void>;
  fetchOrder: (orderId: number) => Promise<void>;
  fetchOrderHistory: () => Promise<void>;
  createOrder: (shippingData: any) => Promise<Order>;
  updateOrderStatus: (orderId: number, status: string) => Promise<void>;
  getOrderById: (orderId: number) => Order | undefined;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  totalCount: 0,

  fetchOrders: async (page = 0, size = 10) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/orders', {
        params: { page, size, sortBy: 'createdAt', direction: 'DESC' },
      });
      set({
        orders: data.data.content,
        totalCount: data.data.totalElements,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchOrder: async (orderId: number) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      set({ currentOrder: data.data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchOrderHistory: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/orders/history');
      set({ orders: data.data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createOrder: async (shippingData: any) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/orders/create', shippingData);
      set({ currentOrder: data.data });
      return data.data;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    set({ error: null });
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, {}, {
        params: { status },
      });
      
      set((state) => {
        if (state.currentOrder?.orderId === orderId) {
          return { currentOrder: data.data };
        }
        return {
          orders: state.orders.map((order) =>
            order.orderId === orderId ? data.data : order
          ),
        };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  getOrderById: (orderId: number) => {
    const state = get();
    return state.currentOrder?.orderId === orderId
      ? state.currentOrder
      : state.orders.find((order) => order.orderId === orderId);
  },
}));
