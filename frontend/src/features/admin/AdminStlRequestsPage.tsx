import { useEffect, useState } from 'react'
import adminService from './adminService'
import type { AdminPrintingRequest } from './adminService'
import { useTranslation } from '../../i18n/useTranslation'
import { Loader2 } from 'lucide-react'

const STATUS_ACTIONS: Record<string, string[]> = {
  REVIEWING: ['QUOTED', 'REJECTED'],
  QUOTED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PRINTING'],
  PRINTING: ['COMPLETED'],
  // COMPLETED, REJECTED → không còn hành động
}

export default function AdminStlRequestsPage() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<AdminPrintingRequest[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchRequests = async (pageNumber = 0) => {
    setLoading(true)
    const data = await adminService.getPrintingRequests(pageNumber, 10)
    setRequests(data.content)
    setTotalPages(data.totalPages)
    setPage(data.number)
    setLoading(false)
  }

 

  useEffect(() => {
    const loadInitialRequests = async () => {
      await fetchRequests(0)
    }

    void loadInitialRequests()
  }, [])

  

  const updateStatus = async (requestId: number, status: string) => {
    await adminService.updatePrintingRequestStatus(requestId, status)
    void fetchRequests(page)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-600">{t('admin.stl.label')}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t('admin.stl.title')}</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">{t('admin.stl.sub')}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-400">{t('admin.stl.empty')}</div>
        ) : (

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-950/80 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3">{t('admin.stl.request')}</th>
                  <th className="px-4 py-3">{t('admin.order.customer')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('admin.stl.quote')}</th>
                  <th className="px-4 py-3">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {requests.map((request) => (
                  <tr key={request.requestId} className="hover:bg-slate-50 dark:hover:bg-slate-900/80">
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{request.fileName}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{request.userName}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{t(`status.${request.modelStatus}`)}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{(request.quoteAmount ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                    <td className="px-4 py-4 space-x-2">
                      {(STATUS_ACTIONS[request.modelStatus] ?? []).length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        (STATUS_ACTIONS[request.modelStatus] ?? []).map((status) => (
                          <button
                            key={`${request.requestId}-${status}`}
                            type="button"
                            className={`rounded-full px-3 py-1 text-xs font-semibold text-white transition ${
                              status === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-700'
                            }`}
                            onClick={() => void updateStatus(request.requestId, status)}
                          >
                            {t(`status.${status}`)}
                          </button>
                        ))
                      )}
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
              onClick={() => void fetchRequests(Math.max(0, page - 1))}
              disabled={page === 0}
            >{t('common.prev')}</button>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => void fetchRequests(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >{t('common.next')}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
