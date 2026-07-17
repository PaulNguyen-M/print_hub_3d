import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useOrder } from '../../hooks/useOrder';
import { OrderTimeline } from './OrderTimeline';
import { useTranslation } from '../../i18n/useTranslation';
import { Store } from 'lucide-react'

/** OrderDetailPage — Chi tiết một đơn: thông tin, danh sách món, timeline trạng thái. */
export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentOrder, loading, fetchOrder } = useOrder();

  useEffect(() => {
    if (orderId) {
      fetchOrder(Number(orderId));
    }
  }, [orderId, fetchOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t('order.loadingDetail')}</p>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('order.notFound')}</p>
          <button
            onClick={() => navigate('/orders')}
            className="text-blue-600 hover:underline"
          >
            {t('order.backToOrders')}
          </button>
        </div>
      </div>
    );
  }

  const statusColors: { [key: string]: string } = {
    PENDING: 'bg-gray-100 text-gray-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    PRINTING: 'bg-purple-100 text-purple-800',
    FINISHING: 'bg-indigo-100 text-indigo-800',
    SHIPPING: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

    /** Nhãn hiển thị cho trạng thái xử lý theo sạp — dùng chung key i18n với trang seller/admin. */
  const FF_LABEL: Record<string, string> = {
    PENDING: t('ff.pending'),
    CONFIRMED: t('ff.confirmed'),
    PRINTING: t('ff.printing'),
    FINISHING: t('ff.finishing'),
    SHIPPING: t('ff.shipping'),
    DELIVERED: t('ff.delivered'),
    AWAITING_APPROVAL: t('ff.awaiting'),
    COMPLETED: t('ff.completed'),
  };

  // Gom các món theo sạp để hiện tiến trình riêng cho từng sạp trong đơn
  const itemsByShop = (currentOrder.items ?? []).reduce<Record<string, { shopName: string; fulfillmentStatus: string; items: typeof currentOrder.items }>>(
    (acc, item) => {
      const key = String(item.shopId ?? 'other');
      if (!acc[key]) {
        acc[key] = { shopName: item.shopName ?? t('order.otherItems'), fulfillmentStatus: item.fulfillmentStatus ?? 'PENDING', items: [] };
      }
      acc[key].items.push(item);
      return acc;
    },
    {}
  );


  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('order.orderLabel')} {currentOrder.orderNumber}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('order.placedOn')} {format(new Date(currentOrder.createdAt), 'dd/MM/yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Order Status & Info */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('order.status')}</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">{t('order.currentStatus')}</p>
              <span
                className={`inline-block px-4 py-2 rounded-full font-medium text-sm ${
                  statusColors[currentOrder.orderStatus] ||
                  'bg-gray-100 text-gray-700'
                }`}
              >
                {t(`status.${currentOrder.orderStatus}`)}
              </span>
            </div>

            {currentOrder.estimatedDelivery && (
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('order.estDelivery')}</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(currentOrder.estimatedDelivery), 'dd/MM/yyyy')}
                </p>
              </div>
            )}

            {currentOrder.deliveredAt && (
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('order.deliveredOn')}</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(currentOrder.deliveredAt), 'dd/MM/yyyy')}
                </p>
              </div>
            )}

            {currentOrder.trackingNumber && (
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('order.trackingNo')}</p>
                <p className="font-mono text-gray-900 font-medium">
                  {currentOrder.trackingNumber}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('order.shippingTo')}</h2>

          <div className="text-gray-700 space-y-1">
            <p>{currentOrder.shippingAddress}</p>
            <p>
              {currentOrder.shippingCity}
              {currentOrder.shippingStateProvince && `, ${currentOrder.shippingStateProvince}`}
            </p>
            <p>
              {currentOrder.shippingPostalCode} {currentOrder.shippingCountry}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-1">{t('order.shippingMethod')}</p>
            <p className="font-medium text-gray-900">{currentOrder.shippingMethod}</p>
          </div>
        </div>

        {/* Order Total */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('order.orderTotal')}</h2>

          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>{t('order.subtotal')}</span>
              <span>${currentOrder.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>{t('order.shipping')}</span>
              <span>{t('order.free')}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>{t('order.tax')}</span>
              <span>${(currentOrder.totalAmount * 0.1).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>{t('order.total')}</span>
              <span>
                ${(currentOrder.totalAmount * 1.1).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiến trình xử lý theo từng sạp */}
      {Object.keys(itemsByShop).length > 0 && (
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('order.shopProgress')}</h2>
          <div className="space-y-3">
            {Object.entries(itemsByShop).map(([shopId, group]) => (
              <div key={shopId} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Store size={16} className="shrink-0 text-gray-400" />
                  <span className="truncate font-medium text-gray-900">{group.shopName}</span>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {FF_LABEL[group.fulfillmentStatus] ?? group.fulfillmentStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('order.items')}</h2>

        <div className="space-y-4">
          {currentOrder.items && currentOrder.items.length > 0 ? (
            currentOrder.items.map((item) => (
              <div
                key={item.orderItemId}
                className="flex items-center gap-4 pb-4 border-b last:border-b-0"
              >
                {item.productImage && (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-grow">
                  <h3 className="font-medium text-gray-900">{item.productName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('order.quantity')}: {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${item.subtotal.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${item.unitPrice.toFixed(2)} {t('order.each')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">{t('order.noItems')}</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {currentOrder.timeline && currentOrder.timeline.length > 0 && (
        <OrderTimeline timeline={currentOrder.timeline} />
      )}
    </div>
  );
};
