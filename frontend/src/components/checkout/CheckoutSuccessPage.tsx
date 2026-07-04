import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useOrder } from '../../hooks/useOrder';
import { useTranslation } from '../../i18n/useTranslation';

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchOrder } = useOrder();
  const { t } = useTranslation();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      fetchOrder(Number(orderId));
    }
  }, [fetchOrder, orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-700 mx-auto mb-6">
        <CheckCircle2 size={40} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('checkout.successTitle')}</h1>
      <p className="text-gray-600 mb-6">
        {t('checkout.successDesc')}
      </p>
      <div className="space-x-4">
        <button
          onClick={() => navigate(orderId ? `/orders/${orderId}` : '/orders')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {t('checkout.viewOrder')}
        </button>
        <button
          onClick={() => navigate('/marketplace')}
          className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
        >
          {t('checkout.continue')}
        </button>
      </div>
    </div>
  );
};
