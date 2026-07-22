import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Globe, LogOut, Search } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import useAuth from '../../hooks/useAuth'
import NotificationBell from '../../components/layout/NotificationBell'
import AdminSidebar, { type AdminSidebarCounts } from './AdminSidebar'
import adminService from './adminService'

/** AdminLayout — Bố cục khu quản trị: sidebar tối cố định + thanh trên (tìm kiếm, thông báo, tài khoản) + nội dung. */
export default function AdminLayout() {
  const { t } = useTranslation()
  const { user, clearSession } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState<AdminSidebarCounts | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminService.getDashboardOverview()
      .then((d) => setCounts({
        pendingProducts: d.pendingProducts,
        pendingSellerApplications: d.pendingSellerApplications,
        pendingWithdrawals: d.pendingWithdrawals,
        pendingPrintingRequests: d.pendingPrintingRequests,
      }))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    clearSession()
    navigate('/auth/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/admin/users?search=${encodeURIComponent(q)}` : '/admin/users')
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AdminSidebar counts={counts} userName={user?.fullName} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
          <form onSubmit={handleSearch} className="relative max-w-sm flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.searchUsers')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:flex dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Globe size={15} /> {t('admin.backToSite')}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40"
            >
              <LogOut size={15} /> <span className="hidden sm:inline">{t('admin.logout')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
