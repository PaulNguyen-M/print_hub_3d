import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { CartItemComponent } from './CartItemComponent';
import { CartSummary } from './CartSummary';
import { useTranslation } from '../../i18n/useTranslation';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    cart, loading, isEmpty, removeFromCart, updateQuantity, totalItems, totalPrice,
  } = useCart();

  const handleCheckout = () => navigate('/checkout');

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
        <ShoppingCart size={48} className="mb-4 text-slate-300" />
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">{t('cart.empty')}</h1>
        <p className="mb-6 text-slate-500 dark:text-slate-400">{t('cart.emptyDesc')}</p>
        <button type="button" onClick={() => navigate('/marketplace')} className="btn-primary">
          {t('cart.continue')}
        </button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-white">{t('cart.title')}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              {totalItems} {t('cart.itemsInCart')}
            </h2>
            {cart?.items?.length ? (
              <div>
                {cart.items.map((item) => (
                  <CartItemComponent
                    key={item.productId}
                    item={item}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <CartSummary totalItems={totalItems} totalPrice={totalPrice} onCheckout={handleCheckout} />
        </div>
      </div>
    </div>
  );
};
