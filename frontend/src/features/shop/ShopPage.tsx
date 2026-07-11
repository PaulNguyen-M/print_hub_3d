import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star, Package, Users, Store, Loader2, ShoppingBag,
  MessageSquare, UserPlus, UserCheck, Search, ChevronDown, MessageCircle, Calendar, ShoppingCart, BadgeCheck,
} from 'lucide-react'
import shopService from './shopService'
import type { Shop, ShopProduct, ShopReview } from './shopService'
import { useTranslation } from '../../i18n/useTranslation'
import useAuthStore from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'

const PLACEHOLDER = 'https://placehold.co/400x400/1e293b/64748b?text=3D'
const PAGE_SIZE = 12

const formatPrice = (p: number) =>
  (p ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

const formatJoined = (dateStr: string | undefined, lang: string) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString(
    lang === 'vi' ? 'vi-VN' : 'en-US',
    {month: 'long', year: 'numeric'},
  )
}

const SORT_OPTIONS = [
  { value: 'newest', key: 'market.sort.newest' },
  { value: 'rating', key: 'market.sort.rating' },
  { value: 'popular', key: 'market.sort.popular' },
  { value: 'price_asc', key: 'market.sort.priceAsc' },
  { value: 'price_desc', key: 'market.sort.priceDesc' },
]

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
      ))}
    </span>
  )
}

function ProductCard({ p, idx }: { p: ShopProduct; idx: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
      <Link
        to={`/products/${p.id}`}
        className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-card dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={p.thumbnailUrl || p.imageUrl || PLACEHOLDER}
            alt={p.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
          />
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-bold text-brand-600">{formatPrice(p.price)}</span>
            <span className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star size={12} className="fill-amber-400" /> {(p.rating ?? 0).toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, lang } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentUser = useAuthStore((s) => s.user)
  const openChat = useChatStore((s) => s.openChat)

  // Page is remounted on slug change (key={slug} in router), so initial values are always fresh
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'reviews'>('home')

  const [following, setFollowing] = useState(false)
  const [followers, setFollowers] = useState(0)
  const [followBusy, setFollowBusy] = useState(false)

  const [prodSort, setProdSort] = useState('newest')
  const [prodSearch, setProdSearch] = useState('')
  const [prodLoading, setProdLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [prodPage, setProdPage] = useState(0)
  const [prodHasMore, setProdHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [reviews, setReviews] = useState<ShopReview[] | null>(null)
  // null = not yet loaded → derive loading from this
  const reviewsLoading = activeTab === 'reviews' && reviews === null
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const isOwner = !!shop && !!currentUser && shop.ownerId === currentUser.id

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))]
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category === activeCategory)

  // Initial data load — component remounts when slug changes so no manual reset needed
  useEffect(() => {
    if (!slug) return
    let active = true
    Promise.all([
      shopService.getShop(slug),
      shopService.getShopProducts(slug, 0, PAGE_SIZE),
      shopService.getFeaturedProducts(slug),
    ])
      .then(([s, p, feat]) => {
        if (!active) return
        setShop(s)
        setProducts(p.content)
        setProdHasMore(p.number + 1 < p.totalPages)
        setFeaturedProducts(feat)
        setFollowing(!!s.isFollowing)
        setFollowers(s.totalFollowers ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (active) {
          setNotFound(true)
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [slug])

  // Reload products when sort/search changes (debounced)
  useEffect(() => {
    if (!slug || loading) return
    let active = true
    const handle = setTimeout(() => {
      setProdLoading(true)
      shopService.getShopProducts(slug, 0, PAGE_SIZE, prodSort, prodSearch.trim() || undefined)
        .then((p) => {
          if (active) {
            setProducts(p.content)
            setProdPage(0)
            setProdHasMore(p.number + 1 < p.totalPages)
            setActiveCategory('all')
          }
        })
        .finally(() => { if (active) setProdLoading(false) })
    }, 300)
    return () => { active = false; clearTimeout(handle) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodSort, prodSearch])

  // Lazy-load reviews on first open
  useEffect(() => {
    if (activeTab !== 'reviews' || !slug || reviews !== null) return
    let active = true
    shopService.getShopReviews(slug, 0, 50)
      .then((r) => { if (active) setReviews(r.content) })
      .catch(() => { if (active) setReviews([]) })
    return () => { active = false }
  }, [activeTab, slug, reviews])

  const handleLoadMore = async () => {
    if(!slug) return 
    setLoadingMore(true)
    try{
      const next = prodPage + 1
      const p = await shopService.getShopProducts(
        slug, next, PAGE_SIZE, prodSort, prodSearch.trim() || undefined,
      )
      setProducts((prev) => [...prev, ...p.content])
      setProdPage(next)
      setProdHasMore(p.number + 1 < p.totalPages)
    } finally{
      setLoadingMore(false)
    }
  }

  const handleFollow = async () => {
    if (!slug) return
    setFollowBusy(true)
    try {
      const { following: nowFollowing } = await shopService.toggleFollow(slug)
      setFollowing(nowFollowing)
      setFollowers((f) => Math.max(0, f + (nowFollowing ? 1 : -1)))
    } finally {
      setFollowBusy(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug) return
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      await shopService.reviewShop(slug, rating, comment.trim())
      setComment('')
      setRating(5)
      const [r, s] = await Promise.all([shopService.getShopReviews(slug, 0, 50), shopService.getShop(slug)])
      setReviews(r.content)
      setShop(s)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setReviewError(msg || t('shop.reviewErr'))
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (notFound || !shop) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Store size={48} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('shop.notFoundTitle')}</h2>
        <Link to="/marketplace" className="btn-primary mt-6">{t('shop.backToMarket')}</Link>
      </div>
    )
  }

  const stats = [
    { icon: Star, value: shop.rating?.toFixed(1) ?? '0.0', label: t('shop.statRating') },
    { icon: Package, value: shop.totalProducts ?? 0, label: t('shop.statProducts') },
    { icon: ShoppingCart, value: shop.totalSales ?? 0, label: t('shop.statSold') },
    { icon: Users, value: followers, label: t('shop.statFollowers') },
  ]

  return (
    <div className="min-h-screen pb-16">
      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 sm:h-56">
        {shop.bannerUrl && <img src={shop.bannerUrl} alt="banner" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="container relative z-10 -mt-12 sm:-mt-16">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── Sidebar ── */}
          <aside className="lg:w-72 shrink-0">
            <div className="card p-5">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-600 text-3xl font-bold text-white shadow-lg dark:border-slate-900">
                {shop.logoUrl
                  ? <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" />
                  : shop.name?.[0]?.toUpperCase() ?? 'S'}
              </div>

              <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">{shop.name}</h1>
              <p className="text-sm text-slate-400">@{shop.slug}</p>

              {shop.createdAt && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={12} /> {t('shop.joined')} {formatJoined(shop.createdAt, lang)}
                </p>
              )}

              {/* Follow + Chat */}
              {isAuthenticated && !isOwner && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followBusy}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                      following
                        ? 'border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    {followBusy ? <Loader2 size={16} className="animate-spin" />
                      : following ? <><UserCheck size={16} /> {t('shop.following')}</>
                      : <><UserPlus size={16} /> {t('shop.follow')}</>}
                  </button>
                  {shop.ownerId != null && (
                    <button
                      type="button"
                      onClick={() => openChat(shop.ownerId!, shop.name)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200"
                      title={t('shop.message')}
                    >
                      <MessageCircle size={16} /> {t('shop.message')}
                    </button>
                  )}
                </div>
              )}


              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                    <div className="flex items-center justify-center gap-1 text-brand-600">
                      <s.icon size={14} />
                      <span className="text-base font-bold text-slate-900 dark:text-white">{s.value}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {shop.description && (
                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('shop.about')}</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{shop.description}</p>
                </div>
              )}

              {shop.ownerName && (
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-600 dark:bg-slate-700">
                    {shop.ownerAvatarUrl
                      ? <img src={shop.ownerAvatarUrl} alt={shop.ownerName} className="h-full w-full object-cover" />
                      : shop.ownerName[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{shop.ownerName}</p>
                    <p className="text-xs text-slate-400">{t('shop.owner')}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 pt-16 lg:pt-20">
            {/* Tabs */}
            <div className="mb-5 flex gap-1 border-b border-slate-200 dark:border-slate-800">
              {([
                { key: 'home' as const, icon: Store, label: t('shop.tabHome') },
                { key: 'products' as const, icon: ShoppingBag, label: `${t('shop.tabProducts')} (${shop.totalProducts ?? products.length})` },
                { key: 'reviews' as const, icon: MessageSquare, label: `${t('shop.tabReviews')} (${shop.totalReviews ?? 0})` },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === key
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {/* ── Tab: Trang chủ sạp ── */}
            {activeTab === 'home' && (
              <div className="space-y-8">
                {/* Sản phẩm nổi bật */}
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    {t('shop.featured')}
                  </h2>
                  {featuredProducts.length === 0 ? (
                    <p className="text-sm text-slate-400">{t('shop.featuredEmpty')}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {featuredProducts.map((p, idx) => <ProductCard key={p.id} p={p} idx={idx} />)}
                    </div>
                  )}
                </section>

                {/* Theo danh mục */}
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                    <Package size={16} className="text-brand-600" />
                    {t('shop.categories')}
                  </h2>

                  {categories.length > 1 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                            activeCategory === cat
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {cat === 'all' ? t('shop.catAll') : cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredProducts.length === 0 ? (
                    <div className="card flex flex-col items-center py-12 text-center">
                      <Package size={36} className="mb-2 text-slate-300" />
                      <p className="text-sm text-slate-400">{t('shop.empty')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {filteredProducts.map((p, idx) => <ProductCard key={p.id} p={p} idx={idx} />)}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ── Tab: Tất cả sản phẩm ── */}
            {activeTab === 'products' && (
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      placeholder={t('shop.searchProducts')}
                      className="input pl-10"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={prodSort}
                      onChange={(e) => setProdSort(e.target.value)}
                      className="input w-44 cursor-pointer appearance-none pr-10"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{t(o.key)}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {prodLoading ? (
                  <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
                ) : products.length === 0 ? (
                  <div className="card flex flex-col items-center py-16 text-center">
                    <Package size={40} className="mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-500">{t('shop.empty')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {products.map((p, idx) => <ProductCard key={p.id} p={p} idx={idx} />)}
                  </div>
                )}
                {prodHasMore && !prodLoading && products.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
                    >
                      {loadingMore
                        ? <><Loader2 size={16} className="animate-spin" /> {t('shop.loadMore')}</>
                        : t('shop.loadMore')}
                    </button>
                  </div>
                )}
              </div>
            )}

            

            {/* ── Tab: Đánh giá ── */}
            {activeTab === 'reviews' && (
              <div>
                {isAuthenticated && !isOwner && shop.canReview ? (
                  <form onSubmit={handleSubmitReview} className="card mb-6 p-5">
                    <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('shop.writeReview')}</p>
                    <div className="mb-3 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)} className="p-0.5">
                          <Star size={24} className={i <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder={t('shop.reviewPlaceholder')}
                      className="input resize-none"
                    />
                    {reviewError && <p className="mt-2 text-sm text-red-500">{reviewError}</p>}
                    <button type="submit" disabled={reviewSubmitting} className="btn-primary mt-3">
                      {reviewSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                      {t('shop.submitReview')}
                    </button>
                  </form>
                ) : isAuthenticated && !isOwner && !shop.canReview ? (
                  <p className="card mb-6 p-4 text-sm text-slate-500">{t('shop.mustBuyToReview')}</p>
                ) : !isAuthenticated ? (
                  <p className="card mb-6 p-4 text-sm text-slate-500">{t('shop.loginToReview')}</p>
                ) : null}


                {reviewsLoading ? (
                  <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
                ) : !reviews?.length ? (
                  <div className="card flex flex-col items-center py-16 text-center">
                    <MessageSquare size={40} className="mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-500">{t('shop.reviewsEmpty')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.shopReviewId} className="card p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-sm font-bold text-white">
                            {r.userAvatarUrl
                              ? <img src={r.userAvatarUrl} alt={r.userName} className="h-full w-full object-cover" />
                              : r.userName?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {r.userName}
                              {r.verifiedPurchase && (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                  <BadgeCheck size={11} /> {t('shop.verifiedPurchase')}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2">
                              <Stars value={r.rating} />
                              <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                        {r.comment && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
