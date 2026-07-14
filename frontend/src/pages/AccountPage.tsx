import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User, Package, Heart, Download, Printer,
  MapPin, Bell, Settings, LogOut, Camera,
  ChevronRight, Edit2, Save, X, Loader2, Store
} from 'lucide-react'
import apiClient from '../api/axios'
import useAuth from '../hooks/useAuth'
import { useTranslation } from '../i18n/useTranslation'
import { useWishlistStore, getWishlist } from '../store/wishlistStore'
import type { WishlistProduct } from '../store/wishlistStore'


interface UserProfile {
  id: number
  fullName: string
  email: string
  phone?: string
  bio?: string
  profileImageUrl?: string
  role: string
  createdAt: string
}

interface Order {
  orderId: number
  orderNumber: string
  orderStatus: string
  totalAmount: number
  createdAt: string
  items?: { quantity: number }[]
}

const STATUS_MAP: Record<string, { color: string }> = {
  PENDING:    { color: 'badge-amber' },
  CONFIRMED:  { color: 'badge-blue' },
  PROCESSING: { color: 'badge-blue' },
  PRINTING:   { color: 'badge-blue' },
  SHIPPING:   { color: 'badge-blue' },
  DELIVERED:  { color: 'badge-green' },
  CANCELLED:  { color: 'badge-red' },
}

const PLACEHOLDER = 'https://placehold.co/400x400/1e293b/64748b?text=3D'
const formatPrice = (p: number) =>
  (p ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })


const NAV_ITEMS = [
  { id: 'profile',   key: 'account.nav.profile',   icon: User },
  { id: 'orders',    key: 'account.nav.orders',    icon: Package },
  { id: 'wishlist',  key: 'account.nav.wishlist',  icon: Heart },
  { id: 'downloads', key: 'account.nav.downloads', icon: Download },
  { id: 'printing',  key: 'account.nav.printing',  icon: Printer },
  { id: 'addresses', key: 'account.nav.addresses', icon: MapPin },
  { id: 'notifs',    key: 'account.nav.notifs',    icon: Bell },
  { id: 'settings',  key: 'account.nav.settings',  icon: Settings },
]

export default function AccountPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', bio: '' })
  const [avatarUploading, setAvatarUploading] = useState(false)
  const { user, clearSession } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiClient.get('/users/me')
      return res.data.data
    },
  })

  // TanStack Query v5 removed `onSuccess`; sync the edit form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({ fullName: profile.fullName, phone: profile.phone ?? '', bio: profile.bio ?? '' })
    }
  }, [profile])

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await apiClient.get('/orders?size=20')
      return res.data.data?.content ?? []
    },
    enabled: tab === 'orders',
  })

  const toggleWish = useWishlistStore((s) => s.toggle)
  const { data: wishlist, isLoading: wishlistLoading } = useQuery<WishlistProduct[]>({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: tab === 'wishlist',
  })


  const updateProfile = useMutation({
    mutationFn: (payload: Record<string, string>) => apiClient.put('/users/profile', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); setEditing(false) },
  })

  const handleAvatarPick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setAvatarUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await apiClient.post('/images/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const url = res.data.data.url as string
        updateProfile.mutate({ profileImageUrl: url })
      } finally {
        setAvatarUploading(false)
      }
    }
    input.click()
  }

  const handleLogout = () => { clearSession(); navigate('/auth/login') }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const formatPrice = (p?: number) =>
    (p ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('account.title')}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{t('account.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="card p-4 space-y-1">
              {/* Avatar */}
              <div className="mb-4 flex flex-col items-center text-center p-2">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-3xl font-bold text-white shadow-glow">
                    {profile?.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt="avatar"
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      profile?.fullName?.[0]?.toUpperCase() ?? user?.fullName?.[0]?.toUpperCase() ?? 'U'
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAvatarPick}
                    disabled={avatarUploading || updateProfile.isPending}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 transition hover:bg-brand-100 disabled:opacity-60 dark:border-slate-900 dark:bg-slate-700"
                    title={t('account.changeAvatar')}
                  >
                    {avatarUploading || updateProfile.isPending
                      ? <Loader2 size={13} className="animate-spin text-slate-600 dark:text-slate-300" />
                      : <Camera size={13} className="text-slate-600 dark:text-slate-300" />}
                  </button>
                </div>
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                  {profile?.fullName ?? user?.fullName}
                </p>
                <p className="text-xs text-slate-400">{profile?.email ?? user?.email}</p>
                <span className="mt-2 badge badge-blue">{profile?.role ?? user?.role}</span>
              </div>

              {NAV_ITEMS.map(({ id, key, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    tab === id
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} /> {t(key)}
                  {tab === id && <ChevronRight size={14} className="ml-auto" />}
                </button>
              ))}

              {/* Seller entry point */}
              {(profile?.role ?? user?.role) === 'SELLER' ? (
                <Link
                  to="/creator"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  <Store size={16} /> {t('account.manageShop')}
                </Link>
              ) : (
                <Link
                  to="/seller/apply"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                >
                  <Store size={16} /> {t('account.openShop')}
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={16} /> {t('account.logout')}
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* ── Profile ── */}
                {tab === 'profile' && (
                  <div className="card p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('account.profile.title')}</h2>
                      {!editing ? (
                        <button type="button" onClick={() => setEditing(true)} className="btn-secondary gap-2">
                          <Edit2 size={14} /> {t('account.edit')}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
                            <X size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateProfile.mutate(form)}
                            disabled={updateProfile.isPending}
                            className="btn-primary gap-2"
                          >
                            {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {t('account.save')}
                          </button>
                        </div>
                      )}
                    </div>

                    {profileLoading ? (
                      <div className="space-y-4 animate-pulse">
                        {[1,2,3,4].map(i => (
                          <div key={i}>
                            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
                            <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('account.fullName')}
                          </label>
                          {editing ? (
                            <input
                              value={form.fullName}
                              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                              className="input"
                            />
                          ) : (
                            <p className="input bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                              {profile?.fullName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('account.email')}
                          </label>
                          <p className="input bg-slate-50 dark:bg-slate-800 text-slate-400">{profile?.email}</p>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('account.phone')}
                          </label>
                          {editing ? (
                            <input
                              value={form.phone}
                              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                              placeholder="0901234567"
                              className="input"
                            />
                          ) : (
                            <p className="input bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                              {profile?.phone || <span className="text-slate-400">{t('account.notUpdated')}</span>}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('account.role')}
                          </label>
                          <p className="input bg-slate-50 dark:bg-slate-800 text-slate-400">{profile?.role}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('account.bio')}
                          </label>
                          {editing ? (
                            <textarea
                              value={form.bio}
                              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                              rows={3}
                              placeholder={t('account.bioPlaceholder')}
                              className="input resize-none"
                            />
                          ) : (
                            <p className="input min-h-[80px] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                              {profile?.bio || <span className="text-slate-400">{t('account.noBio')}</span>}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t('account.joinDate')}
                          </label>
                          <p className="input bg-slate-50 dark:bg-slate-800 text-slate-400">
                            {profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Orders ── */}
                {tab === 'orders' && (
                  <div className="card p-6">
                    <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{t('account.orderHistory')}</h2>
                    {ordersLoading ? (
                      <div className="space-y-3 animate-pulse">
                        {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
                      </div>
                    ) : !orders?.length ? (
                      <div className="flex flex-col items-center py-12 text-center">
                        <Package size={40} className="mb-3 text-slate-300" />
                        <p className="font-semibold text-slate-500">{t('account.noOrders')}</p>
                        <Link to="/marketplace" className="btn-primary mt-4">{t('account.shopNow')}</Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map(order => {
                          const st = STATUS_MAP[order.orderStatus] ?? { color: 'badge-slate' }
                          const itemCount = order.items?.reduce((sum, it) => sum + (it.quantity ?? 0), 0) ?? 0
                          return (
                            <Link
                              key={order.orderId}
                              to={`/orders/${order.orderId}`}
                              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-brand-700"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {t('account.order')} #{order.orderNumber ?? order.orderId}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {itemCount} {t('account.productCount')} · {formatDate(order.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`badge ${st.color}`}>{t(`status.${order.orderStatus}`)}</span>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                  {formatPrice(order.totalAmount)}
                                </p>
                                <ChevronRight size={16} className="text-slate-400" />
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Wishlist ── */}
                {tab === 'wishlist' && (
                  <div className="card p-6">
                    <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{t('account.wishlistTitle')}</h2>
                    {wishlistLoading ? (
                      <div className="flex justify-center py-12 text-slate-400"><Loader2 className="animate-spin" /></div>
                    ) : !wishlist?.length ? (
                      <div className="flex flex-col items-center py-12 text-center">
                        <Heart size={40} className="mb-3 text-slate-300" />
                        <p className="font-semibold text-slate-500">{t('account.noWishlist')}</p>
                        <Link to="/marketplace" className="btn-primary mt-4">{t('account.exploreMarket')}</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {wishlist.map((p) => (
                          <div
                            key={p.id}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-card dark:border-slate-800 dark:bg-slate-900"
                          >
                            <button
                              type="button"
                              onClick={async () => {
                                await toggleWish(p.id)
                                qc.invalidateQueries({ queryKey: ['wishlist'] })
                              }}
                              title={t('account.removeWish')}
                              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 dark:bg-slate-800/90"
                            >
                              <Heart size={15} className="fill-rose-500 text-rose-500" />
                            </button>
                            <Link to={`/products/${p.id}`} className="block">
                              <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <img
                                  src={p.thumbnailUrl || PLACEHOLDER}
                                  alt={p.title}
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                                />
                              </div>
                              <div className="p-3">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
                                <p className="mt-1 text-sm font-bold text-brand-600">{formatPrice(p.price)}</p>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}


                {/* ── Downloads ── */}
                {tab === 'downloads' && (
                  <div className="card p-6">
                    <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{t('account.downloadsTitle')}</h2>
                    <div className="flex flex-col items-center py-12 text-center">
                      <Download size={40} className="mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-500">{t('account.noDownloads')}</p>
                      <Link to="/marketplace?type=digital" className="btn-primary mt-4">{t('account.buyDigital')}</Link>
                    </div>
                  </div>
                )}

                {/* ── Printing requests ── */}
                {tab === 'printing' && (
                  <div className="card p-6">
                    <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{t('account.printingTitle')}</h2>
                    <div className="flex flex-col items-center py-12 text-center">
                      <Printer size={40} className="mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-500">{t('account.noPrinting')}</p>
                      <Link to="/printing-service" className="btn-primary mt-4">{t('account.orderNow')}</Link>
                    </div>
                  </div>
                )}

                {/* ── Addresses ── */}
                {tab === 'addresses' && (
                  <div className="card p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('account.addressTitle')}</h2>
                      <button type="button" className="btn-primary gap-2 text-sm">
                        {t('account.addAddress')}
                      </button>
                    </div>
                    <div className="flex flex-col items-center py-12 text-center">
                      <MapPin size={40} className="mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-500">{t('account.noAddress')}</p>
                    </div>
                  </div>
                )}

                {/* ── Notifications ── */}
                {tab === 'notifs' && (
                  <div className="card p-6">
                    <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{t('account.notifsTitle')}</h2>
                    <div className="flex flex-col items-center py-12 text-center">
                      <Bell size={40} className="mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-500">{t('account.noNotifs')}</p>
                    </div>
                  </div>
                )}

                {/* ── Settings ── */}
                {tab === 'settings' && (
                  <div className="card p-6">
                    <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{t('account.settingsTitle')}</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('account.changePw')}</p>
                          <p className="text-xs text-slate-400">{t('account.changePwDesc')}</p>
                        </div>
                        <button type="button" className="btn-secondary text-sm">{t('account.change')}</button>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('account.emailNotif')}</p>
                          <p className="text-xs text-slate-400">{t('account.emailNotifDesc')}</p>
                        </div>
                        <div className="h-6 w-11 rounded-full bg-brand-600 cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/50 p-4 dark:border-red-800/40 dark:bg-red-900/10">
                        <div>
                          <p className="text-sm font-semibold text-red-600">{t('account.deleteAcc')}</p>
                          <p className="text-xs text-red-400">{t('account.deleteAccDesc')}</p>
                        </div>
                        <button type="button" className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">
                          {t('account.delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
