import { useEffect, useState } from 'react'
import adminService from './adminService'
import type { AdminWithdrawal } from './adminService'
import { useTranslation } from '../../i18n/useTranslation'
import { Wallet, Check, X, Loader2, Landmark } from 'lucide-react'

const STATUS_TABS: Array<{ value: string; key: string }> = [
  { value: 'PENDING', key: 'admin.wd.tab.pending' },
  { value: 'PAID', key: 'admin.wd.tab.paid' },
  { value: 'REJECTED', key: 'admin.wd.tab.rejected' },
  { value: '', key: 'admin.wd.tab.all' },
]

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

/** AdminWithdrawalsPage — Duyệt yêu cầu rút tiền của người bán: lọc trạng thái, duyệt/từ chối. */
export default function AdminWithdrawalsPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('PENDING')
  const [rows, setRows] = useState<AdminWithdrawal[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const fmt = (n: number) => (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  const load = async (pageNumber = 0, st = status) => {
    setLoading(true)
    try {
      const data = await adminService.getWithdrawals(pageNumber, 10, st || undefined)
      setRows(data.content)
      setTotalPages(data.totalPages)
      setPage(data.number)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(0, status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const approve = async (w: AdminWithdrawal) => {
    if (!window.confirm(t('admin.wd.confirmApprove'))) return
    setBusyId(w.withdrawalId)
    try {
      await adminService.approveWithdrawal(w.withdrawalId)
      await load(page, status)
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('admin.wd.failed'))
    } finally {
      setBusyId(null)
    }
  }

  const reject = async (w: AdminWithdrawal) => {
    const reason = window.prompt(t('admin.wd.rejectReason'), '')
    if (reason === null) return
    setBusyId(w.withdrawalId)
    try {
      await adminService.rejectWithdrawal(w.withdrawalId, reason)
      await load(page, status)
    } catch (err) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('admin.wd.failed'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-600">{t('admin.wd.label')}</p>
        <h2 className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Wallet size={26} className="text-sky-600" /> {t('admin.wd.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{t('admin.wd.sub')}</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        {/* Status tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                status === tab.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t(tab.key)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">{t('common.loading')}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <Wallet size={40} className="mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">{t('admin.wd.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-950/80 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3">{t('admin.wd.shop')}</th>
                  <th className="px-4 py-3">{t('admin.wd.amount')}</th>
                  <th className="px-4 py-3">{t('admin.wd.bank')}</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('admin.wd.date')}</th>
                  <th className="px-4 py-3">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rows.map((w) => (
                  <tr key={w.withdrawalId} className="hover:bg-slate-50 dark:hover:bg-slate-900/80">
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{w.shopName}</p>
                      <p className="text-xs text-slate-400">{w.ownerName}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">{fmt(w.amount)}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {w.bankName || w.bankAccountNumber ? (
                        <div className="flex items-start gap-1.5">
                          <Landmark size={14} className="mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p>{w.bankName || '—'}</p>
                            <p className="text-xs text-slate-400">{w.bankAccountNumber} · {w.bankAccountName}</p>
                          </div>
                        </div>
                      ) : '—'}
                      {w.note && <p className="mt-1 text-xs italic text-slate-400">“{w.note}”</p>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[w.status] ?? ''}`}>
                        {t(`admin.wd.status.${w.status}`)}
                      </span>
                      {w.status === 'REJECTED' && w.rejectionReason && (
                        <p className="mt-1 text-xs text-rose-500">{w.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {new Date(w.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-4">
                      {w.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void approve(w)}
                            disabled={busyId === w.withdrawalId}
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {busyId === w.withdrawalId ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            {t('admin.wd.approve')}
                          </button>
                          <button
                            type="button"
                            onClick={() => void reject(w)}
                            disabled={busyId === w.withdrawalId}
                            className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-900/30"
                          >
                            <X size={13} /> {t('admin.wd.reject')}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
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
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => void load(Math.max(0, page - 1), status)}
              disabled={page === 0}
            >{t('common.prev')}</button>
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => void load(Math.min(totalPages - 1, page + 1), status)}
              disabled={page >= totalPages - 1}
            >{t('common.next')}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
