import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { CartItemComponent } from './CartItemComponent';
import { CartSummary } from './CartSummary';
import { useTranslation } from '../../i18n/useTranslation';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    cart,
    loading,
    isEmpty,
    removeFromCart,
    updateQuantity,
    totalItems,
    totalPrice,
  } = useCart();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{t('cart.loading')}</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h1>
          <p className="text-gray-600 mb-6">
            {t('cart.emptyDesc')}
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {t('cart.continue')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('cart.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {totalItems} {t('cart.itemsInCart')}
          </h2>

          {cart?.items && cart.items.length > 0 ? (
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

        {/* Cart Summary */}
        <div>
          <CartSummary
            totalItems={totalItems}
            totalPrice={totalPrice}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
};
