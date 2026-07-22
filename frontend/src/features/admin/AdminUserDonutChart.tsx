import { useTranslation } from '../../i18n/useTranslation'

interface AdminUserDonutChartProps {
  distribution: Record<string, number>
}

const ROLE_META: Record<string, { labelKey: string; ring: string; dot: string }> = {
  BUYER:           { labelKey: 'admin.dash.roleBuyer',   ring: 'stroke-[#2a78d6] dark:stroke-[#3987e5]', dot: 'bg-[#2a78d6] dark:bg-[#3987e5]' },
  SELLER:          { labelKey: 'admin.dash.roleSeller',  ring: 'stroke-[#1baf7a] dark:stroke-[#199e70]', dot: 'bg-[#1baf7a] dark:bg-[#199e70]' },
  PRINTER_PARTNER: { labelKey: 'admin.dash.rolePrinter', ring: 'stroke-[#4a3aa7] dark:stroke-[#9085e9]', dot: 'bg-[#4a3aa7] dark:bg-[#9085e9]' },
  ADMIN:           { labelKey: 'admin.dash.roleAdmin2',  ring: 'stroke-[#eb6834] dark:stroke-[#d95926]', dot: 'bg-[#eb6834] dark:bg-[#d95926]' },
}
const ROLE_ORDER = ['BUYER', 'SELLER', 'PRINTER_PARTNER', 'ADMIN']

const SIZE = 180
const STROKE = 26
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS
const GAP = 3

/** AdminUserDonutChart — Biểu đồ tròn phân bố người dùng đang hoạt động theo vai trò. */
export default function AdminUserDonutChart({ distribution }: AdminUserDonutChartProps) {
  const { t } = useTranslation()
  const total = ROLE_ORDER.reduce((sum, r) => sum + (distribution?.[r] ?? 0), 0)

  if (!total) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">{t('admin.dash.noRevenue')}</div>
  }

  let cursor = 0
  const segments = ROLE_ORDER.map((role) => {
    const value = distribution[role] ?? 0
    const pct = value / total
    const dash = Math.max(pct * CIRC - GAP, 0)
    const seg = { role, value, pct, dash, offset: cursor }
    cursor += pct * CIRC
    return seg
  })

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-slate-100 dark:stroke-slate-800" />
          {segments.map((s) => (
            <circle
              key={s.role}
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeDasharray={`${s.dash} ${CIRC - s.dash}`}
              strokeDashoffset={-s.offset}
              className={ROLE_META[s.role].ring}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{total.toLocaleString('vi-VN')}</span>
          <span className="text-[11px] text-slate-400">{t('admin.dash.accounts')}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {segments.map((s) => (
          <div key={s.role} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ROLE_META[s.role].dot}`} />
            <span className="w-24 text-slate-600 dark:text-slate-300">{t(ROLE_META[s.role].labelKey)}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{Math.round(s.pct * 100)}%</span>
            <span className="text-xs text-slate-400">({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
