import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, ChevronLeft, Star, ShoppingCart, Bookmark,
  Share2, Flag, Maximize2, Box, Loader2, Heart, Download, ChevronRight as Arrow
} from 'lucide-react'
import apiClient from '../../api/axios'
import { useCartStore } from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import useAuthStore from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { useTranslation } from '../../i18n/useTranslation'
import ProductReviews from './ProductReviews'

interface ProductDetail {
  id: number
  title: string
  description: string
  price: number
  imageUrl?: string
  thumbnailUrl?: string
  material?: string
  category?: string
  sellerName?: string
  shopId?: number
  shopName?: string
  shopSlug?: string
  rating?: number
  reviewCount?: number
  stockQuantity?: number
  totalSold?: number
  createdAt?: string
  images?: string[]
  stlFileUrl?: string
  stlFiles?: { id: number; url: string; fileName: string }[]
}

interface RelatedProduct {
  id: number
  title: string
  price: number
  thumbnailUrl?: string
  category?: string
  rating?: number
  creatorName?: string
}

const PLACEHOLDER = 'https://placehold.co/800x600/1e293b/64748b?text=3D+Model'

async function fetchProduct(productId: string): Promise<ProductDetail> {
  const res = await apiClient.get<{ data: ProductDetail }>(`/products/${productId}`)
  return res.data.data
}

async function fetchRelated(category?: string): Promise<RelatedProduct[]> {
  const params = category ? `&category=${encodeURIComponent(category)}` : ''
  const res = await apiClient.get<{ data: { content: RelatedProduct[] } }>(`/products?page=0&size=8${params}`)
  return res.data.data?.content ?? []
}


/** ProductDetailPage — Chi tiết sản phẩm: ảnh, mô tả, giá, xem STL, đánh giá và thêm giỏ / mua. */
export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const addToCart = useCartStore((s) => s.addToCart)

  const [activeImg, setActiveImg] = useState(0)
  const [tab, setTab] = useState<'overview' | 'reviews' | 'faqs'>('overview')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Download all STL files of the product bundled into a single ZIP
  const handleDownloadZip = async () => {
    if (!productId) return
    setDownloading(true)
    try {
      const res = await apiClient.get(`/products/${productId}/download`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(data?.title ?? 'model').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId!),
    enabled: Boolean(productId),
  })

  const { data: related } = useQuery({
    queryKey: ['related-products', data?.category],
    queryFn: () => fetchRelated(data?.category),
    enabled: Boolean(data),
  })


  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { showToast } = useToast()
  const wished = useWishlistStore((s) => (data ? s.ids.has(data.id) : false))
  const toggleWish = useWishlistStore((s) => s.toggle)
  const fetchWishlistIds = useWishlistStore((s) => s.fetchIds)

  useEffect(() => { void fetchWishlistIds() }, [fetchWishlistIds])


  const formatPrice = (p: number) =>
    p.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

  if (isLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 size={20} className="animate-spin" /> {t('product.loading')}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Box size={40} className="mb-3 text-slate-300" />
        <p className="font-semibold text-slate-600 dark:text-slate-300">{t('product.notFound')}</p>
        <Link to="/marketplace" className="btn-primary mt-4">{t('market.label')}</Link>
      </div>
    )
  }

  // Gallery: ưu tiên images[], fallback thumbnail, rồi placeholder
  const gallery = (data.images && data.images.length > 0)
    ? data.images
    : (data.thumbnailUrl ? [data.thumbnailUrl] : [PLACEHOLDER])
  const mainImg = gallery[activeImg] ?? PLACEHOLDER

  const handleAddToCart = async () => {
    setAdding(true)
    await addToCart(data.id, 1)
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const handleBuyNow = async () => {
    await addToCart(data.id, 1)
    navigate('/checkout')
  }

  const handleToggleWish = async () => {
    if (!isAuthenticated) {
      showToast(t('market.loginToWish'))
      navigate('/auth/login')
      return
    }
    try {
      await toggleWish(data.id)
    } catch {
      showToast(t('market.wishError'))
    }
  }


  const relatedList = (related ?? []).filter((p) => p.id !== data.id).slice(0, 4)

  return (
    <div className="container py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── LEFT: Gallery ── */}
        <div>
          {/* Main image */}
          <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
            <AnimatePresence mode="wait">
              <motion.img
                key={mainImg}
                src={mainImg}
                alt={data.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {/* Fullscreen badge */}
            <button
              type="button"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
            >
              <Maximize2 size={16} />
            </button>

            {/* Prev/Next */}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length)}
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition hover:bg-black/60 group-hover:opacity-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImg((i) => (i + 1) % gallery.length)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition hover:bg-black/60 group-hover:opacity-100"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveImg((i) => Math.max(0, i - 1))}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 sm:flex dark:border-slate-700"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    activeImg === i ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveImg((i) => Math.min(gallery.length - 1, i + 1))}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 sm:flex dark:border-slate-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex flex-wrap gap-2">
            {([
              ['overview', t('product.overview')],
              ['reviews', `${t('product.reviews')}`],
              ['faqs', t('product.faqs')],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  tab === key
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'border border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {tab === 'overview' && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('product.description')}</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
                  {data.description || '—'}
                </p>

                {/* Specs */}
                <h3 className="mt-8 text-base font-bold text-slate-900 dark:text-white">{t('product.specs')}</h3>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                  {[
                    [t('product.categoryLabel'), data.category || '—'],
                    [t('product.material'), data.material || '—'],
                    [t('product.inStock'), `${data.stockQuantity ?? 0}`],
                    [t('product.sold'), `${data.totalSold ?? 0}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800">
                      <span className="text-sm text-slate-500">{k}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'reviews' && (
              <ProductReviews productId={data.id} />
            )}

            {tab === 'faqs' && (
              <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center dark:border-slate-700">
                <Box size={36} className="mb-3 text-slate-300" />
                <p className="font-semibold text-slate-500">{t('product.noFaqs')}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
            {/* Seller / shop */}
            {data.shopSlug ? (
              <Link to={`/shops/${data.shopSlug}`} className="group flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {(data.shopName ?? data.sellerName)?.[0]?.toUpperCase() ?? 'P'}
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-brand-600 group-hover:underline dark:text-slate-200">
                  {data.shopName ?? data.sellerName}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {data.sellerName?.[0]?.toUpperCase() ?? 'P'}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{data.sellerName}</span>
              </div>
            )}

            {/* Title + breadcrumb */}
            <h1 className="mt-3 text-2xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
              {data.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-sm text-brand-600 dark:text-brand-400">
              <Link to="/marketplace" className="hover:underline">3D</Link>
              <Arrow size={13} className="text-slate-400" />
              <Link to="/marketplace" className="hover:underline">{t('section.categories.label')}</Link>
              {data.category && (
                <>
                  <Arrow size={13} className="text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400">{data.category}</span>
                </>
              )}
            </div>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              {data.rating && data.rating > 0 ? (
                <>
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{data.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({data.reviewCount ?? 0})</span>
                </>
              ) : (
                <span className="text-slate-400">{t('product.noRating')}</span>
              )}
            </div>

            {/* Price box */}
            <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('product.price')}</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{formatPrice(data.price)}</p>
            </div>

            {/* Actions */}
            <button
              type="button"
              onClick={handleBuyNow}
              className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
            >
              {t('product.buyNow')}
            </button>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                {adding ? <Loader2 size={16} className="animate-spin" />
                  : added ? <><Heart size={16} className="fill-brand-600 text-brand-600" /> {t('product.added')}</>
                  : <><ShoppingCart size={16} /> {t('product.addToCart')}</>}
              </button>
              <button
                type="button"
                onClick={() => void handleToggleWish()}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700"
              >
                <Bookmark size={17} className={wished ? 'fill-brand-600 text-brand-600' : ''} />
              </button>
            </div>

            {/* Download STL (bundled as ZIP) */}
            {(data.stlFiles?.length || data.stlFileUrl) && (
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={downloading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-3 text-sm font-bold text-green-700 transition hover:bg-green-100 disabled:opacity-60 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
              >
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {t('product.downloadStl')}
                {data.stlFiles && data.stlFiles.length > 1 && ` (${data.stlFiles.length} ${t('product.files')})`}
              </button>
            )}

            {/* Included formats */}
            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">{t('product.includedFormats')}</p>
              <div className="flex gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">STL</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">OBJ</span>
              </div>
            </div>

            {/* Details */}
            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{t('product.details')}</p>
              <div className="space-y-2.5 text-sm">
                <Row label={t('product.published')} value={formatDate(data.createdAt)} />
                <Row label={t('product.categoryLabel')} value={data.category || '—'} />
                <Row label={t('product.ageRating')} value={t('product.notMature')} />
                <Row label={t('product.inStock')} value={`${data.stockQuantity ?? 0}`} />
              </div>
            </div>

            {/* Share / Report */}
            <div className="mt-6 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-500 transition hover:border-slate-300 dark:border-slate-700">
                <Share2 size={14} /> {t('product.share')}
              </button>
              <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-500 transition hover:border-slate-300 dark:border-slate-700">
                <Flag size={14} /> Report
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Related products ── */}
      {relatedList.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold text-slate-900 dark:text-white">{t('product.related')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedList.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="group card overflow-hidden">
                <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800" style={{ paddingBottom: '70%' }}>
                  <img
                    src={p.thumbnailUrl || PLACEHOLDER}
                    alt={p.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-3">
                  {p.category && (
                    <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">{p.category}</p>
                  )}
                  <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{p.title}</h3>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(p.price)}</p>
                    {p.rating != null && p.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500">
                        <Star size={12} className="fill-amber-400" /> {p.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}
