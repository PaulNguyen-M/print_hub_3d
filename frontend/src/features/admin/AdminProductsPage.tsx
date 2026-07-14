import { useEffect, useRef, useState } from 'react'
import adminService from './adminService'
import type { AdminProduct } from './adminService'
import { useTranslation } from '../../i18n/useTranslation'
import { Check, X, Clock, AlertCircle, Loader2 } from 'lucide-react'

const STATUS_TABS = [
  { key: 'PENDING', labelKey: 'admin.prod.tabPending' },
  { key: 'ACTIVE',  labelKey: 'admin.prod.tabActive'  },
  { key: 'REJECTED', labelKey: 'admin.prod.tabRejected' },
] as const

type StatusTab = typeof STATUS_TABS[number]['key']

const PLACEHOLDER = 'https://placehold.co/64x64/1e293b/64748b?text=3D'

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  if (status === 'ACTIVE')
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><Check size={11} />{t('admin.prod.approved')}</span>
  if (status === 'REJECTED')
    return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"><X size={11} />{t('admin.prod.rejected')}</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Clock size={11} />{t('admin.prod.pending')}</span>
}

export default function AdminProductsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<StatusTab>('PENDING')
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<AdminProduct | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const rejectInputRef = useRef<HTMLTextAreaElement>(null)

  const fetchProducts = async (p = 0, statusFilter: StatusTab = tab) => {
    setLoading(true)
    try {
      const data = await adminService.getProducts(p, 10, statusFilter)
      setProducts(data.content)
      setTotalPages(data.totalPages)
      setPage(data.number)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchProducts(0, tab) }, [tab])

  const handleApprove = async (product: AdminProduct) => {
    setActionId(product.productId)
    try {
      await adminService.approveProduct(product.productId)
      void fetchProducts(page)
    } finally {
      setActionId(null)
    }
  }

  const openRejectModal = (product: AdminProduct) => {
    setRejectTarget(product)
    setRejectReason('')
    setTimeout(() => rejectInputRef.current?.focus(), 50)
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setActionId(rejectTarget.productId)
    try {
      await adminService.rejectProduct(rejectTarget.productId, rejectReason.trim())
      setRejectTarget(null)
      void fetchProducts(page)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-600">{t('admin.prod.label')}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t('admin.prod.title')}</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">{t('admin.prod.sub')}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        {/* Status tabs */}
        <div className="mb-5 flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {STATUS_TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative px-4 pb-3 pt-1 text-sm font-semibold transition-colors ${
                tab === key
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t(labelKey)}
              {tab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-400">{t('admin.prod.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-950/80 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3">{t('admin.prod.product')}</th>
                  <th className="px-4 py-3">{t('admin.prod.seller')}</th>
                  <th className="px-4 py-3">{t('common.price')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {products.map((product) => (
                  <tr key={product.productId} className="hover:bg-slate-50 dark:hover:bg-slate-900/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.thumbnailUrl || PLACEHOLDER}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover bg-slate-100"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                        />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{product.name}</p>
                          {product.shopName && <p className="text-xs text-slate-400">{product.shopName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <p>{product.sellerName}</p>
                      {product.sellerEmail && <p className="text-xs text-slate-400">{product.sellerEmail}</p>}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {(product.price ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={product.status} />
                      {product.rejectionReason && (
                        <p className="mt-1 flex items-start gap-1 text-xs text-rose-500">
                          <AlertCircle size={11} className="mt-0.5 shrink-0" />
                          {product.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {product.status !== 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={actionId === product.productId}
                            onClick={() => void handleApprove(product)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {actionId === product.productId
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Check size={12} />}
                            {t('admin.prod.approve')}
                          </button>
                        )}
                        {product.status !== 'REJECTED' && (
                          <button
                            type="button"
                            disabled={actionId === product.productId}
                            onClick={() => openRejectModal(product)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            <X size={12} /> {t('admin.prod.reject')}
                          </button>
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
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => void fetchProducts(Math.max(0, page - 1))}
              disabled={page === 0}
            >{t('common.prev')}</button>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => void fetchProducts(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >{t('common.next')}</button>
          </div>
        </div>
      </section>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
              {t('admin.prod.rejectModal.title')}
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              <span className="font-medium text-slate-700 dark:text-slate-300">{rejectTarget.name}</span>
              {' — '}{t('admin.prod.rejectModal.sub')}
            </p>
            <textarea
              ref={rejectInputRef}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder={t('admin.prod.rejectModal.placeholder')}
              className="input w-full resize-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={actionId === rejectTarget.productId}
                onClick={() => void handleReject()}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {actionId === rejectTarget.productId && <Loader2 size={14} className="animate-spin" />}
                {t('admin.prod.rejectModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
