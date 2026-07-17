import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CreditCard, Smartphone, ShoppingBag,
  Loader2, MapPin, Truck, CheckCircle2, ArrowLeft, X
} from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useCartStore } from '../../store/cartStore'
import { useOrder } from '../../hooks/useOrder'
import { useToast } from '../../hooks/useToast'
import { useTranslation } from '../../i18n/useTranslation'

const PAYMENT_METHODS = [
  { id: 'BANK_TRANSFER', nameKey: 'co.pay.bank', descKey: 'co.pay.bankDesc', icon: '🏛️', badgeKey: null, badgeColor: '' },
  { id: 'MOMO',   name: 'MoMo',   descKey: 'co.pay.momoDesc',   icon: '📱', badgeKey: 'co.badge.fastest', badgeColor: 'badge-blue' },
  { id: 'CASH',   nameKey: 'co.pay.cash', descKey: 'co.pay.cashDesc', icon: '💵', badgeKey: null, badgeColor: '' },
] as const

// QR images live in frontend/public/img
const QR_IMAGES: Record<string, { src: string; labelKey: string }> = {
  BANK_TRANSFER: { src: '/img/chuyen_khoan.jpg', labelKey: 'co.qr.bankLabel' },
  MOMO: { src: '/img/momo.jpg', labelKey: 'co.qr.momoLabel' },
}

const SHIPPING_METHODS = [
  { id: 'STANDARD', labelKey: 'co.ship.standard', timeKey: 'co.ship.standardTime', price: 0 },
  { id: 'EXPRESS', labelKey: 'co.ship.express', timeKey: 'co.ship.expressTime', price: 30000 },
  { id: 'OVERNIGHT', labelKey: 'co.ship.overnight', timeKey: 'co.ship.overnightTime', price: 60000 },
] as const

const VN_PROVINCES = [
  'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Hải Phòng', 'An Giang',
  'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Khánh Hòa', 'Lâm Đồng',
]

/**
 * CheckoutPage — Trang thanh toán: nhập địa chỉ, chọn phương thức ship & thanh toán,
 * tóm tắt đơn và tạo đơn; hiện bước QR cho MoMo/chuyển khoản.
 */
export const CheckoutPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { cart, totalPrice } = useCart()
  const { createOrder } = useOrder()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  // When set, shows the QR-payment step for the just-created order
  const [qrOrder, setQrOrder] = useState<{ orderId: number; orderNumber: string; method: string } | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState('STANDARD')
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    shippingAddress: '',
    shippingCity: 'Hồ Chí Minh',
    shippingStateProvince: '',
    shippingPostalCode: '',
    shippingCountry: 'Việt Nam',
    shippingMethod: 'STANDARD',
    notes: '',
  })

  const selectedShipping = SHIPPING_METHODS.find(m => m.id === shippingMethodId)!
  const subtotal = totalPrice
  const shippingFee = selectedShipping.price
  const tax = Math.round(subtotal * 0.1)
  const orderTotal = subtotal + shippingFee + tax

  const formatPrice = (p: number) =>
    p.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.shippingAddress || !formData.shippingCity || !formData.phone) {
      showToast(t('co.fillRequired'))
      return
    }
    if (!cart || cart.items.length === 0) {
      showToast(t('co.cartEmpty'))
      return
    }
    setLoading(true)
    try {
      // Re-sync with the server cart to avoid ordering a stale/persisted cart
      // that no longer exists on the backend (would otherwise 500 "Cart is empty").
      await useCartStore.getState().fetchCart()
      const serverCart = useCartStore.getState().cart
      if (!serverCart || serverCart.items.length === 0) {
        showToast(t('co.cartEmpty'))
        return
      }

      const order = await createOrder({ ...formData, shippingMethod: shippingMethodId, paymentMethod })

      // MoMo / bank transfer → show the QR step; order stays PENDING until admin confirms.
      if (paymentMethod === 'MOMO' || paymentMethod === 'BANK_TRANSFER') {
        setQrOrder({ orderId: order.orderId, orderNumber: order.orderNumber, method: paymentMethod })
        return
      }
      // Cash (COD) → place the order; it waits for admin confirmation.
      navigate(`/orders/${order.orderId}`)
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(apiMessage || t('co.error'))
    } finally {
      setLoading(false)
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] pt-6">
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag size={48} className="mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('co.emptyTitle')}</h2>
          <p className="mt-2 text-slate-500">{t('co.emptyDesc')}</p>
          <Link to="/marketplace" className="btn-primary mt-6 gap-2">
            <ArrowLeft size={16} /> {t('co.continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-6 pb-16">
      <div className="container max-w-5xl">
        <div className="mb-8">
          <Link to="/cart" className="btn-ghost mb-3 inline-flex gap-1.5 text-sm">
            <ArrowLeft size={15} /> {t('co.cart')}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('co.title')}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Left */}
            <div className="flex-1 space-y-5 min-w-0">
              {/* Shipping info */}
              <div className="card p-6">
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                  <MapPin size={17} className="text-brand-600" /> {t('co.shippingInfo')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('co.fullName')} <span className="text-red-500">*</span>
                    </label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Nguyễn Văn A" className="input" required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('co.phone')} <span className="text-red-500">*</span>
                    </label>
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="0901234567" className="input" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('co.address')} <span className="text-red-500">*</span>
                    </label>
                    <input name="shippingAddress" value={formData.shippingAddress} onChange={handleChange} placeholder={t('co.addressPlaceholder')} className="input" required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('co.province')} <span className="text-red-500">*</span>
                    </label>
                    <select name="shippingCity" value={formData.shippingCity} onChange={handleChange} className="input">
                      {VN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('co.district')}</label>
                    <input name="shippingStateProvince" value={formData.shippingStateProvince} onChange={handleChange} placeholder={t('co.district')} className="input" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{t('co.notes')}</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder={t('co.notesPlaceholder')} className="input resize-none" />
                  </div>
                </div>
              </div>

              {/* Shipping method */}
              <div className="card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                  <Truck size={17} className="text-brand-600" /> {t('co.shippingMethod')}
                </h2>
                <div className="space-y-2">
                  {SHIPPING_METHODS.map(m => (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition ${
                        shippingMethodId === m.id
                          ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shipping" checked={shippingMethodId === m.id} onChange={() => setShippingMethodId(m.id)} className="accent-brand-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t(m.labelKey)}</p>
                          <p className="text-xs text-slate-400">{t(m.timeKey)}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {m.price === 0 ? <span className="text-green-600">{t('co.free')}</span> : formatPrice(m.price)}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                  <CreditCard size={17} className="text-brand-600" /> {t('co.paymentMethod')}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map(pm => (
                    <label
                      key={pm.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                        paymentMethod === pm.id
                          ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <input type="radio" name="payment" checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} className="mt-0.5 accent-brand-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{pm.icon}</span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{'nameKey' in pm ? t(pm.nameKey) : pm.name}</p>
                          {pm.badgeKey && <span className={`badge ${pm.badgeColor} text-[10px]`}>{t(pm.badgeKey)}</span>}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{t(pm.descKey)}</p>
                      </div>
                      {paymentMethod === pm.id && <CheckCircle2 size={16} className="shrink-0 text-brand-600 mt-0.5" />}
                    </label>
                  ))}
                </div>

                {/* Await-confirmation note */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  <span>{t('co.awaitConfirm')}</span>
                </motion.div>
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="lg:w-80 shrink-0">
              <div className="sticky top-24 space-y-4">
                <div className="card p-5">
                  <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">{t('co.summary')}</h3>

                  <div className="max-h-48 overflow-y-auto space-y-3 mb-4">
                    {cart.items.map(item => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">
                          {item.quantity}×
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.productName}</p>
                          <p className="text-xs text-slate-400">{formatPrice(item.unitPrice)}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white shrink-0">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>


                  <div className="space-y-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{t('co.subtotal')}</span><span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{t('co.shippingFee')}</span>
                      <span>{shippingFee === 0 ? <span className="text-green-600 font-medium">{t('co.free')}</span> : formatPrice(shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{t('co.tax')}</span><span>{formatPrice(tax)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white">{t('co.total')}</span>
                    <span className="text-xl font-extrabold text-brand-600">{formatPrice(orderTotal)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5 text-base"
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> {t('co.processing')}</>
                    : <><Smartphone size={18} /> {t('co.placeOrder')}</>
                  }
                </button>

                <p className="text-center text-xs text-slate-400">
                  {t('co.secure')}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ── QR payment step (MoMo / bank transfer) ── */}
      {qrOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-soft dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => navigate(`/orders/${qrOrder.orderId}`)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('co.qr.title')}</h3>
            <p className="mt-1 text-xs text-slate-400">{t(QR_IMAGES[qrOrder.method].labelKey)}</p>

            <div className="mx-auto mt-4 w-56 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
              <img src={QR_IMAGES[qrOrder.method].src} alt="QR" className="h-full w-full object-contain" />
            </div>

            {/* Transfer details */}
            <div className="mt-4 space-y-1 rounded-2xl bg-slate-50 p-3 text-left text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <div className="flex justify-between"><span>{t('co.qr.amount')}</span><strong className="text-brand-600">{formatPrice(orderTotal)}</strong></div>
              <div className="flex justify-between"><span>{t('co.bankContent')}</span><strong>{qrOrder.orderNumber}</strong></div>
              {qrOrder.method === 'BANK_TRANSFER' && (
                <>
                  <div className="flex justify-between"><span>{t('co.bankName')}</span><strong>TECHCOMBANK</strong></div>
                  <div className="flex justify-between"><span>{t('co.bankAcc')}</span><strong>297568688888</strong></div>
                  <div className="flex justify-between"><span>{t('co.bankOwner')}</span><strong>PRINT HUB 3D</strong></div>
                </>
              )}
            </div>

            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{t('co.qr.note')}</p>

            <button
              type="button"
              onClick={() => navigate(`/orders/${qrOrder.orderId}`)}
              className="btn-primary mt-4 w-full justify-center py-3"
            >
              <CheckCircle2 size={16} /> {t('co.qr.paid')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/orders/${qrOrder.orderId}`)}
              className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {t('co.qr.later')}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
