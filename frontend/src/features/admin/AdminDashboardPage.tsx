import { useEffect, useState } from 'react'
import adminService from './adminService'
import type { AdminDashboardOverview, RevenueStats } from './adminService'
import AdminStatCard from './AdminStatCard'
import AdminRevenueChart from './AdminRevenueChart'
import { useTranslation } from '../../i18n/useTranslation'

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null)
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError(false)
      try {
        const [overviewData, statsData] = await Promise.all([
          adminService.getDashboardOverview(),
          adminService.getRevenueStats()
        ])
        setOverview(overviewData)
        setRevenueStats(statsData)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        {t('common.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-600 daek:border-rose-900/50 dark:bg-rose-900/50">
        {t('admin.dash.loadError')}
      </div>
    )
  }

  const revenuePoints = revenueStats?.monthlyRevenue ?? overview?.monthlyRevenue ?? []
  const fmtVnd = (n?: number) => (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-600">{t('admin.dash.label')}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t('admin.dash.title')}</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
            {t('admin.dash.sub')}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label={t('admin.dash.totalUsers')}
            value={overview?.totalUsers ?? 0}
            description={t('admin.dash.totalUsersDesc')}
          />
          <AdminStatCard
            label={t('admin.dash.activeUsers')}
            value={overview?.activeUsers ?? 0}
            description={t('admin.dash.activeUsersDesc')}
          />
          <AdminStatCard
            label={t('admin.dash.totalProducts')}
            value={overview?.totalProducts ?? 0}
            description={t('admin.dash.totalProductsDesc')}
          />
          <AdminStatCard
            label={t('admin.dash.totalOrders')}
            value={overview?.totalOrders ?? 0}
            description={t('admin.dash.totalOrdersDesc')}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <AdminStatCard
            label={t('admin.dash.pendingOrders')}
            value={overview?.pendingOrders ?? 0}
            description={t('admin.dash.pendingOrdersDesc')}
          />
          <AdminStatCard
            label={t('admin.dash.pending')}
            value={overview?.pendingPrintingRequests ?? 0}
            description={t('admin.dash.pendingDesc')}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{t('admin.dash.revTrend')}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{t('admin.dash.last6')}</h3>
            </div>
          </div>

          <div className="mt-6">
            <AdminRevenueChart points={revenuePoints} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{t('admin.dash.revStats')}</p>
          <div className="mt-6 grid gap-4">
            <AdminStatCard
              label={t('admin.dash.totalRev')}
              value={fmtVnd(revenueStats?.totalRevenue)}
              description={t('admin.dash.totalRevDesc')}
            />
            <AdminStatCard
              label={t('admin.dash.aov')}
              value={fmtVnd(revenueStats?.averageOrderValue)}
              description={t('admin.dash.aovDesc')}
            />
            <AdminStatCard
              label={t('admin.dash.orderCount')}
              value={revenueStats?.orderCount ?? 0}
              description={t('admin.dash.orderCountDesc')}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
