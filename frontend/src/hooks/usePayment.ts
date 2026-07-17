import { useState } from 'react';
import api from '../api/axios';

export interface PaymentSession {
  paymentId: number;
  orderId: number;
  checkoutUrl: string;
  sessionId: string;
}

export interface RefundResult {
  paymentId: number;
  paymentStatus: string;
}

/** usePayment — Hook thanh toán: tạo phiên checkout và yêu cầu hoàn tiền. */
export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Tạo phiên thanh toán (checkout) cho một đơn, trả về URL/thông tin phiên. */
  const createCheckoutSession = async (
    orderId: number,
    successUrl: string,
    cancelUrl: string,
    paymentMethod = 'CARD'
  ): Promise<PaymentSession> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/payments/create-session', {
        orderId,
        paymentMethod,
        successUrl,
        cancelUrl,
      });
      return data.data;
    } catch (exception) {
      const message = (exception as Error).message || 'Unable to create payment session';
      setError(message);
      throw exception;
    } finally {
      setLoading(false);
    }
  };

  /** Yêu cầu hoàn tiền cho một khoản thanh toán. */
  const refundPayment = async (
    paymentId: number,
    amount: number,
    reason = 'Customer refund request'
  ): Promise<RefundResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post(`/payments/${paymentId}/refund`, {
        amount,
        reason,
      });
      return data.data;
    } catch (exception) {
      const message = (exception as Error).message || 'Unable to refund payment';
      setError(message);
      throw exception;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createCheckoutSession,
    refundPayment,
  };
};
