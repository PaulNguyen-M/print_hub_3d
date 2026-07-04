import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/95">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{t('notfound.label')}</p>
      <h1 className="mt-6 text-4xl font-semibold">404</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">{t('notfound.desc')}</p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-sky-600 px-6 py-3 text-white transition hover:bg-sky-500"
      >
        {t('notfound.back')}
      </Link>
    </div>
  )
}
