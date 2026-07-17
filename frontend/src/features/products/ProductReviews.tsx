import { useEffect, useState } from 'react'
import { Star, Loader2, MessageSquare } from 'lucide-react'
import reviewService from './reviewService'
import type { Review } from './reviewService'
import useAuthStore from '../../store/authStore'
import { useTranslation } from '../../i18n/useTranslation'

interface Props {
  productId: number
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </span>
  )
}

/** ProductReviews — Danh sách đánh giá của một sản phẩm kèm form viết/sửa đánh giá. */
export default function ProductReviews({ productId }: Props) {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await reviewService.getReviews(productId, 0, 20)
      setReviews(data.content)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await reviewService.addReview(productId, rating, comment.trim())
      setComment('')
      setRating(5)
      await load()
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || t('review.errSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-14">
      <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
        <MessageSquare size={20} className="text-brand-600" />
        {t('review.title')} ({reviews.length})
        {reviews.length > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 text-base font-semibold text-amber-500">
            <Star size={16} className="fill-amber-400" /> {avg.toFixed(1)}
          </span>
        )}
      </h2>

      {/* Write a review */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="card mb-6 p-5">
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('review.writeTitle')}</p>
          <div className="mb-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                className="p-0.5"
              >
                <Star
                  size={24}
                  className={i <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={t('review.placeholder')}
            className="input resize-none"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary mt-3">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
            {t('review.submit')}
          </button>
        </form>
      ) : (
        <p className="card mb-6 p-4 text-sm text-slate-500">{t('review.loginPrompt')}</p>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">{t('review.empty')}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.reviewId} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-sm font-bold text-white">
                  {r.userAvatarUrl ? (
                    <img src={r.userAvatarUrl} alt={r.userName} className="h-full w-full object-cover" />
                  ) : (
                    r.userName?.[0]?.toUpperCase() ?? 'U'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{r.userName}</p>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>
              {r.comment && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
