import { NavLink } from 'react-router-dom'
import { LayoutGrid, Users, Package, Store, ShoppingCart, Boxes, Wallet } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

export interface AdminSidebarCounts {
  pendingProducts?: number
  pendingSellerApplications?: number
  pendingWithdrawals?: number
  pendingPrintingRequests?: number
}

interface MenuItem {
  key: string
  path: string
  end?: boolean
  icon: typeof LayoutGrid
  badge?: keyof AdminSidebarCounts
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'admin.menu.dashboard', path: '/admin', end: true, icon: LayoutGrid },
  { key: 'admin.menu.users', path: '/admin/users', icon: Users },
  { key: 'admin.menu.products', path: '/admin/products', icon: Package, badge: 'pendingProducts' },
  { key: 'admin.menu.sellerApps', path: '/admin/seller-applications', icon: Store, badge: 'pendingSellerApplications' },
  { key: 'admin.menu.orders', path: '/admin/orders', icon: ShoppingCart },
  { key: 'admin.menu.stl', path: '/admin/stl-requests', icon: Boxes, badge: 'pendingPrintingRequests' },
  { key: 'admin.menu.withdrawals', path: '/admin/withdrawals', icon: Wallet, badge: 'pendingWithdrawals' },
]

interface AdminSidebarProps {
  counts: AdminSidebarCounts | null
  userName?: string
}

/** AdminSidebar — Menu điều hướng khu quản trị: nền tối cố định, badge số lượng chờ duyệt theo mục. */
export default function AdminSidebar({ counts, userName }: AdminSidebarProps) {
  const { t } = useTranslation()

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">P</div>
        <span className="text-sm font-semibold text-white">Print Hub 3D</span>
      </div>

      <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {t('admin.panel')}
      </p>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {MENU_ITEMS.map((item) => {
          const badgeValue = item.badge ? counts?.[item.badge] : undefined
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={17} className="shrink-0" />
              <span className="flex-1 truncate">{t(item.key)}</span>
              {!!badgeValue && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {badgeValue > 9 ? '9+' : badgeValue}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-slate-800 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {userName?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
          <p className="text-xs text-slate-500">{t('admin.roleAdmin')}</p>
        </div>
      </div>
    </aside>
  )
}
