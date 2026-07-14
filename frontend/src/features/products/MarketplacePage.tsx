import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, SlidersHorizontal, Star, ShoppingCart,
  Heart, X, ChevronDown, Loader2, Package, Store
} from 'lucide-react'
import apiClient from '../../api/axios'
import { useCartStore } from '../../store/cartStore'
import { useTranslation } from '../../i18n/useTranslation'
import { useWishlistStore } from '../../store/wishlistStore'
import useAuthStore from '../../store/authStore'
import { useToast } from '../../hooks/useToast'


//Khai báo kiểu dữ liệu cho sản phẩm và phản hồi phân trang từ API
interface Product {
  id: number
  title: string
  price: number
  thumbnailUrl?: string
  category?: string
  rating?: number
  reviewCount?: number
  isDigital?: boolean
  materialType?: string
  creatorName?: string
  shopName?: string
  shopSlug?: string
  totalSold?: number
}

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// Hàm fetchProducts để gọi API lấy danh sách sản phẩm với các tham số tìm kiếm, lọc và phân trang
async function fetchProducts(params: Record<string, string>): Promise<PageResponse<Product>> {
  const query = new URLSearchParams(params).toString()
  const res = await apiClient.get<{ data: PageResponse<Product> }>(`/products?${query}`)
  return res.data.data
}

interface Category{
  categoryId: number
  name: string
  iconUrl?: string
}

async function fetchCategories(): Promise<Category[]> {
  const res = await apiClient.get<{ data: Category[] }>('/categories')
  return res.data.data
}

// Các tùy chọn sắp xếp, danh mục và khoảng giá được định nghĩa để sử dụng trong giao diện người dùng
const SORT_OPTIONS = [
  { value: 'newest', key: 'market.sort.newest' },
  { value: 'popular', key: 'market.sort.popular' },
  { value: 'price_asc', key: 'market.sort.priceAsc' },
  { value: 'price_desc', key: 'market.sort.priceDesc' },
  { value: 'rating', key: 'market.sort.rating' },
]


const PRICE_RANGES = [
  { key: 'market.price.under100', min: 0, max: 100000 },
  { key: 'market.price.100to300', min: 100000, max: 300000 },
  { key: 'market.price.300to500', min: 300000, max: 500000 },
  { key: 'market.price.over500', min: 500000, max: 999999 },
]


// Component ProductCard hiển thị thông tin sản phẩm trong lưới sản phẩm
function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const addToCart = useCartStore((s) => s.addToCart)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const wished = useWishlistStore((s) => s.ids.has(product.id))
  const toggleWish = useWishlistStore((s) => s.toggle)
  const [adding, setAdding] = useState(false)


  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    setAdding(true)
    await addToCart(product.id, 1)
    setAdding(false)
  }

  const handleWish = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      showToast(t('market.loginToWish'))
      navigate('/auth/login')
      return
    }
    try {
      await toggleWish(product.id)
    } catch {
      showToast(t('market.wishError'))
    }
  }


  const formatPrice = (p: number) =>
    p.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group card overflow-hidden"
    >
      <Link to={`/products/${product.id}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800" style={{ paddingBottom: '75%' }}>
          <img
            src={product.thumbnailUrl || 'https://placehold.co/600x450/e2e8f0/94a3b8?text=3D+Model'}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x450/e2e8f0/94a3b8?text=3D+Model' }}
            referrerPolicy="no-referrer"
          />
          {/* Type badge */}
          <span className={`absolute left-3 top-3 badge ${product.isDigital ? 'badge-blue' : 'badge-green'}`}>
            {product.isDigital ? t('market.digital') : t('market.physical')}
          </span>
          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWish}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 dark:bg-slate-800/90"
          >
            <Heart size={15} className={wished ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
          </button>
          {/* Quick add */}
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="btn-primary w-full justify-center py-2 text-xs"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
              {adding ? t('market.adding') : t('market.addToCart')}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category && (
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
              {product.category}
            </p>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white leading-snug">
            {product.title}
          </h3>
          {product.shopName && (
            product.shopSlug ? (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/shops/${product.shopSlug}`) }}
                className="mt-1 flex items-center gap-1 text-xs text-slate-400 transition hover:text-brand-600"
              >
                <Store size={11} /> {product.shopName}
              </button>
            ) : (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <Store size={11} /> {product.shopName}
              </p>
            )
          )}

          <div className="mt-3 flex items-center justify-between">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {formatPrice(product.price)}
            </p>
            {product.rating != null && (
              <div className="flex items-center gap-1">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {product.rating.toFixed(1)}
                </span>
                {product.reviewCount != null && (
                  <span className="text-xs text-slate-400">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>
          {(product.totalSold ?? 0) > 0 && (
            <p className="mt-1 text-xs text-slate-400">{t('market.sold')} {product.totalSold}</p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function ProductSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="bg-slate-200 dark:bg-slate-800" style={{ paddingBottom: '75%' }} />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 flex justify-between">
          <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-12 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  )
}
// Component trang Marketplace, state - bộ nhớ cảu trang
export default function MarketplacePage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest')
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 0)
  const fetchWishlistIds = useWishlistStore((s) => s.fetchIds)

  useEffect(() => { void fetchWishlistIds() }, [fetchWishlistIds])

  // Debounce: chỉ cập nhật từ khóa dùng để gọi API sau khi ngừng gõ 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0) // Khi thay đổi từ khóa tìm kiếm, reset về trang đầu tiên
    }, 300)

    return () => clearTimeout(handler)
  }, [search])

    // Ghi trạng thái lọc vào URL để chia sẻ / bookmark / tải lại đều khôi phục được
  useEffect(() => {
    const next: Record<string, string> = {}
    if (debouncedSearch) next.q = debouncedSearch
    if (sort !== 'newest') next.sort = sort
    if (category !== 'all') next.category = category
    if (priceRange) {
      next.minPrice = String(priceRange.min)
      next.maxPrice = String(priceRange.max)
    }
    if (page > 0) next.page = String(page)
    setSearchParams(next, { replace: true })
  }, [debouncedSearch, sort, category, priceRange, page, setSearchParams])


  // Khi đang tìm kiếm hoặc lọc → mặc định sắp theo rating cao nhất.
  // Khi không tìm/lọc → mặc định sản phẩm mới nhất. Người dùng vẫn đổi được qua dropdown.
  const isFilterMode = debouncedSearch.trim() !== '' || category !== 'all' || priceRange !== null
  const prevFilterMode = useRef(isFilterMode)
  useEffect(() => {
    if (isFilterMode !== prevFilterMode.current) {
      setSort(isFilterMode ? 'rating' : 'newest')
      setPage(0)
      prevFilterMode.current = isFilterMode
    }
  }, [isFilterMode])

  // Tạo đối tượng params để truyền vào query, sử dụng useMemo để tối ưu hiệu năng
  const params = useMemo(() => ({
    page: String(page),
    size: '12',
    sort,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(category !== 'all' && { category }),
    ...(priceRange && { minPrice: String(priceRange.min), maxPrice: String(priceRange.max) }),
  }), [page, sort, debouncedSearch, category, priceRange])


  //Render giao diện dựa trên dữ liệu từ API, sử dụng useQuery để quản lý trạng thái tải dữ liệu
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: Infinity, // Danh mục hiếm khi thay đổi, nên cache lâu
  })

  const priceRangeKey = priceRange && PRICE_RANGES.find(r => r.min === priceRange.min)?.key
  const activeFilters = [
    category !== 'all' && category,
    priceRangeKey && t(priceRangeKey),
  ].filter(Boolean) as string[]

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            {t('market.label')}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {t('market.title')}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {data?.totalElements ?? '...'} {t('market.modelsFrom')}
          </p>
        </div>

        {/* Search + Sort bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('market.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value) }}
              className="input pl-10"
            />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input cursor-pointer pr-10 appearance-none w-44"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{t(o.key)}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className={`btn-secondary gap-2 ${filterOpen ? 'border-brand-400 text-brand-600' : ''}`}
          >
            <SlidersHorizontal size={16} /> {t('market.filter')}
            {activeFilters.length > 0 && (
              <span className="badge badge-blue ml-1">{activeFilters.length}</span>
            )}
          </button>
        </div>

        {/* Active filters */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex flex-wrap gap-2"
            >
              {activeFilters.map(f => (
                <span key={f} className="badge badge-blue gap-1.5 py-1 px-3">
                  {f}
                  <button
                    type="button"
                    onClick={() => {
                      if (f === category) setCategory('all')
                      else setPriceRange(null)
                    }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => { setCategory('all'); setPriceRange(null) }}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                {t('market.clearAll')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-6">
          {/* Filter sidebar */}
          <AnimatePresence>
            {filterOpen && (
              <motion.aside
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 256 }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                className="shrink-0 overflow-hidden"
              >
                <div className="w-64 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-6">
                  {/* Category */}
                  <div>
                    <h4 className="mb-2.5 text-sm font-semibold text-slate-900 dark:text-white">{t('market.category')}</h4>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => { setCategory('all'); setPage(0) }}
                        className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                          category === 'all'
                            ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        {t('market.cat.all')}
                      </button>
                      {categories?.map((c) => (
                        <button
                          key={c.categoryId}
                          type="button"
                          onClick={() => { setCategory(c.name); setPage(0) }}
                          className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                            category === c.name
                              ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>


                  {/* Price */}
                  <div>
                    <h4 className="mb-2.5 text-sm font-semibold text-slate-900 dark:text-white">{t('market.priceRange')}</h4>
                    <div className="space-y-1">
                      {PRICE_RANGES.map(r => (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setPriceRange(
                            priceRange?.min === r.min ? null : { min: r.min, max: r.max }
                          )}
                          className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                            priceRange?.min === r.min
                              ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          {t(r.key)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-red-200 bg-red-50 p-16 text-center dark:border-red-800 dark:bg-red-900/10">
                <p className="text-red-600 font-semibold">{t('market.loadError')}</p>
                <p className="mt-1 text-sm text-red-400">{t('market.tryLater')}</p>
              </div>
            ) : !data?.content?.length ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
                <Package size={40} className="mb-3 text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">{t('market.notFound')}</p>
                <p className="mt-1 text-sm text-slate-400">{t('market.changeFilter')}</p>
              </div>
            ) : (
              <>
                <motion.div
                  layout
                  className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                >
                  <AnimatePresence mode="popLayout">
                    {data.content.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="btn-secondary px-4 py-2 disabled:opacity-40"
                    >
                      {t('common.prev')}
                    </button>
                    {Array.from({ length: Math.min(5, data.totalPages) }).map((_, i) => {
                      const p = Math.max(0, Math.min(page - 2, data.totalPages - 5)) + i
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`h-9 w-9 rounded-xl text-sm font-medium transition ${
                            p === page
                              ? 'bg-brand-600 text-white shadow-glow'
                              : 'btn-secondary'
                          }`}
                        >
                          {p + 1}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
                      disabled={page >= data.totalPages - 1}
                      className="btn-secondary px-4 py-2 disabled:opacity-40"
                    >
                      {t('common.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
