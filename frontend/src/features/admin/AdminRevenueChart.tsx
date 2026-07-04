interface RevenuePoint {
  period: string
  revenue: number
}

interface AdminRevenueChartProps {
  points: RevenuePoint[]
}

export default function AdminRevenueChart({ points }: AdminRevenueChartProps) {
  if (!points?.length) {
    return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">No revenue data available.</div>
  }

  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1)

  return (
    <div className="space-y-4">
      {points.map((point) => (
        <div key={point.period} className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
            <span>{point.period}</span>
            <span className="font-semibold">${point.revenue.toFixed(2)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-300"
              style={{ width: `${(point.revenue / maxRevenue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
