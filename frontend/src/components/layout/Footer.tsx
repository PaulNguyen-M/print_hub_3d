import { Link } from 'react-router-dom'
import { Box, Code2, Globe, PlayCircle } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

const footerGroups = [
  {
    titleKey: 'footer.marketplace',
    links: [
      { label: { vi: 'Duyệt Sản Phẩm', en: 'Browse Products' }, to: '/marketplace' },
      { label: { vi: 'Mô Hình STL', en: 'STL Models' }, to: '/marketplace?type=digital' },
      { label: { vi: 'In 3D Vật Lý', en: 'Physical Prints' }, to: '/marketplace?type=physical' },
      { label: { vi: 'Xu Hướng', en: 'Trending' }, to: '/marketplace?sort=popular' },
    ],
  },
  {
    titleKey: 'footer.services',
    links: [
      { label: { vi: 'In 3D Tùy Chỉnh', en: 'Custom 3D Print' }, to: '/printing-service' },
      { label: { vi: 'Bảng Giá', en: 'Pricing' }, to: '/printing-service#pricing' },
      { label: { vi: 'Vật Liệu', en: 'Materials' }, to: '/printing-service#materials' },
      { label: { vi: 'Theo Dõi Đơn', en: 'Track Order' }, to: '/orders' },
    ],
  },
  {
    titleKey: 'footer.account',
    links: [
      { label: { vi: 'Đăng Ký', en: 'Sign Up' }, to: '/auth/register' },
      { label: { vi: 'Đăng Nhập', en: 'Login' }, to: '/auth/login' },
      { label: { vi: 'Dashboard', en: 'Dashboard' }, to: '/account' },
      { label: { vi: 'Creator Hub', en: 'Creator Hub' }, to: '/creator' },
    ],
  },
  {
    titleKey: 'footer.support',
    links: [
      { label: { vi: 'Hướng Dẫn', en: 'Guides' }, to: '#' },
      { label: { vi: 'FAQ', en: 'FAQ' }, to: '#' },
      { label: { vi: 'Liên Hệ', en: 'Contact' }, to: '#' },
      { label: { vi: 'Chính Sách', en: 'Policy' }, to: '#' },
    ],
  },
] as const

export default function Footer() {
  const { t, lang } = useTranslation()

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-glow">
                <Box size={18} className="text-white" />
              </div>
              <span className="text-gradient">Print Hub 3D</span>
            </Link>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="mt-4 flex gap-2">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 transition dark:border-slate-700 dark:hover:border-brand-500">
                <Globe size={16} />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 transition dark:border-slate-700 dark:hover:border-brand-500">
                <PlayCircle size={16} />
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 transition dark:border-slate-700 dark:hover:border-brand-500">
                <Code2 size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerGroups.map((group) => (
            <div key={group.titleKey}>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{t(group.titleKey)}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label.vi}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                    >
                      {link.label[lang]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row dark:border-slate-800">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Print Hub 3D
          </p>
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300">Điều Khoản</a>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300">Bảo Mật</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
