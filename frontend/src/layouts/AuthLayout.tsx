import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Box } from 'lucide-react'
import LanguageToggle from '../components/ui/LanguageToggle'
import { useTranslation } from '../i18n/useTranslation'

export default function AuthLayout() {
  const location = useLocation()
  const {t} = useTranslation()

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left: Decorative panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-900 via-slate-900 to-indigo-950 p-12 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute left-10 top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 right-10 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 shadow-glow">
            <Box size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">Print Hub 3D</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl font-extrabold leading-tight text-white"
          >
            {t("auth.hero.title.top")}<br />
            <span className="text-gradient">& in 3D</span><br />
            {t("auth.hero.title.bottom")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-4 text-slate-400 leading-relaxed max-w-sm"
          >
            {t("auth.hero.subtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            {['10,000+ Models', '500+ Creators', 'PLA • PETG • Resin', 'VNPay • MoMo'].map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300">
                <span className="h-1 w-1 rounded-full bg-brand-400" />{t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom quote */}
        <p className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} Print Hub 3D
        </p>
      </div>

      {/* Right: Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="absolute right-6 top-6 z-20">
          <LanguageToggle />
        </div>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600">
              <Box size={15} className="text-white" />
            </div>
            <span className="font-bold text-white">Print Hub 3D</span>
          </Link>

          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-soft backdrop-blur-xl">
            <Outlet />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
