import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Store, Image, Type, Star, Loader2, CheckCircle2,
  AlertCircle, ExternalLink, X, Check,
} from 'lucide-react'
import sellerService from './sellerService'
import type { Shop, ShopProduct } from '../shop/shopService'
import { useTranslation } from '../../i18n/useTranslation'

const PLACEHOLDER = 'https://placehold.co/400x400/1e293b/64748b?text=3D'
const MAX_FEATURED = 6

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="card p-6">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
        <Icon size={18} className="text-brand-600" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function ImagePreview({ url, alt, aspect }: { url: string; alt: string; aspect: string }) {
  const [err, setErr] = useState(false)
  useEffect(() => setErr(false), [url])
  if (!url) return null
  return (
    <div className={`mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 ${aspect}`}>
      {err
        ? <div className="flex h-full items-center justify-center text-xs text-slate-400">Không tải được ảnh</div>
        : <img src={url} alt={alt} className="h-full w-full object-cover" onError={() => setErr(true)} />}
    </div>
  )
}

/** ShopCustomizePage — Trang tùy chỉnh sạp: ảnh banner/logo, thông tin sạp và chọn sản phẩm nổi bật. */
export default function ShopCustomizePage() {
  const { t } = useTranslation()
  const [shop, setShop] = useState<Shop | null>(null)
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [featuredIds, setFeaturedIds] = useState<number[]>([])

  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const saveOkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let active = true
    sellerService.getMyShop()
      .then(async (s) => {
        if (!active || !s) return
        setShop(s)
        setName(s.name ?? '')
        setDescription(s.description ?? '')
        setBannerUrl(s.bannerUrl ?? '')
        setLogoUrl(s.logoUrl ?? '')
        setFeaturedIds(s.featuredProductIds ?? [])
        const prods = await sellerService.getMyShopProducts(s.slug, 0, 100)
        if (active) setProducts(prods)
      })
      .catch(() => active && setLoadErr(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const toggleFeatured = (id: number) => {
    setFeaturedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_FEATURED) return prev
      return [...prev, id]
    })
  }

  const handleSave = async () => {
    if (!shop) return
    setSaving(true)
    setSaveOk(false)
    setSaveErr(null)
    try {
      const updated = await sellerService.updateShop({
        name: name.trim() || undefined,
        description,
        bannerUrl,
        logoUrl,
        featuredProductIds: featuredIds,
      })
      setShop(updated)
      setSaveOk(true)
      if (saveOkTimer.current) clearTimeout(saveOkTimer.current)
      saveOkTimer.current = setTimeout(() => setSaveOk(false), 3000)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSaveErr(msg || t('cus.saveErr'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (loadErr || !shop) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Store size={48} className="text-slate-300" />
        <p className="text-slate-500">{loadErr ? t('cus.loadErr') : t('cus.noShop')}</p>
        {!loadErr && <Link to="/seller/apply" className="btn-primary">{t('cus.openShop')}</Link>}
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600">{t('nav.creator')}</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('cus.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('cus.sub')}</p>
        </div>
        <Link
          to={`/shops/${shop.slug}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
        >
          <ExternalLink size={14} /> {t('cus.preview')}
        </Link>
      </div>

      <div className="space-y-6">
        {/* ── Ảnh & Thương Hiệu ── */}
        <SectionCard icon={Image} title={t('cus.sectionBrand')}>
          {/* Banner */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('cus.banner')}
            </label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder={t('cus.bannerHint')}
              className="input"
            />
            <ImagePreview url={bannerUrl} alt="banner" aspect="aspect-[4/1]" />
          </div>

          {/* Logo */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('cus.logo')}
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder={t('cus.logoHint')}
              className="input"
            />
            {logoUrl && (
              <div className="mt-3 h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                <img src={logoUrl} alt="logo" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Thông Tin Sạp ── */}
        <SectionCard icon={Type} title={t('cus.sectionInfo')}>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('cus.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('cus.desc')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={t('cus.descHint')}
              className="input resize-none"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{description.length}/2000</p>
          </div>
        </SectionCard>

        {/* ── Sản Phẩm Nổi Bật ── */}
        <SectionCard icon={Star} title={t('cus.sectionFeatured')}>
          <p className="mb-4 text-sm text-slate-500">
            {t('cus.featuredHint')}
            <span className="ml-2 font-semibold text-brand-600">
              ({featuredIds.length}/{MAX_FEATURED})
            </span>
          </p>

          {products.length === 0 ? (
            <p className="text-center text-sm text-slate-400">{t('cus.noProducts')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((p) => {
                const isFeatured = featuredIds.includes(p.id)
                const isDisabled = !isFeatured && featuredIds.length >= MAX_FEATURED
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    onClick={() => !isDisabled && toggleFeatured(p.id)}
                    whileTap={!isDisabled ? { scale: 0.97 } : {}}
                    className={`relative overflow-hidden rounded-xl border-2 text-left transition ${
                      isFeatured
                        ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-900'
                        : isDisabled
                        ? 'cursor-not-allowed border-slate-200 opacity-40 dark:border-slate-700'
                        : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={p.thumbnailUrl || p.imageUrl || PLACEHOLDER}
                        alt={p.title}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                      />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{p.title}</p>
                    </div>
                    {isFeatured && (
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow">
                        <Check size={13} />
                      </div>
                    )}
                    {!isFeatured && !isDisabled && (
                      <div className="absolute right-2 top-2 h-6 w-6 rounded-full border-2 border-white/70 bg-white/20 backdrop-blur-sm" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Save bar ── */}
        <div className="sticky bottom-4 z-10">
          <div className="card flex items-center justify-between gap-4 p-4 shadow-xl">
            <div className="flex items-center gap-2 text-sm">
              {saveOk && <><CheckCircle2 size={16} className="text-green-500" /><span className="text-green-600 dark:text-green-400">{t('cus.saved')}</span></>}
              {saveErr && <><AlertCircle size={16} className="text-red-500" /><span className="text-red-600 dark:text-red-400">{saveErr}</span><X size={14} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => setSaveErr(null)} /></>}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary shrink-0 disabled:opacity-60"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" />{t('cus.saving')}</> : t('cus.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
