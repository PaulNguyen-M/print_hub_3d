import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

/** CheckoutCancelPage — Trang báo hủy/thất bại thanh toán, cho quay lại giỏ hoặc chợ. */
export const CheckoutCancelPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-700 mx-auto mb-6">
        <XCircle size={40} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('checkout.cancelTitle')}</h1>
      <p className="text-gray-600 mb-6">
        {t('checkout.cancelDesc')}
      </p>
      <div className="space-x-4">
        <button
          onClick={() => navigate('/cart')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {t('checkout.returnCart')}
        </button>
        <button
          onClick={() => navigate('/checkout')}
          className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
        >
          {t('checkout.retry')}
        </button>
      </div>
    </div>
  );
};
