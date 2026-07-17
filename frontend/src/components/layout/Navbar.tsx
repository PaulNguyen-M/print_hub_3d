import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, User, Menu, X, Sun, Moon,
  Package, Printer, LayoutDashboard, LogOut,
  ChevronDown, Box, Store, MessageCircle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import useAuth from '../../hooks/useAuth'
import useThemeStore from '../../store/themeStore'
import { useCartStore } from '../../store/cartStore'
import { useChatStore } from '../../store/chatStore'
import { useTranslation } from '../../i18n/useTranslation'
import apiClient from '../../api/axios'
import LanguageToggle from '../ui/LanguageToggle'
import NotificationBell from './NotificationBell'
import useNotifications from '../../hooks/useNotifications'

/**
 * Navbar — Thanh điều hướng trên cùng: menu theo vai trò, giỏ hàng, chuông thông báo,
 * chat, đổi ngôn ngữ/giao diện và menu tài khoản (hỗ trợ mobile).
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isAuthenticated, clearSession } = useAuth()
  const { mode, toggleMode } = useThemeStore()
  const { t } = useTranslation()
  const cartCount = useCartStore((s) => s.cart?.items?.length ?? 0)
  const toggleChat = useChatStore((s) => s.toggle)
  const { unreadTotal, counts } = useNotifications()

  // Số thông báo chưa đọc hiển thị cạnh từng mục menu (theo vai trò).
  const ordersBadge = user?.role === 'SELLER' ? 0 : counts.orders
  const shopBadge = counts.orders + counts.wallet + counts.shop // gộp cho "Quản lý sạp"
  const adminBadge = counts.orders + counts.shop + counts.wallet

  const CountBadge = ({ n }: { n: number }) =>
    n > 0 ? (
      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
        {n > 99 ? '99+' : n}
      </span>
    ) : null

  // Lấy avatar mới nhất từ server (dùng chung cache với trang Tài khoản)
  const { data: profile } = useQuery<{ profileImageUrl?: string }>({
    queryKey: ['profile'],
    queryFn: async () => (await apiClient.get('/users/me')).data.data,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
  const avatarUrl = profile?.profileImageUrl ?? user?.profileImageUrl
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    clearSession()
    navigate('/auth/login')
  }

  const navLinks = [
    { to: '/marketplace', label: t('nav.marketplace'), icon: Box },
    { to: '/printing-service', label: t('nav.printing'), icon: Printer },
    { to: '/orders', label: t('nav.orders'), icon: Package },
  ]

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 shadow-card backdrop-blur-xl dark:bg-slate-900/90'
          : 'bg-transparent'
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 shadow-glow">
            <Box size={16} className="text-white" />
          </div>
          <span className="text-gradient hidden sm:block">Print Hub 3D</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`btn-ghost text-sm ${
                location.pathname.startsWith(to)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : ''
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleMode}
            className="btn-ghost hidden sm:flex h-9 w-9 items-center justify-center rounded-xl p-0"
            aria-label="Toggle theme"
          >
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          {isAuthenticated && <NotificationBell />}

          {/* Chat */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={toggleChat}
              className="btn-ghost h-9 w-9 items-center justify-center rounded-xl p-0 flex"
              aria-label="Messages"
              title={t('chat.title')}
            >
              <MessageCircle size={18} />
            </button>
          )}

          {/* Cart */}
          <Link to="/cart" className="btn-ghost relative h-9 w-9 items-center justify-center rounded-xl p-0 flex">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* User menu / Auth */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="btn-ghost relative flex h-9 items-center gap-1.5 rounded-xl px-2"
              >
                <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-xs font-bold text-white">
                  <span>{user?.fullName?.[0]?.toUpperCase() ?? 'U'}</span>
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                {unreadTotal > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {unreadTotal > 9 ? '9+' : unreadTotal}
                  </span>
                )}
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-soft dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="mb-1.5 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.fullName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <Link to="/account" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <User size={15} /> {t('nav.account')}
                    </Link>
                    <Link to="/orders" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <Package size={15} /> {t('nav.orders')} <CountBadge n={ordersBadge} />
                    </Link>
                    {user?.role === 'SELLER' ? (
                      <Link to="/creator" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        <Store size={15} /> {t('account.manageShop')} <CountBadge n={shopBadge} />
                      </Link>
                    ) : user?.role !== 'ADMIN' && (
                      <Link to="/seller/apply" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20">
                        <Store size={15} /> {t('account.openShop')} <CountBadge n={counts.shop} />
                      </Link>
                    )}
                    {user?.role === 'ADMIN' && (
                      <Link to="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                        <LayoutDashboard size={15} /> {t('nav.admin')} <CountBadge n={adminBadge} />
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut size={15} /> {t('nav.logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login" className="btn-ghost text-sm">{t('nav.login')}</Link>
              <Link to="/auth/register" className="btn-primary text-sm">{t('nav.register')}</Link>
            </div>
          )}

          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn-ghost md:hidden h-9 w-9 items-center justify-center rounded-xl p-0 flex"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
          >
            <nav className="container flex flex-col gap-1 py-4">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Icon size={16} /> {label}
                </Link>
              ))}
              {isAuthenticated && (user?.role === 'SELLER' ? (
                <Link to="/creator" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <Store size={16} /> {t('account.manageShop')}
                </Link>
              ) : user?.role !== 'ADMIN' && (
                <Link to="/seller/apply" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20">
                  <Store size={16} /> {t('account.openShop')}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {mode === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
                </button>
                <LanguageToggle />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
