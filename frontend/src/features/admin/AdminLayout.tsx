import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { Globe, LogOut } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import useAuth from '../../hooks/useAuth'

const menuItems = [
  { key: 'admin.menu.dashboard', path: '/admin', end: true },
  { key: 'admin.menu.products', path: '/admin/products' },
  { key: 'admin.menu.orders', path: '/admin/orders' },
  { key: 'admin.menu.users', path: '/admin/users' },
  { key: 'admin.menu.sellerApps', path: '/admin/seller-applications' },
  { key: 'admin.menu.stl', path: '/admin/stl-requests' }
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const { user, clearSession } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearSession()
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 px-6 py-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-600">{t('admin.panel')}</p>
            <h1 className="text-xl font-semibold tracking-tight">{t('admin.title')}</h1>
          </div>
          {/* Right cluster: back to site + account + logout */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:flex dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Globe size={15} /> {t('admin.backToSite')}
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{user?.fullName}</p>
              <p className="text-xs text-slate-400">{t('admin.roleAdmin')}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40"
            >
              <LogOut size={15} /> <span className="hidden sm:inline">{t('admin.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{t('admin.nav')}</p>
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
