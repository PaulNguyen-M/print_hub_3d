import type { LucideIcon } from 'lucide-react'

interface AdminStatCardProps {
  label: string
  value: string | number
  description?: string
  accent?: string
  icon?: LucideIcon
}

/** AdminStatCard — Thẻ hiển thị một số liệu thống kê (nhãn + giá trị + mô tả + icon tuỳ chọn). */
export default function AdminStatCard({
  label,
  value,
  description,
  accent = 'bg-slate-50 text-slate-900 dark:bg-slate-950/80 dark:text-white',
  icon: Icon,
}: AdminStatCardProps) {
  return (
    <div className={`rounded-3xl border border-slate-200 p-6 shadow-sm dark:border-slate-800 ${accent}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            <Icon size={17} />
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
    </div>
  )
}
