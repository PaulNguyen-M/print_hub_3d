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

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
