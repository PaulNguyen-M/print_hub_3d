import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

interface CartSummaryProps {
  totalItems: number;
  totalPrice: number;
  onCheckout: () => void;
  loading?: boolean;
}

const formatPrice = (p: number) =>
  (p ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

/** CartSummary — Ô tóm tắt giỏ: tạm tính, phí ship, thuế, tổng và nút thanh toán. */
export const CartSummary: React.FC<CartSummaryProps> = ({
  totalItems,
  totalPrice,
  onCheckout,
  loading = false,
}) => {
  const { t } = useTranslation();
  const tax = totalPrice * 0.1;
  return (
    <div className="card p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{t('cart.summary')}</h2>

      <div className="mb-4 space-y-3 text-sm">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>{t('cart.subtotal')} ({totalItems})</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>{t('cart.shipping')}</span>
          <span className="font-medium text-green-600">{t('cart.free')}</span>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>{t('cart.tax')}</span>
          <span>{formatPrice(tax)}</span>
        </div>
      </div>

      <div className="mb-6 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex justify-between text-lg font-semibold text-slate-900 dark:text-white">
          <span>{t('cart.total')}</span>
          <span className="text-brand-600">{formatPrice(totalPrice + tax)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={totalItems === 0 || loading}
        className="btn-primary w-full justify-center py-3 disabled:opacity-60"
      >
        {loading ? t('cart.processing') : t('cart.checkout')}
      </button>

      <Link to="/marketplace" className="mt-4 block text-center text-sm text-brand-600 hover:underline">
        {t('cart.continue')}
      </Link>
    </div>
  );
};
