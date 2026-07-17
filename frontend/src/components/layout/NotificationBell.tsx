import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Package, Store, Wallet, Printer, BellRing } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { useTranslation } from '../../i18n/useTranslation'
import useNotifications, { sectionOf, type NotificationItem } from '../../hooks/useNotifications'

/** Định dạng thời gian tương đối kiểu "x phút trước". */
function timeAgo(iso: string, t: (k: string) => string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.max(0, Date.now() - then)
  const m = Math.floor(diff / 60000)
  if (m < 1) return t('notif.justNow')
  if (m < 60) return `${m} ${t('notif.minAgo')}`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ${t('notif.hourAgo')}`
  const d = Math.floor(h / 24)
  return `${d} ${t('notif.dayAgo')}`
}

const SECTION_ICON = {
  orders: Package,
  shop: Store,
  wallet: Wallet,
  printing: Printer,
  other: BellRing,
} as const

/** Where to go when a notification is clicked, based on its entity + the role. */
function routeFor(n: NotificationItem, role?: string): { path: string; state?: unknown } {
  const type = (n.relatedEntityType ?? '').toUpperCase()
  if (type === 'ORDER') {
    if (role === 'SELLER') return { path: '/creator', state: { tab: 'orders' } }
    if (role === 'ADMIN') return { path: '/admin/orders' }
    return { path: n.relatedEntityId ? `/orders/${n.relatedEntityId}` : '/orders' }
  }
  if (type === 'WITHDRAWAL') {
    return role === 'ADMIN' ? { path: '/admin/withdrawals' } : { path: '/creator', state: { tab: 'wallet' } }
  }
  if (type === 'SELLER_APPLICATION') {
    return role === 'ADMIN' ? { path: '/admin/seller-applications' } : { path: '/creator' }
  }
  if (type.startsWith('PRINTING')) {
    return role === 'ADMIN' ? { path: '/admin/printing-requests' } : { path: '/account' }
  }
  return { path: '/account' }
}

/**
 * NotificationBell — Chuông thông báo trên navbar: badge số chưa đọc, dropdown danh sách,
 * đánh dấu đã đọc và điều hướng theo loại thông báo.
 */
export default function NotificationBell() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { unreadTotal, list, markRead, markAllRead } = useNotifications()

  const onItemClick = async (n: NotificationItem) => {
    setOpen(false)
    if (!n.isRead) void markRead(n.notificationId)
    const { path, state } = routeFor(n, user?.role)
    navigate(path, state ? { state } : undefined)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost relative flex h-9 w-9 items-center justify-center rounded-xl p-0"
        aria-label={t('notif.title')}
        title={t('notif.title')}
      >
        <Bell size={18} />
        {unreadTotal > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* click-away layer */}
            <button
              type="button"
              aria-hidden
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('notif.title')} {unreadTotal > 0 && <span className="text-rose-500">({unreadTotal})</span>}
                </p>
                {unreadTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <CheckCheck size={13} /> {t('notif.markAll')}
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {list.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-10 text-center">
                    <Bell size={32} className="mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">{t('notif.empty')}</p>
                  </div>
                ) : (
                  list.map((n) => {
                    const Icon = SECTION_ICON[sectionOf(n.relatedEntityType)]
                    return (
                      <button
                        key={n.notificationId}
                        type="button"
                        onClick={() => void onItemClick(n)}
                        className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50 ${
                          n.isRead ? '' : 'bg-brand-50/40 dark:bg-brand-900/10'
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          n.isRead ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300'
                        }`}>
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm ${n.isRead ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white'}`}>
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt, t)}</p>
                        </div>
                        {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                      </button>
                    )
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
