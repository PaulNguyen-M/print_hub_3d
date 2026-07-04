import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Store, Check, X, Clock, CheckCircle2, XCircle, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import adminService from './adminService'
import type { AdminSellerApplication } from './adminService'
import { useTranslation } from '../../i18n/useTranslation'

const STATUS_FILTERS = [
  { value: 'PENDING', labelKey: 'adminApp.filterPending' },
  { value: '', labelKey: 'adminApp.filterAll' },
  { value: 'APPROVED', labelKey: 'adminApp.filterApproved' },
  { value: 'REJECTED', labelKey: 'adminApp.filterRejected' },
]

const STATUS_META: Record<string, { labelKey: string; badge: string; icon: typeof Clock }> = {
  PENDING:  { labelKey: 'adminApp.filterPending', badge: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock },
  APPROVED: { labelKey: 'adminApp.filterApproved', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
  REJECTED: { labelKey: 'adminApp.filterRejected', badge: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle },
}

export default function AdminSellerApplicationsPage() {
  const { t } = useTranslation()
  const [apps, setApps] = useState<AdminSellerApplication[]>([])
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  const fetchApps = async (pageNumber = 0, status = statusFilter) => {
    setLoading(true)
    const data = await adminService.getSellerApplications(pageNumber, 10, status || undefined)
    setApps(data.content)
    setTotalPages(data.totalPages || 1)
    setPage(data.number)
    setLoading(false)
  }

  useEffect(() => {
    void fetchApps(0, statusFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const approve = async (app: AdminSellerApplication) => {
    setSavingId(app.applicationId)
    try {
      await adminService.approveSellerApplication(app.applicationId)
      await fetchApps(page)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert(msg || t('adminApp.approveFailed'))
    } finally {
      setSavingId(null)
    }
  }

  const reject = async (app: AdminSellerApplication) => {
    const reason = window.prompt(t('adminApp.rejectPrompt'), '')
    if (reason === null) return
    setSavingId(app.applicationId)
    try {
      await adminService.rejectSellerApplication(app.applicationId, reason)
      await fetchApps(page)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert(msg || t('adminApp.rejectFailed'))
    } finally {
      setSavingId(null)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
            <Store size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">{t('adminApp.section')}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('adminApp.title')}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {t('adminApp.subtitle')}
            </p>
          </div>
        </div>

        {/* Status filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                statusFilter === f.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </section>

      {/* List */}
      <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 size={20} className="animate-spin" /> {t('adminApp.loading')}
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Store size={40} className="mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">{t('adminApp.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {apps.map((app, idx) => {
              const meta = STATUS_META[app.status]
              const StatusIcon = meta.icon
              const saving = savingId === app.applicationId
              return (
                <motion.div
                  key={app.applicationId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white">
                      <Store size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{app.shopName}</p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                        {app.applicantName} · {app.applicantEmail}
                      </p>
                      {app.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">{app.description}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">{t('adminApp.sentOn')} {formatDate(app.createdAt)}</p>
                    </div>
                  </div>

                  <div className="lg:w-32">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                      <StatusIcon size={13} /> {t(meta.labelKey)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 lg:w-56">
                    {app.status === 'PENDING' ? (
                      <>
                        <button
                          disabled={saving}
                          onClick={() => void approve(app)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> {t('adminApp.approve')}</>}
                        </button>
                        <button
                          disabled={saving}
                          onClick={() => void reject(app)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/50 dark:bg-transparent"
                        >
                          <X size={15} /> {t('adminApp.reject')}
                        </button>
                      </>
                    ) : app.status === 'REJECTED' && app.rejectionReason ? (
                      <p className="text-xs text-slate-400">{t('adminApp.reason')}: {app.rejectionReason}</p>
                    ) : (
                      <p className="text-xs text-slate-400">{app.shopSlug ? `/shops/${app.shopSlug}` : '—'}</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <p>{t('common.page')} {page + 1} / {totalPages}</p>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 font-medium transition hover:border-sky-400 disabled:opacity-40 dark:border-slate-700"
            onClick={() => void fetchApps(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <ChevronLeft size={15} /> {t('common.prev')}
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 font-medium transition hover:border-sky-400 disabled:opacity-40 dark:border-slate-700"
            onClick={() => void fetchApps(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            {t('common.next')} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
