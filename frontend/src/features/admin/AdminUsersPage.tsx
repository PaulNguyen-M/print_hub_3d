import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Search, ShieldCheck, ChevronLeft, ChevronRight,
  BadgeCheck, Ban, CheckCircle2, Loader2
} from 'lucide-react'
import adminService from './adminService'
import type { AdminUser } from './adminService'
import { useTranslation } from '../../i18n/useTranslation'
import useAuth from '../../hooks/useAuth'

const ROLES = ['ADMIN', 'SELLER', 'BUYER', 'PRINTER_PARTNER']

const ROLE_META: Record<string, { label: string; badge: string; dot: string }> = {
  ADMIN:           { label: 'Admin',   badge: 'bg-rose-50 text-rose-600 border-rose-200',   dot: 'bg-rose-500' },
  SELLER:          { label: 'Seller',  badge: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-500' },
  BUYER:           { label: 'Buyer',   badge: 'bg-sky-50 text-sky-600 border-sky-200',       dot: 'bg-sky-500' },
  PRINTER_PARTNER: { label: 'Printer', badge: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500' },
}

const AVATAR_COLORS = [
  'bg-gradient-to-br from-sky-400 to-blue-600',
  'bg-gradient-to-br from-violet-400 to-purple-600',
  'bg-gradient-to-br from-rose-400 to-pink-600',
  'bg-gradient-to-br from-amber-400 to-orange-600',
  'bg-gradient-to-br from-emerald-400 to-teal-600',
]

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)

  const fetchUsers = async (pageNumber = 0) => {
    setLoading(true)
    const data = await adminService.getUsers(pageNumber, 10)
    setUsers(data.content)
    setTotalPages(data.totalPages)
    setPage(data.number)
    setLoading(false)
  }

  useEffect(() => {
    void fetchUsers(0)
  }, [])

  const toggleActive = async (user: AdminUser) => {
    if (currentUser?.id === user.userId) return
    setSavingId(user.userId)
    await adminService.updateUserStatus(user.userId, !user.active)
    await fetchUsers(page)
    setSavingId(null)
  }

  const changeRole = async (user: AdminUser, role: string) => {
    if (role === user.role) return
    if (currentUser?.id === user.userId) return
    setSavingId(user.userId)
    await adminService.updateUserRole(user.userId, role)
    await fetchUsers(page)
    setSavingId(null)
  }

  const filtered = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const initials = (name: string) =>
    name?.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase() || 'U'

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
              <Users size={26} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">{t('admin.user.label')}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t('admin.user.title')}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {users.length} {t('admin.user.sub')}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.user.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </section>

      {/* User list */}
      <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 size={20} className="animate-spin" /> {t('common.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Users size={40} className="mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">{t('admin.user.notFound')}</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filtered.map((user, idx) => {
              const meta = ROLE_META[user.role] ?? { label: user.role, badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
              const saving = savingId === user.userId
              const isSelf = currentUser?.id === user.userId
              return (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-sky-200 hover:bg-sky-50/40 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-sky-800 dark:hover:bg-slate-800"
                >
                  {/* Avatar + name */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                      {initials(user.fullName)}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
                        {user.verified && <BadgeCheck size={15} className="shrink-0 text-sky-500" />}
                        {isSelf && (
                          <span className="shrink-0 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                            {t('admin.user.you')}
                          </span>
                        )}
                      </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
                        {user.verified && <BadgeCheck size={15} className="shrink-0 text-sky-500" />}
                      </div>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  {/* Role badge + selector */}
                  <div className="flex items-center gap-2 lg:w-64">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <div className="relative flex-1">
                      <ShieldCheck size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={user.role}
                        disabled={saving || isSelf}
                        onChange={(e) => void changeRole(user, e.target.value)}
                        className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs font-medium text-slate-700 outline-none transition hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:w-32">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {user.active ? t('admin.user.activeStatus') : t('admin.user.inactiveStatus')}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="lg:w-36">
                    <button
                      type="button"
                      disabled={saving || isSelf}
                      title={isSelf ? t('admin.user.selfHint') : undefined}
                      onClick={() => void toggleActive(user)}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                        user.active
                          ? 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:bg-transparent dark:hover:bg-rose-900/20'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {saving ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : user.active ? (
                        <><Ban size={15} /> {t('common.disable')}</>
                      ) : (
                        <><CheckCircle2 size={15} /> {t('common.enable')}</>
                      )}
                    </button>
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
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 font-medium transition hover:border-sky-400 hover:text-sky-600 disabled:opacity-40 dark:border-slate-700"
            onClick={() => void fetchUsers(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <ChevronLeft size={15} /> {t('common.prev')}
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 font-medium transition hover:border-sky-400 hover:text-sky-600 disabled:opacity-40 dark:border-slate-700"
            onClick={() => void fetchUsers(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            {t('common.next')} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
