import { useEffect, useState } from 'react'
import adminService from './adminService'
import type { AdminOrder } from './adminService'
import { useTranslation } from '../../i18n/useTranslation'

export default function AdminOrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchOrders = async (pageNumber = 0) => {
    setLoading(true)
    const data = await adminService.getOrders(pageNumber, 10)
    setOrders(data.content)
    setTotalPages(data.totalPages)
    setPage(data.number)
    setLoading(false)
  }

  useEffect(() => {
    const loadInitialOrders = async () => {
      await fetchOrders(0)
    }

    void loadInitialOrders()
  }, [])

  const [busyId, setBusyId] = useState<number | null>(null)

  const confirmOrder = async (order: AdminOrder) => {
    setBusyId(order.orderId)
    try {
      await adminService.confirmOrder(order.orderId)
      await fetchOrders(page)
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('admin.order.actionFailed'))
    } finally {
      setBusyId(null)
    }
  }

  const completeOrder = async (order: AdminOrder) => {
    setBusyId(order.orderId)
    try {
      await adminService.completeOrder(order.orderId)
      await fetchOrders(page)
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('admin.order.actionFailed'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-600">{t('admin.order.label')}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t('admin.order.title')}</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">{t('admin.order.sub')}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        {loading ? (
          <div>{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-950/80 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3">{t('admin.order.order')}</th>
                  <th className="px-4 py-3">{t('admin.order.customer')}</th>
                  <th className="px-4 py-3">{t('admin.order.amount')}</th>
                  <th className="px-4 py-3">{t('co.paymentMethod')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('admin.order.tracking')}</th>
                  <th className="px-4 py-3">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-900/80">
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{order.orderNumber}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{order.customerName}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{(order.totalAmount ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {order.paymentMethod === 'MOMO' ? 'MoMo'
                        : order.paymentMethod === 'CASH' ? t('co.pay.cash')
                        : order.paymentMethod === 'BANK_TRANSFER' ? t('co.pay.bank')
                        : '—'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{t(`status.${order.orderStatus}`)}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{order.trackingNumber || '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(order.orderStatus === 'PROCESSING' || order.orderStatus === 'PENDING') && (
                          <button
                            type="button"
                            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                            onClick={() => void confirmOrder(order)}
                            disabled={busyId === order.orderId}
                          >
                            {t('admin.order.confirm')}
                          </button>
                        )}
                        {order.orderStatus === 'CONFIRMED' && (
                          <button
                            type="button"
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            onClick={() => void completeOrder(order)}
                            disabled={busyId === order.orderId}
                          >
                            {t('admin.order.complete')}
                          </button>
                        )}
                        {order.orderStatus === 'COMPLETED' && (
                          <span className="text-xs font-medium text-emerald-600">{t('admin.order.doneNote')}</span>
                        )}
                        {(order.orderStatus === 'CANCELLED') && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <p>{t('common.page')} {page + 1} {t('common.of')} {totalPages}</p>
          <div className="flex gap-2">
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => void fetchOrders(Math.max(0, page - 1))}
              disabled={page === 0}
            >{t('common.prev')}</button>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => void fetchOrders(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >{t('common.next')}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
