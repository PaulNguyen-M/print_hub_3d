import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

interface RevenuePoint {
  period: string
  revenue: number
}

interface AdminRevenueChartProps {
  points: RevenuePoint[]
}

const WIDTH = 640
const HEIGHT = 240
const PAD_LEFT = 48
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 28
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM

function niceMax(raw: number): number {
  if (raw <= 0) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
  const residual = raw / magnitude
  const niceResidual = residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1
  return niceResidual * magnitude
}

function fmtCompactVnd(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B₫`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M₫`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K₫`
  return `${Math.round(n)}₫`
}

const fmtFullVnd = (n: number) => (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

/** AdminRevenueChart — Biểu đồ đường doanh thu theo tháng, có điểm mốc + tooltip khi rê chuột. */
export default function AdminRevenueChart({ points }: AdminRevenueChartProps) {
  const { t } = useTranslation()
  const [hover, setHover] = useState<number | null>(null)

  if (!points?.length) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">{t('admin.dash.noRevenue')}</div>
  }

  const maxRevenue = niceMax(Math.max(...points.map((p) => p.revenue), 1))
  const stepX = points.length > 1 ? PLOT_W / (points.length - 1) : 0
  const coords = points.map((p, i) => ({
    x: PAD_LEFT + i * stepX,
    y: PAD_TOP + PLOT_H - (p.revenue / maxRevenue) * PLOT_H,
    ...p,
  }))
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ')
  const areaPath = `${linePath} L${coords[coords.length - 1].x},${PAD_TOP + PLOT_H} L${coords[0].x},${PAD_TOP + PLOT_H} Z`
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => maxRevenue * f)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={t('admin.dash.revTrend')}>
        {yTicks.map((tick, i) => {
          const y = PAD_TOP + PLOT_H - (tick / maxRevenue) * PLOT_H
          return (
            <g key={i}>
              <line x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={1} />
              <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">{fmtCompactVnd(tick)}</text>
            </g>
          )
        })}

        <path d={areaPath} className="fill-brand-600/10 dark:fill-brand-400/10" />
        <path d={linePath} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="stroke-brand-600 dark:stroke-brand-400" />

        {coords.map((c, i) => (
          <g key={c.period}>
            <circle cx={c.x} cy={c.y} r={4} strokeWidth={2} className="fill-brand-600 stroke-white dark:fill-brand-400 dark:stroke-slate-900" />
            <circle
              cx={c.x} cy={c.y} r={14} fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            />
            <text x={c.x} y={HEIGHT - 8} textAnchor="middle" className="fill-slate-400 text-[9px]">{c.period}</text>
          </g>
        ))}

        <text
          x={coords[coords.length - 1].x} y={coords[coords.length - 1].y - 10}
          textAnchor="end" className="fill-slate-700 text-[10px] font-semibold dark:fill-slate-200"
        >
          {fmtCompactVnd(coords[coords.length - 1].revenue)}
        </text>
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-slate-700"
          style={{ left: `${(coords[hover].x / WIDTH) * 100}%`, top: `${(coords[hover].y / HEIGHT) * 100}%`, marginTop: '-8px' }}
        >
          <p className="font-semibold">{coords[hover].period}</p>
          <p>{fmtFullVnd(coords[hover].revenue)}</p>
        </div>
      )}
    </div>
  )
}
