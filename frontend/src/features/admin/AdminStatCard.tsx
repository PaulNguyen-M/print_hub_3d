interface AdminStatCardProps {
  label: string
  value: string | number
  description?: string
  accent?: string
}

export default function AdminStatCard({
  label,
  value,
  description,
  accent = 'bg-slate-50 text-slate-900 dark:bg-slate-950/80 dark:text-white'
}: AdminStatCardProps) {
  return (
    <div className={`rounded-3xl border border-slate-200 p-6 shadow-sm dark:border-slate-800 ${accent}`}>
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
    </div>
  )
}
