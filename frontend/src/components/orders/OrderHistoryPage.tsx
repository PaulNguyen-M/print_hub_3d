import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Package } from 'lucide-react';
import { useOrder } from '../../hooks/useOrder';
import { useTranslation } from '../../i18n/useTranslation';

/** OrderHistoryPage — Danh sách lịch sử đơn của người dùng, bấm vào để xem chi tiết. */
export const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { orders, loading, fetchOrderHistory } = useOrder();

  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  const statusColors: { [key: string]: string } = {
    PENDING: 'bg-gray-100 text-gray-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    PRINTING: 'bg-purple-100 text-purple-800',
    FINISHING: 'bg-indigo-100 text-indigo-800',
    SHIPPING: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t('order.loadingList')}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('order.noneTitle')}</h1>
          <p className="text-gray-600 mb-6">
            {t('order.noneDesc')}
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {t('order.shopNow')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('order.historyTitle')}</h1>

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  {t('order.th.number')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  {t('order.th.date')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  {t('order.th.status')}
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  {t('order.th.items')}
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  {t('order.th.total')}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  {t('order.th.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.orderStatus] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t(`status.${order.orderStatus}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.items.length} {t('order.itemUnit')}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    ${(order.totalAmount * 1.1).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => navigate(`/orders/${order.orderId}`)}
                      className="text-blue-600 hover:text-blue-700 font-medium transition"
                    >
                      {t('order.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
