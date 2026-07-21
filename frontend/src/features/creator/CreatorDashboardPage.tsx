import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp, Package, Download, DollarSign,
  Plus, Eye, Edit2, Trash2, Star, BarChart2,
  ChevronRight, Upload, Users, Box, Loader2, CheckCircle2, X, Store, ExternalLink,
  ShoppingBag, Wallet, Clock, Check, Settings2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/axios'
import { useTranslation } from '../../i18n/useTranslation'

interface CreatorStats {
  availableBalance: number
  totalEarned: number
  totalGross: number
  totalCommission: number
  totalWithdrawn: number
  pendingWithdraw: number
  totalOrders: number
  totalProductsSold: number
  totalProducts: number
  monthlyRevenue: { month: string; revenue: number }[]
}

interface Withdrawal {
  withdrawalId: number
  amount: number
  bankName?: string
  bankAccountNumber?: string
  bankAccountName?: string
  note?: string
  status: 'PENDING' | 'PAID' | 'REJECTED'
  rejectionReason?: string
  processedAt?: string
  createdAt: string
}

interface MyProduct {
  id: number
  title: string
  price: number
  thumbnailUrl?: string
  downloads: number
  sales: number
  rating?: number
  status: string
  rejectionReason?: string
  isDigital: boolean
}

const NAV = [
  { id: 'overview', key: 'creator.nav.overview', icon: BarChart2 },
  { id: 'shop', key: 'creator.nav.shop', icon: Store },
  { id: 'orders', key: 'creator.nav.orders', icon: ShoppingBag },
  { id: 'wallet', key: 'creator.nav.wallet', icon: Wallet },
  { id: 'products', key: 'creator.nav.products', icon: Package },
  { id: 'sales', key: 'creator.nav.sales', icon: DollarSign },
]

interface SellerOrderItem {
  orderItemId: number
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface SellerOrder {
  orderId: number
  orderNumber: string
  orderStatus: string
  buyerName?: string
  shippingAddress?: string
  shippingCity?: string
  createdAt: string
  items: SellerOrderItem[]
  shopSubtotal: number
  commissionRate: number
  commissionAmount: number
  netEarning: number
  sellerConfirmed: boolean
  paidOut: boolean
  /** Trạng thái xử lý của SẠP trong đơn này (backend trả về). */
  fulfillmentStatus?: string
}

interface MyShop {
  shopId: number
  name: string
  slug: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  rating?: number
  totalReviews?: number
  totalProducts?: number
  totalSales?: number
  totalFollowers?: number
  balance?: number
  featuredProductIds?: number[]
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof TrendingUp; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function SimpleBarChart({ data }: { data: { month: string; revenue: number }[] }) {
  const CHART_H = 140          // vùng vẽ cột (px)
  const BAR_MAX = CHART_H - 22 // chừa chỗ cho nhãn số ở trên
  const values = data.map(d => Number(d.revenue) || 0)
  const max = Math.max(...values, 1)
  const fmtShort = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'tr'
      : n >= 1_000 ? Math.round(n / 1_000) + 'k'
      : String(n)
  return (
    // Chiều cao cột tính bằng PIXEL (không dùng % của cha auto-height → không bị co về 0)
    <div className="flex items-end gap-2" style={{ height: CHART_H }}>
      {data.map(({ month }, i) => {
        const val = values[i]
        const h = val > 0 ? Math.max(6, Math.round((val / max) * BAR_MAX)) : 2
        return (
          <div key={month} className="flex flex-1 flex-col items-center justify-end gap-1">
            {val > 0 && <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{fmtShort(val)}</span>}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: h }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`w-full rounded-t-lg ${val > 0 ? 'bg-brand-500 dark:bg-brand-400' : 'bg-slate-200 dark:bg-slate-700'}`}
              title={`${val.toLocaleString('vi-VN')}đ`}
            />
            <span className="text-[10px] text-slate-400">{month}</span>
          </div>
        )
      })}
    </div>
  )
}

/** CreatorDashboardPage — Bảng điều khiển người bán: số liệu bán hàng, sản phẩm, đơn và ví. */
export default function CreatorDashboardPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const location = useLocation()
  const [tab, setTab] = useState((location.state as { tab?: string } | null)?.tab ?? 'overview')
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', price: '', category: '',
    isDigital: true, material: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [imgUploading, setImgUploading] = useState(false)

  const removeImage = (idx: number) =>
    setImages(prev => prev.filter((_, i) => i !== idx))

  const pickAndUploadImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files ?? [])
      if (!files.length) return
      setImgUploading(true)
      try {
        for (const file of files) {
          const fd = new FormData()
          fd.append('file', file)
          const res = await apiClient.post('/images/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          const url = res.data.data.url as string
          setImages(prev => [...prev, url])
        }
      } catch {
        setSubmitMsg({ type: 'err', text: 'Tải ảnh thất bại, vui lòng thử lại' })
      } finally {
        setImgUploading(false)
      }
    }
    input.click()
  }
  const [stlFiles, setStlFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleSubmitProduct = async () => {
    setSubmitMsg(null)
    if (!uploadForm.title.trim() || !uploadForm.price) {
      setSubmitMsg({ type: 'err', text: 'Vui lòng nhập tên và giá sản phẩm' })
      return
    }
    setSubmitting(true)
    try {
      // 1) Upload tất cả file STL (mô hình nhiều bộ phận = nhiều file)
      const uploaded: { url: string; fileName: string }[] = []
      for (const file of stlFiles) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await apiClient.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        uploaded.push({ url: res.data.data.url, fileName: res.data.data.fileName ?? file.name })
      }
      // 2) Tạo sản phẩm
      const cleanImages = images.map(u => u.trim()).filter(Boolean)
      await apiClient.post('/products', {
        title: uploadForm.title,
        description: uploadForm.description,
        price: Number(uploadForm.price),
        category: uploadForm.category || null,
        materialType: uploadForm.material || null,
        isDigital: uploadForm.isDigital,
        thumbnailUrl: cleanImages[0] || null,
        images: cleanImages,
        stlFileUrl: uploaded[0]?.url ?? null,
        stlFiles: uploaded,
      })

      setSubmitMsg({ type: 'ok', text: 'Đăng sản phẩm thành công!' })
      setUploadForm({ title: '', description: '', price: '', category: '', isDigital: true, material: '' })
      setImages([])
      setStlFiles([])
      qc.invalidateQueries({ queryKey: ['creator-products'] })
      setTimeout(() => { setTab('products'); setSubmitMsg(null) }, 1200)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? 'Đăng sản phẩm thất bại, vui lòng thử lại'
      setSubmitMsg({ type: 'err', text: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const { data: stats } = useQuery<CreatorStats>({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/stats')
      return res.data.data
    },
    retry: false,
  })

  const { data: products } = useQuery<MyProduct[]>({
    queryKey: ['creator-products'],
    queryFn: async () => {
      const res = await apiClient.get('/products/my')
      return res.data.data?.content ?? []
    },
    enabled: tab === 'products' || tab === 'overview',
  })

  const formatPrice = (p: number) =>
    p.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  // ── Shop ("sạp") management ──
  const { data: shop } = useQuery<MyShop | null>({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/shop')
      return res.data.data
    },
  })

  const [shopForm, setShopForm] = useState({ name: '', description: '', logoUrl: '', bannerUrl: '', featuredProductIds: [] as number[] })
  const [savingShop, setSavingShop] = useState(false)
  const [shopImgUploading, setShopImgUploading] = useState<'logo' | 'banner' | null>(null)
  const [shopMsg, setShopMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (!shop) return
    void (async () => {
      await Promise.resolve()
      setShopForm({
        name: shop.name ?? '',
        description: shop.description ?? '',
        logoUrl: shop.logoUrl ?? '',
        bannerUrl: shop.bannerUrl ?? '',
        featuredProductIds: shop.featuredProductIds ?? [],
      })
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.shopId])

  // Load shop products for featured picker
  const { data: shopProducts } = useQuery<{ id: number; title: string; thumbnailUrl?: string; imageUrl?: string }[]>({
    queryKey: ['shop-products-picker', shop?.slug],
    queryFn: async () => {
      const res = await apiClient.get(`/shops/${shop!.slug}/products`, { params: { page: 0, size: 100 } })
      return res.data.data.content
    },
    enabled: tab === 'shop' && !!shop?.slug,
  })

  const toggleFeatured = (id: number) => {
    setShopForm((f) => {
      const ids = f.featuredProductIds
      if (ids.includes(id)) return { ...f, featuredProductIds: ids.filter((x) => x !== id) }
      if (ids.length >= 6) return f
      return { ...f, featuredProductIds: [...ids, id] }
    })
  }

  const uploadShopImage = (kind: 'logo' | 'banner') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setShopImgUploading(kind)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await apiClient.post('/images/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const url = res.data.data.url as string
        setShopForm((f) => ({ ...f, [kind === 'logo' ? 'logoUrl' : 'bannerUrl']: url }))
      } catch {
        setShopMsg({ type: 'err', text: t('creatorShop.uploadFailed') })
      } finally {
        setShopImgUploading(null)
      }
    }
    input.click()
  }

  const handleSaveShop = async () => {
    setShopMsg(null)
    setSavingShop(true)
    try {
      await apiClient.put('/seller/shop', {
        name: shopForm.name,
        description: shopForm.description,
        logoUrl: shopForm.logoUrl,
        bannerUrl: shopForm.bannerUrl,
        featuredProductIds: shopForm.featuredProductIds,
      })
      setShopMsg({ type: 'ok', text: t('creatorShop.saved') })
      qc.invalidateQueries({ queryKey: ['my-shop'] })
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setShopMsg({ type: 'err', text: msg ?? t('creatorShop.saveFailed') })
    } finally {
      setSavingShop(false)
    }
  }

  // ── Seller orders (paginated) ──
  const [ordersPage, setOrdersPage] = useState(0)
  const { data: sellerOrdersPage } = useQuery<{ content: SellerOrder[]; totalPages: number; number: number }>({
    queryKey: ['seller-orders', ordersPage],
    queryFn: async () => {
      const res = await apiClient.get('/seller/orders', { params: { page: ordersPage, size: 10 } })
      return res.data.data
    },
    enabled: tab === 'orders',
  })
  const sellerOrders = sellerOrdersPage?.content
  const ordersTotalPages = sellerOrdersPage?.totalPages ?? 1

  const [busyOrderId, setBusyOrderId] = useState<number | null>(null)

  /** Gọi API rồi làm mới danh sách đơn; báo lỗi nếu thất bại. */
  const runOrderAction = async (orderId: number, path: string) => {
    setBusyOrderId(orderId)
    try {
      await apiClient.post(`/seller/orders/${orderId}/${path}`)
      qc.invalidateQueries({ queryKey: ['seller-orders'] })
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      alert(msg ?? t('creatorOrders.actionFailed'))
    } finally {
      setBusyOrderId(null)
    }
  }

  /** Chuyển sang bước xử lý kế tiếp (PRINTING → … → DELIVERED). */
  const handleAdvance = (orderId: number) => runOrderAction(orderId, 'advance')

  /** Đã giao xong → xin admin duyệt hoàn tất. */
  const handleRequestCompletion = (orderId: number) => runOrderAction(orderId, 'request-completion')


  const ORDER_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    PROCESSING: { label: t('creatorOrders.statusProcessing'), cls: 'badge-amber' },
    CONFIRMED:  { label: t('creatorOrders.statusConfirmed'), cls: 'badge-blue' },
    COMPLETED:  { label: t('creatorOrders.statusCompleted'), cls: 'badge-green' },
    CANCELLED:  { label: t('creatorOrders.statusCancelled'), cls: 'badge-red' },
  }

    /** Nhãn + màu cho trạng thái xử lý theo sạp. */
  const FULFILLMENT_LABEL: Record<string, { label: string; cls: string }> = {
    PENDING:           { label: t('ff.pending'),   cls: 'badge-slate' },
    CONFIRMED:         { label: t('ff.confirmed'), cls: 'badge-blue' },
    PRINTING:          { label: t('ff.printing'),  cls: 'badge-blue' },
    FINISHING:         { label: t('ff.finishing'), cls: 'badge-blue' },
    SHIPPING:          { label: t('ff.shipping'),  cls: 'badge-amber' },
    DELIVERED:         { label: t('ff.delivered'), cls: 'badge-green' },
    AWAITING_APPROVAL: { label: t('ff.awaiting'),  cls: 'badge-amber' },
    COMPLETED:         { label: t('ff.completed'), cls: 'badge-green' },
  }

  /** Bước kế tiếp seller được phép chuyển. */
  const FF_NEXT: Record<string, string> = {
    CONFIRMED: 'PRINTING',
    PRINTING: 'FINISHING',
    FINISHING: 'SHIPPING',
    SHIPPING: 'DELIVERED',
  }


  const monthlyData = stats?.monthlyRevenue ?? []

  // ── Ví & rút tiền ──
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [wdForm, setWdForm] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountName: '', note: '' })
  const [wdSubmitting, setWdSubmitting] = useState(false)
  const [wdMsg, setWdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const { data: withdrawalsPage } = useQuery<{ content: Withdrawal[]; totalPages: number }>({
    queryKey: ['my-withdrawals'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/withdrawals', { params: { page: 0, size: 20 } })
      return res.data.data
    },
    enabled: tab === 'wallet',
  })
  const withdrawals = withdrawalsPage?.content ?? []
  const available = stats?.availableBalance ?? shop?.balance ?? 0

  const handleWithdraw = async () => {
    setWdMsg(null)
    const amt = Number(wdForm.amount)
    if (!amt || amt < 50000) { setWdMsg({ type: 'err', text: t('creatorWallet.minError') }); return }
    if (amt > available) { setWdMsg({ type: 'err', text: t('creatorWallet.notEnough') }); return }
    setWdSubmitting(true)
    try {
      await apiClient.post('/seller/withdrawals', {
        amount: amt,
        bankName: wdForm.bankName,
        bankAccountNumber: wdForm.bankAccountNumber,
        bankAccountName: wdForm.bankAccountName,
        note: wdForm.note,
      })
      setWdMsg({ type: 'ok', text: t('creatorWallet.requested') })
      setWdForm({ amount: '', bankName: '', bankAccountNumber: '', bankAccountName: '', note: '' })
      qc.invalidateQueries({ queryKey: ['my-withdrawals'] })
      qc.invalidateQueries({ queryKey: ['seller-stats'] })
      qc.invalidateQueries({ queryKey: ['my-shop'] })
      setTimeout(() => { setShowWithdraw(false); setWdMsg(null) }, 1200)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setWdMsg({ type: 'err', text: msg ?? t('creatorWallet.failed') })
    } finally {
      setWdSubmitting(false)
    }
  }

  const WD_STATUS: Record<string, { label: string; cls: string }> = {
    PENDING: { label: t('creatorWallet.stPending'), cls: 'badge-amber' },
    PAID: { label: t('creatorWallet.stPaid'), cls: 'badge-green' },
    REJECTED: { label: t('creatorWallet.stRejected'), cls: 'badge-red' },
  }

  // ── Sửa / Xóa sản phẩm ──
  const [editProduct, setEditProduct] = useState<MyProduct | null>(null)
  const [editForm, setEditForm] = useState({ title: '', price: '', description: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const openEdit = (p: MyProduct) => {
    setEditProduct(p)
    setEditForm({ title: p.title, price: String(p.price), description: '' })
  }

  const handleSaveEdit = async () => {
    if (!editProduct) return
    setSavingEdit(true)
    try {
      await apiClient.put(`/products/${editProduct.id}`, {
        title: editForm.title,
        price: Number(editForm.price),
        description: editForm.description || undefined,
      })
      qc.invalidateQueries({ queryKey: ['creator-products'] })
      setEditProduct(null)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (p: MyProduct) => {
    if (!window.confirm(`${t('creator.confirmDelete')} "${p.title}"?`)) return
    setDeletingId(p.id)
    try {
      await apiClient.delete(`/products/${p.id}`)
      qc.invalidateQueries({ queryKey: ['creator-products'] })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="container">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{t('creator.hub')}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{t('creator.title')}</h1>
          </div>
          <button
            type="button"
            onClick={() => setTab('uploads')}
            className="btn-primary gap-2"
          >
            <Plus size={16} /> {t('creator.upload')}
          </button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <nav className="card p-3 space-y-1">
              {NAV.map(({ id, key, icon: Icon }) => (
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
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >

                {/* ── Overview ── */}
                {tab === 'overview' && (
                  <div className="space-y-5">
                    {/* Stats */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard
                        icon={Wallet} label={t('creator.stat.balance')} color="text-green-600 bg-green-50 dark:bg-green-900/30"
                        value={formatPrice(stats?.availableBalance ?? 0)}
                        sub={t('creator.stat.balanceSub')}
                      />
                      <StatCard
                        icon={DollarSign} label={t('creator.stat.earned')} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30"
                        value={formatPrice(stats?.totalEarned ?? 0)}
                        sub={t('creator.stat.earnedSub')}
                      />
                      <StatCard
                        icon={ShoppingBag} label={t('creator.stat.sold')} color="text-purple-600 bg-purple-50 dark:bg-purple-900/30"
                        value={String(stats?.totalProductsSold ?? 0)}
                        sub={t('creator.stat.soldSub')}
                      />
                      <StatCard
                        icon={Users} label={t('creator.stat.orders')} color="text-amber-600 bg-amber-50 dark:bg-amber-900/30"
                        value={String(stats?.totalOrders ?? 0)}
                        sub={t('creator.stat.ordersSub')}
                      />
                    </div>

                    {/* Revenue chart */}
                    <div className="card p-6">
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{t('creator.monthlyRev')}</h3>
                        <span className="badge badge-green text-xs">{t('creator.last6')}</span>
                      </div>
                      <SimpleBarChart data={monthlyData} />
                    </div>

                    {/* Recent products */}
                    {products?.length ? (
                      <div className="card p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{t('creator.recentProducts')}</h3>
                          <button type="button" onClick={() => setTab('products')} className="text-xs text-brand-600 hover:underline">
                            {t('creator.viewAll')}
                          </button>
                        </div>
                        <div className="space-y-3">
                          {products.slice(0, 4).map(p => (
                            <div key={p.id} className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                <Box size={18} className="text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
                                <p className="text-xs text-slate-400">{p.downloads ?? 0} tải · {p.sales ?? 0} đơn</p>
                              </div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white shrink-0">{formatPrice(p.price)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* ── My Shop (sạp) ── */}
                {tab === 'shop' && (
                  <div className="space-y-5">
                    {/* Banner + logo preview */}
                    <div className="card overflow-hidden p-0">
                      <div className="relative h-40 w-full bg-gradient-to-r from-slate-700 to-slate-900">
                        {shopForm.bannerUrl && (
                          <img src={shopForm.bannerUrl} alt="banner" className="h-full w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => uploadShopImage('banner')}
                          disabled={shopImgUploading === 'banner'}
                          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/70"
                        >
                          {shopImgUploading === 'banner' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          {t('creatorShop.changeBanner')}
                        </button>
                      </div>
                      <div className="flex items-end gap-4 px-6 pb-5">
                        <div className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-600 text-2xl font-bold text-white shadow-lg dark:border-slate-900">
                          {shopForm.logoUrl ? (
                            <img src={shopForm.logoUrl} alt="logo" className="h-full w-full object-cover" />
                          ) : (
                            shopForm.name?.[0]?.toUpperCase() ?? 'S'
                          )}
                        </div>
                        <div className="flex flex-1 items-center justify-between pt-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{shop?.name}</p>
                            <p className="text-xs text-slate-400">@{shop?.slug}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => uploadShopImage('logo')}
                              disabled={shopImgUploading === 'logo'}
                              className="btn-secondary gap-1.5 text-sm"
                            >
                              {shopImgUploading === 'logo' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                              {t('creatorShop.changeLogo')}
                            </button>
                            {shop?.slug && (
                              <Link to={`/shops/${shop.slug}`} className="btn-ghost gap-1.5 text-sm">
                                <ExternalLink size={14} /> {t('creatorShop.viewShop')}
                              </Link>
                            )}
                            <Link to="/seller/shop/customize" className="btn-secondary gap-1.5 text-sm">
                              <Settings2 size={14} /> {t('shop.customize')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid gap-4 sm:grid-cols-4">
                      <StatCard icon={Star} label={t('creatorShop.statRating')} color="text-amber-600 bg-amber-50 dark:bg-amber-900/30"
                        value={(shop?.rating ?? 0).toFixed(1)} sub={`${shop?.totalReviews ?? 0} ${t('creatorShop.ratingCount')}`} />
                      <StatCard icon={Package} label={t('creatorShop.statProducts')} color="text-brand-600 bg-brand-50 dark:bg-brand-900/30"
                        value={String(shop?.totalProducts ?? 0)} />
                      <StatCard icon={Download} label={t('creatorShop.statSold')} color="text-purple-600 bg-purple-50 dark:bg-purple-900/30"
                        value={String(shop?.totalSales ?? 0)} />
                      <StatCard icon={Users} label={t('creatorShop.statFollowers')} color="text-green-600 bg-green-50 dark:bg-green-900/30"
                        value={String(shop?.totalFollowers ?? 0)} />
                    </div>

                    {/* Edit form */}
                    <div className="card p-6">
                      <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">{t('creatorShop.infoTitle')}</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creatorShop.nameLabel')}</label>
                          <input
                            value={shopForm.name}
                            onChange={(e) => setShopForm((f) => ({ ...f, name: e.target.value }))}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creatorShop.introLabel')}</label>
                          <textarea
                            value={shopForm.description}
                            onChange={(e) => setShopForm((f) => ({ ...f, description: e.target.value }))}
                            rows={4}
                            placeholder={t('creatorShop.introPlaceholder')}
                            className="input resize-none"
                          />
                        </div>

                        {shopMsg && (
                          <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
                            shopMsg.type === 'ok'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {shopMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <X size={15} />}
                            {shopMsg.text}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button type="button" onClick={() => void handleSaveShop()} disabled={savingShop} className="btn-primary gap-2">
                            {savingShop ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                            {t('creatorShop.save')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Sản phẩm nổi bật ── */}
                    <div className="card p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {t('shop.featured')}
                          </h2>
                          <p className="mt-0.5 text-sm text-slate-500">{t('cus.featuredHint')}</p>
                        </div>
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                          {shopForm.featuredProductIds.length}/6
                        </span>
                      </div>

                      {!shopProducts || shopProducts.length === 0 ? (
                        <p className="text-sm text-slate-400">{t('cus.noProducts')}</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                          {shopProducts.map((p) => {
                            const isFeatured = shopForm.featuredProductIds.includes(p.id)
                            const isDisabled = !isFeatured && shopForm.featuredProductIds.length >= 6
                            const thumb = p.thumbnailUrl || p.imageUrl || 'https://placehold.co/200x200/1e293b/64748b?text=3D'
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => !isDisabled && toggleFeatured(p.id)}
                                className={`relative overflow-hidden rounded-xl border-2 text-left transition ${
                                  isFeatured
                                    ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-900'
                                    : isDisabled
                                    ? 'cursor-not-allowed border-slate-200 opacity-40 dark:border-slate-700'
                                    : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                                }`}
                              >
                                <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                                  <img src={thumb} alt={p.title} className="h-full w-full object-cover"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/200x200/1e293b/64748b?text=3D' }} />
                                </div>
                                <p className="truncate px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">{p.title}</p>
                                {isFeatured && (
                                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow">
                                    <Check size={11} />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Orders (seller) ── */}
                {tab === 'orders' && (
                  <div className="space-y-5">
                    {/* Wallet */}
                    <div className="card flex items-center justify-between p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 dark:bg-green-900/30">
                          <Wallet size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creatorOrders.walletLabel')}</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                            {formatPrice(shop?.balance ?? 0)}
                          </p>
                        </div>
                      </div>
                      <p className="max-w-[200px] text-right text-xs text-slate-400">
                        {t('creatorOrders.walletNote')}
                      </p>
                    </div>

                    <div className="card p-6">
                      <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">{t('creatorOrders.title')}</h2>
                      {!sellerOrders?.length ? (
                        <div className="flex flex-col items-center py-12 text-center">
                          <ShoppingBag size={40} className="mb-3 text-slate-300" />
                          <p className="font-semibold text-slate-500">{t('creatorOrders.empty')}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sellerOrders.map((o) => {
                            const ff = o.fulfillmentStatus ?? 'PENDING'
                            const st = FULFILLMENT_LABEL[ff] ?? { label: ff, cls: 'badge-slate' }
                            const next = FF_NEXT[ff]
                            return (
                              <div key={o.orderId} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {t('creatorOrders.orderNo')} #{o.orderNumber}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {o.buyerName} · {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                                    </p>
                                  </div>
                                  <span className={`badge ${st.cls}`}>{st.label}</span>
                                </div>

                                {/* Items */}
                                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                  {o.items.map((it) => (
                                    <div key={it.orderItemId} className="flex items-center gap-3 text-sm">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">
                                        {it.quantity}×
                                      </div>
                                      <span className="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-200">{it.productName}</span>
                                      <span className="font-medium text-slate-900 dark:text-white">{formatPrice(it.subtotal)}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Earnings */}
                                <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                  <div className="text-xs text-slate-500">
                                    <p>{t('creatorOrders.revenue')}: {formatPrice(o.shopSubtotal)}</p>
                                    <p>{t('creatorOrders.commission')} ({(o.commissionRate * 100).toFixed(0)}%): −{formatPrice(o.commissionAmount)}</p>
                                    <p className="text-sm font-bold text-green-600">{t('creatorOrders.youGet')}: {formatPrice(o.netEarning)}</p>
                                  </div>
                                                                    {next ? (
                                    <button
                                      type="button"
                                      onClick={() => void handleAdvance(o.orderId)}
                                      disabled={busyOrderId === o.orderId}
                                      className="btn-primary gap-2 text-sm disabled:opacity-60"
                                    >
                                      {busyOrderId === o.orderId && <Loader2 size={14} className="animate-spin" />}
                                      {t('creatorOrders.advanceTo')} {FULFILLMENT_LABEL[next]?.label ?? next}
                                    </button>
                                  ) : ff === 'DELIVERED' ? (
                                    <button
                                      type="button"
                                      onClick={() => void handleRequestCompletion(o.orderId)}
                                      disabled={busyOrderId === o.orderId}
                                      className="btn-primary gap-2 text-sm disabled:opacity-60"
                                    >
                                      {busyOrderId === o.orderId
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : <CheckCircle2 size={14} />}
                                      {t('creatorOrders.requestCompletion')}
                                    </button>
                                  ) : ff === 'AWAITING_APPROVAL' ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
                                      <Clock size={13} /> {t('creatorOrders.awaitingAdmin')}
                                    </span>
                                  ) : ff === 'COMPLETED' || o.paidOut ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                                      <CheckCircle2 size={13} /> {t('creatorOrders.paid')}
                                    </span>
                                  ) : null}

                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Pagination */}
                      {ordersTotalPages > 1 && (
                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800">
                          <span>{t('common.page')} {ordersPage + 1} / {ordersTotalPages}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setOrdersPage((p) => Math.max(0, p - 1))}
                              disabled={ordersPage === 0}
                              className="rounded-xl border border-slate-200 px-3 py-1.5 font-medium transition hover:border-brand-400 disabled:opacity-40 dark:border-slate-700"
                            >
                              {t('common.prev')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages - 1, p + 1))}
                              disabled={ordersPage >= ordersTotalPages - 1}
                              className="rounded-xl border border-slate-200 px-3 py-1.5 font-medium transition hover:border-brand-400 disabled:opacity-40 dark:border-slate-700"
                            >
                              {t('common.next')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Wallet (Ví & rút tiền) ── */}
                {tab === 'wallet' && (
                  <div className="space-y-5">
                    {/* Balance hero */}
                    <div className="card overflow-hidden p-0">
                      <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-6 text-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-medium text-white/80">
                              <Wallet size={16} /> {t('creatorWallet.available')}
                            </p>
                            <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatPrice(available)}</p>
                            <p className="mt-1 text-xs text-white/70">{t('creatorWallet.availableHint')}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setWdMsg(null); setShowWithdraw(true) }}
                            disabled={available < 50000}
                            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 shadow transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t('creatorWallet.withdraw')}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
                        <div className="p-4 text-center">
                          <p className="text-lg font-bold text-amber-600">{formatPrice(stats?.pendingWithdraw ?? 0)}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{t('creatorWallet.pending')}</p>
                        </div>
                        <div className="p-4 text-center">
                          <p className="text-lg font-bold text-emerald-600">{formatPrice(stats?.totalEarned ?? 0)}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{t('creatorWallet.totalEarned')}</p>
                        </div>
                        <div className="p-4 text-center">
                          <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{formatPrice(stats?.totalWithdrawn ?? 0)}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{t('creatorWallet.totalWithdrawn')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Explainer */}
                    <div className="card flex items-start gap-3 p-4 text-sm text-slate-500 dark:text-slate-400">
                      <DollarSign size={18} className="mt-0.5 shrink-0 text-brand-500" />
                      <p>{t('creatorWallet.explain')}</p>
                    </div>

                    {/* History */}
                    <div className="card p-6">
                      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{t('creatorWallet.history')}</h2>
                      {withdrawals.length === 0 ? (
                        <div className="flex flex-col items-center py-10 text-center">
                          <Wallet size={36} className="mb-3 text-slate-300" />
                          <p className="font-semibold text-slate-500">{t('creatorWallet.noHistory')}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {withdrawals.map((w) => {
                            const st = WD_STATUS[w.status] ?? { label: w.status, cls: 'badge-slate' }
                            return (
                              <div key={w.withdrawalId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                                <div>
                                  <p className="text-lg font-bold text-slate-900 dark:text-white">{formatPrice(w.amount)}</p>
                                  <p className="text-xs text-slate-400">
                                    {new Date(w.createdAt).toLocaleString('vi-VN')}
                                    {w.bankName ? ` · ${w.bankName}` : ''}
                                  </p>
                                  {w.status === 'REJECTED' && w.rejectionReason && (
                                    <p className="mt-1 text-xs text-rose-500">{w.rejectionReason}</p>
                                  )}
                                </div>
                                <span className={`badge ${st.cls}`}>{st.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Products ── */}
                {tab === 'products' && (
                  <div className="card p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('creator.myProducts')}</h2>
                      <button type="button" onClick={() => setTab('uploads')} className="btn-primary gap-2 text-sm">
                        <Plus size={15} /> {t('creator.addNew')}
                      </button>
                    </div>

                    {!products?.length ? (
                      <div className="flex flex-col items-center py-12 text-center">
                        <Package size={40} className="mb-3 text-slate-300" />
                        <p className="font-semibold text-slate-500">{t('creator.noProducts')}</p>
                        <button type="button" onClick={() => setTab('uploads')} className="btn-primary mt-4 gap-2">
                          <Upload size={15} /> {t('creator.uploadFirst')}
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                              {[t('creator.th.product'), t('creator.th.price'), t('creator.th.downloads'), t('creator.th.rating'), t('creator.th.status'), ''].map((h, i) => (
                                <th key={i} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 first:pr-4">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {products.map(p => (
                              <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                      <Box size={15} className="text-slate-400" />
                                    </div>
                                    <span className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-[160px]">{p.title}</span>
                                  </div>
                                </td>
                                <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{formatPrice(p.price)}</td>
                                <td className="py-3 pr-4 text-slate-500">{p.downloads ?? 0}</td>
                                <td className="py-3 pr-4">
                                  {p.rating ? (
                                    <span className="flex items-center gap-1 text-amber-500">
                                      <Star size={13} className="fill-amber-400" /> {p.rating.toFixed(1)}
                                    </span>
                                  ) : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="py-3 pr-4">
                                  {p.status === 'ACTIVE' && (
                                    <span className="badge badge-green">{t('creator.statusActive')}</span>
                                  )}
                                  {p.status === 'PENDING' && (
                                    <span className="badge badge-amber">{t('creator.statusPending')}</span>
                                  )}
                                  {p.status === 'REJECTED' && (
                                    <div>
                                      <span className="badge badge-red">{t('creator.statusRejected')}</span>
                                      {p.rejectionReason && (
                                        <p className="mt-1 text-xs text-rose-500">{p.rejectionReason}</p>
                                      )}
                                    </div>
                                  )}
                                  {!p.status && (
                                    <span className="badge badge-amber">{t('creator.statusPending')}</span>
                                  )}
                                </td>
                                <td className="py-3">
                                  <div className="flex gap-2">
                                    <Link to={`/products/${p.id}`} className="btn-ghost h-8 w-8 p-0 flex items-center justify-center" title={t('creator.viewDetail')}>
                                      <Eye size={14} />
                                    </Link>
                                    <button type="button" onClick={() => openEdit(p)} className="btn-ghost h-8 w-8 p-0 flex items-center justify-center" title={t('creator.edit')}>
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDelete(p)}
                                      disabled={deletingId === p.id}
                                      className="h-8 w-8 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                                      title={t('creator.delete')}
                                    >
                                      {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Revenue ── */}
                {tab === 'sales' && (
                  <div className="card p-6">
                    <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">{t('creator.revStats')}</h2>
                    <div className="mb-6">
                      <SimpleBarChart data={monthlyData} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
                        <p className="text-2xl font-extrabold text-brand-600">{formatPrice(stats?.totalGross ?? 0)}</p>
                        <p className="mt-1 text-xs text-slate-400">{t('creator.grossRev')}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
                        <p className="text-2xl font-extrabold text-green-600">{formatPrice(stats?.totalEarned ?? 0)}</p>
                        <p className="mt-1 text-xs text-slate-400">{t('creator.netRev')}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
                        <p className="text-2xl font-extrabold text-amber-600">{stats?.totalOrders ?? 0}</p>
                        <p className="mt-1 text-xs text-slate-400">{t('creator.totalOrders')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Upload ── */}
                {tab === 'uploads' && (
                  <div className="card p-6">
                    <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">{t('creator.uploadNew')}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.name')} *</label>
                        <input
                          value={uploadForm.title}
                          onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                          placeholder={t('creator.form.namePlaceholder')}
                          className="input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.desc')}</label>
                        <textarea
                          value={uploadForm.description}
                          onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                          rows={3}
                          placeholder={t('creator.form.descPlaceholder')}
                          className="input resize-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.price')} *</label>
                        <input
                          type="number"
                          value={uploadForm.price}
                          onChange={e => setUploadForm(f => ({ ...f, price: e.target.value }))}
                          placeholder="150000"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.category')}</label>
                        <select
                          value={uploadForm.category}
                          onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                          className="input"
                        >
                          <option value="">{t('creator.form.selectCategory')}</option>
                          <option>Anime & Figures</option>
                          <option>Miniatures</option>
                          <option>Mechanical</option>
                          <option>Architecture</option>
                          <option>Collectibles</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.category')}</label>
                        <select
                          value={uploadForm.category}
                          onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                          className="input"
                        >
                          <option value="">{t('creator.form.selectCategory')}</option>
                          <option>Anime & Figures</option>
                          <option>Miniatures</option>
                          <option>Mechanical</option>
                          <option>Architecture</option>
                          <option>Collectibles</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.material')}</label>
                        <select
                          value={uploadForm.material}
                          onChange={e => setUploadForm(f => ({ ...f, material: e.target.value }))}
                          className="input"
                        >
                          <option value="">{t('creator.form.selectMaterial')}</option>
                          <option value="PLA">PLA</option>
                          <option value="PETG">PETG</option>
                          <option value="ABS">ABS</option>
                          <option value="TPU">TPU</option>
                          <option value="RESIN">Resin</option>
                        </select>
                      </div>

                      {/* Ảnh sản phẩm (upload từ máy, nhiều ảnh) */}
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.image')}</label>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                          {images.map((url, idx) => (
                            <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                              <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              {idx === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 bg-brand-600 text-center text-[9px] font-bold uppercase text-white">{t('creator.form.mainImage')}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100"
                                title={t('creator.form.removeImage')}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}

                          {/* Ô thêm ảnh */}
                          <button
                            type="button"
                            onClick={pickAndUploadImage}
                            disabled={imgUploading}
                            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 dark:border-slate-700"
                          >
                            {imgUploading
                              ? <Loader2 size={20} className="animate-spin" />
                              : <><Upload size={20} /><span className="text-[11px] font-medium">{t('creator.form.addImage')}</span></>}
                          </button>
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-400">{t('creator.form.imageHint')}</p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.type')}</label>
                        <div className="flex gap-3">
                          {[
                            { v: true, l: t('creator.form.digital'), d: t('creator.form.digitalDesc') },
                            { v: false, l: t('creator.form.physical'), d: t('creator.form.physicalDesc') },
                          ].map(({ v, l, d }) => (
                            <label key={l} className={`flex-1 cursor-pointer rounded-2xl border p-3.5 transition ${
                              uploadForm.isDigital === v
                                ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30'
                                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                            }`}>
                              <input type="radio" name="type" checked={uploadForm.isDigital === v} onChange={() => setUploadForm(f => ({ ...f, isDigital: v }))} className="sr-only" />
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{l}</p>
                              <p className="text-xs text-slate-400">{d}</p>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Upload zone — nhiều file STL (mỗi bộ phận 1 file) */}
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.stlFile')}</label>

                        {/* Danh sách file đã chọn */}
                        {stlFiles.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {stlFiles.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                                <Box size={16} className="shrink-0 text-brand-600" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{f.name}</p>
                                  <p className="text-xs text-slate-400">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setStlFiles(prev => prev.filter((_, i) => i !== idx))}
                                  className="shrink-0 text-slate-400 hover:text-red-500"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = '.stl,.obj,.fbx,.gltf,.glb'
                            input.multiple = true
                            input.onchange = (e) => {
                              const f = (e.target as HTMLInputElement).files
                              if (f?.length) setStlFiles(prev => [...prev, ...Array.from(f)])
                            }
                            input.click()
                          }}
                          className="flex min-h-[90px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center transition hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-800/50"
                        >
                          <Upload size={22} className="mb-2 text-slate-400" />
                          <p className="text-sm text-slate-500">
                            {stlFiles.length > 0 ? t('creator.form.addMoreStl') : t('creator.form.uploadHint')}
                          </p>
                          <p className="text-xs text-slate-400">{t('creator.form.stlMultiHint')}</p>
                        </div>
                      </div>

                      {/* Thông báo kết quả */}
                      {submitMsg && (
                        <div className={`sm:col-span-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
                          submitMsg.type === 'ok'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {submitMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <X size={15} />}
                          {submitMsg.text}
                        </div>
                      )}

                      <div className="sm:col-span-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setTab('products')} className="btn-secondary" disabled={submitting}>
                          {t('creator.form.cancel')}
                        </button>
                        <button type="button" onClick={handleSubmitProduct} disabled={submitting} className="btn-primary gap-2">
                          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                          {t('creator.form.submit')}
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

      {/* ── Modal Sửa sản phẩm ── */}
      <AnimatePresence>
        {editProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setEditProduct(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('creator.editProduct')}</h3>
                <button type="button" onClick={() => setEditProduct(null)} className="btn-ghost h-8 w-8 p-0 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.name')}</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.price')}</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creator.form.desc')}</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder={t('creator.editDescHint')}
                    className="input resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setEditProduct(null)} className="btn-secondary" disabled={savingEdit}>
                  {t('creator.form.cancel')}
                </button>
                <button type="button" onClick={() => void handleSaveEdit()} disabled={savingEdit} className="btn-primary gap-2">
                  {savingEdit ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {t('account.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Rút tiền ── */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowWithdraw(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-900"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Wallet size={18} className="text-emerald-600" /> {t('creatorWallet.withdrawTitle')}
                </h3>
                <button type="button" onClick={() => setShowWithdraw(false)} className="btn-ghost h-8 w-8 p-0 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm dark:bg-emerald-900/20">
                <span className="text-slate-500 dark:text-slate-400">{t('creatorWallet.available')}: </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatPrice(available)}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creatorWallet.amount')} *</label>
                  <input
                    type="number"
                    value={wdForm.amount}
                    onChange={(e) => setWdForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="50000"
                    className="input"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">{t('creatorWallet.minHint')}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creatorWallet.bankName')}</label>
                    <input value={wdForm.bankName} onChange={(e) => setWdForm((f) => ({ ...f, bankName: e.target.value }))} placeholder="Vietcombank" className="input" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creatorWallet.bankNumber')}</label>
                    <input value={wdForm.bankAccountNumber} onChange={(e) => setWdForm((f) => ({ ...f, bankAccountNumber: e.target.value }))} className="input" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creatorWallet.bankHolder')}</label>
                  <input value={wdForm.bankAccountName} onChange={(e) => setWdForm((f) => ({ ...f, bankAccountName: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('creatorWallet.note')}</label>
                  <textarea value={wdForm.note} onChange={(e) => setWdForm((f) => ({ ...f, note: e.target.value }))} rows={2} className="input resize-none" />
                </div>

                {wdMsg && (
                  <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
                    wdMsg.type === 'ok'
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {wdMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <X size={15} />}
                    {wdMsg.text}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowWithdraw(false)} className="btn-secondary" disabled={wdSubmitting}>
                  {t('creator.form.cancel')}
                </button>
                <button type="button" onClick={() => void handleWithdraw()} disabled={wdSubmitting} className="btn-primary gap-2">
                  {wdSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
                  {t('creatorWallet.submit')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
