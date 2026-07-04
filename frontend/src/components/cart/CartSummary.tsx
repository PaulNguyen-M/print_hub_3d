import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

interface CartSummaryProps {
  totalItems: number;
  totalPrice: number;
  onCheckout: () => void;
  loading?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  totalItems,
  totalPrice,
  onCheckout,
  loading = false,
}) => {
  const { t } = useTranslation();
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('cart.summary')}</h2>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-gray-700">
          <span>{t('cart.subtotal')} ({totalItems})</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>{t('cart.shipping')}</span>
          <span className="text-green-600">{t('cart.free')}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>{t('cart.tax')}</span>
          <span>${(totalPrice * 0.1).toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between text-lg font-semibold text-gray-900">
          <span>{t('cart.total')}</span>
          <span>${(totalPrice + totalPrice * 0.1).toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={totalItems === 0 || loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? t('cart.processing') : t('cart.checkout')}
      </button>

      <Link
        to="/marketplace"
        className="block text-center text-blue-600 mt-4 hover:underline"
      >
        {t('cart.continue')}
      </Link>
    </div>
  );
};
