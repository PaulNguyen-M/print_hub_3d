import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight, Box, Printer, Star, ChevronRight, Play,
  ShoppingBag, Store, Eye, Download, Sparkles
} from 'lucide-react'
import HeroScene from '../features/stl-viewer/HeroScene'
import apiClient from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import useAuthStore from '../store/authStore'

// Category tabs (names match the marketplace filter so links actually filter)
const TABS = [
  { value: 'all', labelKey: 'home.cat.all' },
  { value: 'Anime & Figures' },
  { value: 'Miniatures' },
  { value: 'Mechanical' },
  { value: 'Architecture' },
  { value: 'Collectibles' },
  { value: 'Jewelry' },
  { value: 'Vehicles' },
]

const HOW_IT_WORKS = [
  { step: '01', titleKey: 'how.step1.title', descKey: 'how.step1.desc' },
  { step: '02', titleKey: 'how.step2.title', descKey: 'how.step2.desc' },
  { step: '03', titleKey: 'how.step3.title', descKey: 'how.step3.desc' },
]

const fadeUp: Variants = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

interface FeaturedProduct {
  id: number
  title: string
  price: number
  thumbnailUrl?: string
  imageUrl?: string
  shopName?: string
  shopSlug?: string
  sellerName?: string
  rating?: number
  reviewCount?: number
  totalSold?: number
}

const formatPrice = (p: number) =>
  (p ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

const PLACEHOLDER = 'https://placehold.co/600x450/1e293b/64748b?text=3D+Model'

export default function HomePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // CTA adapts to auth state
  const ctaTo = !isAuthenticated ? '/auth/register'
    : user?.role === 'SELLER' ? '/creator'
    : user?.role === 'ADMIN' ? '/admin' : '/seller/apply'
  const ctaLabel = !isAuthenticated ? t('cta.register')
    : user?.role === 'SELLER' ? t('account.manageShop')
    : user?.role === 'ADMIN' ? t('nav.admin') : t('account.openShop')

  const sellTo = user?.role === 'SELLER' ? '/creator' : '/seller/apply'

  const { data: featured } = useQuery<FeaturedProduct[]>({
    queryKey: ['home-featured'],
    queryFn: async () => {
      const res = await apiClient.get('/products', { params: { page: 0, size: 10, sort: 'newest' } })
      return res.data.data?.content ?? []
    },
  })

  const exploreCards = [
    { icon: ShoppingBag, to: '/marketplace', title: t('home.explore.market.title'), desc: t('home.explore.market.desc'), color: 'from-brand-500 to-indigo-600' },
    { icon: Printer, to: '/printing-service', title: t('home.explore.print.title'), desc: t('home.explore.print.desc'), color: 'from-cyan-500 to-blue-600' },
    { icon: Store, to: sellTo, title: t('home.explore.sell.title'), desc: t('home.explore.sell.desc'), color: 'from-emerald-500 to-teal-600' },
    { icon: Eye, to: '/stl', title: t('home.explore.viewer.title'), desc: t('home.explore.viewer.desc'), color: 'from-amber-500 to-orange-600' },
  ]

  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="container relative z-10 flex flex-col items-center gap-16 py-24 lg:flex-row">
          <motion.div className="flex-1 text-center lg:text-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              {t('hero.badge')}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              {t('hero.title1')}{' '}
              <span className="text-gradient">{t('hero.title2')}</span>
              <br />
              {t('hero.title3')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-5 max-w-lg text-lg text-slate-300 lg:max-w-none"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Link to="/marketplace" className="btn-primary bg-brand-600 px-7 py-3 text-base hover:bg-brand-500">
                {t('hero.cta1')} <ArrowRight size={18} />
              </Link>
              <Link to="/printing-service" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-7 py-3 text-base font-semibold text-white transition hover:border-slate-400 hover:bg-white/5">
                <Play size={16} className="fill-white" /> {t('hero.cta2')}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 lg:justify-start"
            >
              {['hero.badge1', 'hero.badge2', 'hero.badge3'].map((badgeKey) => (
                <div key={badgeKey} className="flex items-center gap-1.5 text-sm text-slate-400">
                  <span className="h-1 w-1 rounded-full bg-brand-400" />
                  {t(badgeKey)}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div className="flex-1 flex items-center justify-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 1 }}>
            <div className="relative h-[380px] w-[380px] sm:h-[440px] sm:w-[440px] lg:h-[500px] lg:w-[500px]">
              <div className="absolute inset-0 rounded-full border border-brand-500/20 animate-spin-slow" />
              <div className="absolute inset-4 rounded-full border border-cyan-500/10 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
              <div className="absolute inset-8 overflow-hidden rounded-full bg-slate-900/50 shadow-glow">
                <HeroScene />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-slate-500 p-1">
            <div className="h-2 w-1 rounded-full bg-slate-400" />
          </div>
        </motion.div>
      </section>

      {/* ── BROWSE: category tabs ── */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="container py-4">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab, i) => (
              <Link
                key={tab.value}
                to={tab.value === 'all' ? '/marketplace' : `/marketplace?category=${encodeURIComponent(tab.value)}`}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  i === 0
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tab.labelKey ? t(tab.labelKey) : tab.value}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED BANNER + EXPLORE GRID ── */}
      <section className="section pt-8">
        <div className="container">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Big banner */}
            <Link
              to="/printing-service"
              className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-8 shadow-glow"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-cyan-400/15 blur-2xl" />
              <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <Sparkles size={13} /> {t('home.banner.tag')}
              </span>
              <h2 className="relative mt-3 max-w-md text-3xl font-extrabold leading-tight text-white">
                {t('home.banner.title')}
              </h2>
              <p className="relative mt-2 max-w-md text-sm text-brand-100">{t('home.banner.desc')}</p>
              <span className="relative mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition group-hover:gap-3">
                {t('home.banner.cta')} <ArrowRight size={16} />
              </span>
            </Link>

            {/* Explore grid */}
            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{t('home.explore.title')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {exploreCards.map(({ icon: Icon, to, title, desc, color }) => (
                  <Link key={title} to={to} className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-card">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-sm`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED MODELS ── */}
      <section className="section pt-4">
        <div className="container">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              <Box size={20} className="text-brand-600" /> {t('home.featured.title')}
            </h2>
            <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
              {t('home.featured.viewAll')} <ChevronRight size={15} />
            </Link>
          </div>

          {!featured?.length ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <Box size={40} className="mb-3 text-slate-300" />
              <p className="font-semibold text-slate-500">{t('home.featured.empty')}</p>
            </div>
          ) : (
            <motion.div
              variants={{ whileInView: { transition: { staggerChildren: 0.06 } } }}
              initial="initial" whileInView="whileInView" viewport={{ once: true }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
            >
              {featured.slice(0, 10).map((p) => (
                <motion.div key={p.id} variants={fadeUp}>
                  <Link
                    to={`/products/${p.id}`}
                    className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-card dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={p.thumbnailUrl || p.imageUrl || PLACEHOLDER}
                        alt={p.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{p.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{p.shopName ?? p.sellerName ?? 'Print Hub'}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-brand-600">{formatPrice(p.price)}</span>
                        <span className="flex items-center gap-2 text-xs text-slate-400">
                          {p.totalSold != null && p.totalSold > 0 && (
                            <span className="inline-flex items-center gap-0.5"><Download size={11} /> {p.totalSold}</span>
                          )}
                          <span className="inline-flex items-center gap-0.5 text-amber-500">
                            <Star size={11} className="fill-amber-400" /> {(p.rating ?? 0).toFixed(1)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section bg-slate-50 dark:bg-slate-900/50">
        <div className="container">
          <motion.div initial="initial" whileInView="whileInView" viewport={{ once: true }} variants={{ whileInView: { transition: { staggerChildren: 0.1 } } }} className="text-center">
            <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              {t('section.how.label')}
            </motion.p>
            <motion.h2 variants={fadeUp} className="section-title mt-2">
              {t('section.how.title')}
            </motion.h2>
          </motion.div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, titleKey, descKey }, i) => (
              <motion.div key={step} variants={fadeUp} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="relative text-center">
                {i < 2 && (
                  <div className="absolute left-1/2 top-10 hidden h-0.5 w-full translate-x-[50%] bg-gradient-to-r from-brand-200 to-transparent dark:from-brand-800 md:block" />
                )}
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-50 text-2xl font-extrabold text-brand-600 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-400">
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t(titleKey)}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">{t(descKey)}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/printing-service" className="btn-primary mx-auto px-8 py-3 text-base">
              {t('section.how.cta')} <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 px-8 py-14 text-center shadow-glow"
          >
            <div className="pointer-events-none absolute -left-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-cyan-400/10 blur-2xl" />
            <div className="relative z-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-200">{t('cta.label')}</p>
              <h2 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">{t('cta.title')}</h2>
              <p className="mx-auto mt-4 max-w-xl text-brand-100">{t('cta.sub')}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link to={ctaTo} className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  {ctaLabel} <ArrowRight size={18} />
                </Link>
                <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3 text-base font-semibold text-white transition hover:bg-white/10">
                  {t('cta.viewMarket')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
