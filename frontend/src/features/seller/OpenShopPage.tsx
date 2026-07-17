import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, Loader2, CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react'
import sellerService from './sellerService'
import type { SellerApplication } from './sellerService'
import useAuthStore from '../../store/authStore'
import { useTranslation } from '../../i18n/useTranslation'

const formatPrice = (p: number) =>
  (p ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

/** OpenShopPage — Trang đăng ký mở sạp: nộp đơn (tên sạp + mô tả) và theo dõi trạng thái duyệt. */
export default function OpenShopPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [application, setApplication] = useState<SellerApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ shopName: '', description: '' })

  const isSeller = user?.role === 'SELLER'

  const load = async () => {
    setLoading(true)
    try {
      const app = await sellerService.getMyApplication()
      setApplication(app)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.shopName.trim().length < 3) {
      setError(t('openshop.errNameShort'))
      return
    }
    setSubmitting(true)
    try {
      const app = await sellerService.apply(form.shopName.trim(), form.description.trim())
      setApplication(app)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || t('openshop.errSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  const renderStatus = () => {
    if (!application) return null
    const fee = application.openingFee > 0 ? formatPrice(application.openingFee) : t('openshop.free')

    if (application.status === 'PENDING') {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-700/40 dark:bg-amber-900/15">
          <div className="flex items-center gap-3">
            <Clock className="text-amber-600" size={24} />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">{t('openshop.pendingTitle')}</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {application.shopName} · {t('openshop.feeLabel')}: {fee}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">{t('openshop.pendingDesc')}</p>
        </div>
      )
    }

    if (application.status === 'APPROVED') {
      return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-700/40 dark:bg-emerald-900/15">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={24} />
            <div>
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">{t('openshop.approvedTitle')}</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{t('openshop.approvedDesc')}</p>
            </div>
          </div>
          <button onClick={() => navigate('/creator')} className="btn-primary mt-4">
            {t('openshop.gotoManage')}
          </button>
        </div>
      )
    }

    // REJECTED
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-700/40 dark:bg-red-900/15">
          <div className="flex items-center gap-3">
            <XCircle className="text-red-600" size={24} />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">{t('openshop.rejectedTitle')}</h3>
              {application.rejectionReason && (
                <p className="text-sm text-red-700 dark:text-red-400">{t('openshop.reasonLabel')}: {application.rejectionReason}</p>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setApplication(null)} className="btn-secondary">
          {t('openshop.resubmit')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="container max-w-2xl">
        <Link to="/account" className="btn-ghost mb-3 inline-flex gap-1.5 text-sm">
          <ArrowLeft size={15} /> {t('openshop.account')}
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('openshop.title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('openshop.subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : isSeller ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-700/40 dark:bg-emerald-900/15">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">{t('openshop.alreadySellerTitle')}</h3>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">{t('openshop.alreadySellerDesc')}</p>
            <button onClick={() => navigate('/creator')} className="btn-primary mt-4">
              {t('openshop.gotoManage')}
            </button>
          </div>
        ) : application && application.status !== 'REJECTED' ? (
          renderStatus()
        ) : (
          <div className="card p-6">
            {/* Benefits / fee info */}
            <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-900/40 dark:bg-brand-900/15">
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">{t('openshop.policyTitle')}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>• {t('openshop.policyFee')}</li>
                <li>• {t('openshop.policyCommission')}</li>
                <li>• {t('openshop.policyApproval')}</li>
              </ul>
            </div>

            {application?.status === 'REJECTED' && renderStatus()}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('openshop.shopNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.shopName}
                  onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                  placeholder={t('openshop.shopNamePlaceholder')}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('openshop.introLabel')}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder={t('openshop.introPlaceholder')}
                  className="input resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
                {t('openshop.submit')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
