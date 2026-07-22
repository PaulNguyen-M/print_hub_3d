import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Package, ShoppingCart, Wallet, Check, X, Loader2 } from 'lucide-react'
import adminService from './adminService'
import type { AdminDashboardOverview, RevenueStats, AdminProduct, AdminSellerApplication, AdminWithdrawal } from './adminService'
import AdminStatCard from './AdminStatCard'
import AdminRevenueChart from './AdminRevenueChart'
import AdminUserDonutChart from './AdminUserDonutChart'
import { useTranslation } from '../../i18n/useTranslation'

type PendingTab = 'products' | 'sellerApps' | 'withdrawals'

const fmtVnd = (n?: number) => (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')

/** AdminDashboardPage — Tổng quan hệ thống: thẻ số liệu, biểu đồ doanh thu/phân bố người dùng, khối chờ duyệt gộp 3 loại. */
export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null)
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [pendingTab, setPendingTab] = useState<PendingTab>('products')
  const [pendingProducts, setPendingProducts] = useState<AdminProduct[]>([])
  const [pendingApps, setPendingApps] = useState<AdminSellerApplication[]>([])
  const [pendingWithdrawals, setPendingWithdrawals] = useState<AdminWithdrawal[]>([])
  const [actionId, setActionId] = useState<number | null>(null)

  const loadDashboard = async () => {
    setError(false)
    try {
      const [overviewData, statsData] = await Promise.all([
        adminService.getDashboardOverview(),
        adminService.getRevenueStats(),
      ])
      setOverview(overviewData)
      setRevenueStats(statsData)
    } catch {
      setError(true)
    }
  }

  const loadPending = async () => {
    const [products, apps, withdrawals] = await Promise.all([
      adminService.getProducts(0, 5, 'PENDING'),
      adminService.getSellerApplications(0, 5, 'PENDING'),
      adminService.getWithdrawals(0, 5, 'PENDING'),
    ])
    setPendingProducts(products.content)
    setPendingApps(apps.content)
    setPendingWithdrawals(withdrawals.content)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadDashboard(), loadPending()]).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const approveItem = async (tab: PendingTab, id: number) => {
    setActionId(id)
    try {
      if (tab === 'products') await adminService.approveProduct(id)
      else if (tab === 'sellerApps') await adminService.approveSellerApplication(id)
      else await adminService.approveWithdrawal(id)
      await Promise.all([loadPending(), loadDashboard()])
    } finally {
      setActionId(null)
    }
  }

  const rejectItem = async (tab: PendingTab, id: number) => {
    const reason = window.prompt(t('admin.dash.rejectPrompt'), '')
    if (reason === null) return
    setActionId(id)
    try {
      if (tab === 'products') await adminService.rejectProduct(id, reason)
      else if (tab === 'sellerApps') await adminService.rejectSellerApplication(id, reason)
      else await adminService.rejectWithdrawal(id, reason)
      await Promise.all([loadPending(), loadDashboard()])
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        {t('common.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/50">
        {t('admin.dash.loadError')}
      </div>
    )
  }

  const revenuePoints = revenueStats?.monthlyRevenue ?? overview?.monthlyRevenue ?? []

  const PENDING_TABS: { key: PendingTab; labelKey: string; count: number; viewAllPath: string }[] = [
    { key: 'products', labelKey: 'admin.dash.tabProducts', count: overview?.pendingProducts ?? 0, viewAllPath: '/admin/products' },
    { key: 'sellerApps', labelKey: 'admin.dash.tabSellerApps', count: overview?.pendingSellerApplications ?? 0, viewAllPath: '/admin/seller-applications' },
    { key: 'withdrawals', labelKey: 'admin.dash.tabWithdrawals', count: overview?.pendingWithdrawals ?? 0, viewAllPath: '/admin/withdrawals' },
  ]
  const activeTabMeta = PENDING_TABS.find((x) => x.key === pendingTab)!

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-sky-600">{t('admin.dash.label')}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{t('admin.dash.overviewTitle')}</h1>
      </div>

      {/* Thẻ số liệu */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={Users}
          label={t('admin.dash.totalUsers')}
          value={overview?.totalUsers ?? 0}
          description={`${overview?.activeUsers ?? 0} ${t('admin.dash.activeSuffix')}`}
        />
        <AdminStatCard
          icon={Package}
          label={t('admin.dash.totalProducts')}
          value={overview?.totalProducts ?? 0}
          description={`${overview?.pendingProducts ?? 0} ${t('admin.dash.pendingSuffix')}`}
        />
        <AdminStatCard
          icon={ShoppingCart}
          label={t('admin.dash.totalOrders')}
          value={overview?.totalOrders ?? 0}
          description={`${overview?.pendingOrders ?? 0} ${t('admin.dash.pendingConfirmSuffix')}`}
        />
        <AdminStatCard
          icon={Wallet}
          label={t('admin.dash.totalRev')}
          value={fmtVnd(overview?.totalRevenue)}
          description={t('admin.dash.totalRevDesc')}
        />
      </div>

      {/* Biểu đồ */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{t('admin.dash.revTrend')}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{t('admin.dash.last6')}</h3>
          <div className="mt-6">
            <AdminRevenueChart points={revenuePoints} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{t('admin.dash.userDist')}</p>
          <div className="mt-6">
            <AdminUserDonutChart distribution={overview?.roleDistribution ?? {}} />
          </div>
        </div>
      </div>

      {/* Chờ duyệt */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {PENDING_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPendingTab(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  pendingTab === tab.key
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t(tab.labelKey)} ({tab.count})
              </button>
            ))}
          </div>
          <Link to={activeTabMeta.viewAllPath} className="text-sm font-semibold text-brand-600 hover:underline">
            {t('admin.dash.viewAll')} →
          </Link>
        </div>

        <div className="mt-5 space-y-2">
          {pendingTab === 'products' && (
            pendingProducts.length === 0
              ? <p className="py-8 text-center text-sm text-slate-400">{t('admin.dash.pendingEmpty')}</p>
              : pendingProducts.map((p) => (
                <div key={p.productId} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                  <img src={p.thumbnailUrl || 'https://placehold.co/64x64/1e293b/64748b?text=3D'} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.name}</p>
                    <p className="truncate text-xs text-slate-400">{p.sellerName}{p.shopName ? ` · ${p.shopName}` : ''} · {fmtVnd(p.price)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{fmtDate(p.createdAt)}</span>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" disabled={actionId === p.productId} onClick={() => void approveItem('products', p.productId)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {actionId === p.productId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {t('admin.dash.approve')}
                    </button>
                    <button type="button" disabled={actionId === p.productId} onClick={() => void rejectItem('products', p.productId)}
                      className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-900/30 dark:text-rose-300">
                      <X size={12} /> {t('admin.dash.reject')}
                    </button>
                  </div>
                </div>
              ))
          )}

          {pendingTab === 'sellerApps' && (
            pendingApps.length === 0
              ? <p className="py-8 text-center text-sm text-slate-400">{t('admin.dash.pendingEmpty')}</p>
              : pendingApps.map((a) => (
                <div key={a.applicationId} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    {a.shopName?.[0]?.toUpperCase() ?? 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{a.shopName}</p>
                    <p className="truncate text-xs text-slate-400">{a.applicantName} · {a.applicantEmail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{fmtDate(a.createdAt)}</span>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" disabled={actionId === a.applicationId} onClick={() => void approveItem('sellerApps', a.applicationId)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {actionId === a.applicationId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {t('admin.dash.approve')}
                    </button>
                    <button type="button" disabled={actionId === a.applicationId} onClick={() => void rejectItem('sellerApps', a.applicationId)}
                      className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-900/30 dark:text-rose-300">
                      <X size={12} /> {t('admin.dash.reject')}
                    </button>
                  </div>
                </div>
              ))
          )}

          {pendingTab === 'withdrawals' && (
            pendingWithdrawals.length === 0
              ? <p className="py-8 text-center text-sm text-slate-400">{t('admin.dash.pendingEmpty')}</p>
              : pendingWithdrawals.map((w) => (
                <div key={w.withdrawalId} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Wallet size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{fmtVnd(w.amount)}</p>
                    <p className="truncate text-xs text-slate-400">{w.shopName} · {w.ownerName}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{fmtDate(w.createdAt)}</span>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" disabled={actionId === w.withdrawalId} onClick={() => void approveItem('withdrawals', w.withdrawalId)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {actionId === w.withdrawalId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {t('admin.dash.approve')}
                    </button>
                    <button type="button" disabled={actionId === w.withdrawalId} onClick={() => void rejectItem('withdrawals', w.withdrawalId)}
                      className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-900/30 dark:text-rose-300">
                      <X size={12} /> {t('admin.dash.reject')}
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
