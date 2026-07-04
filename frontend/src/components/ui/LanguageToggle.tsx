import { motion } from 'framer-motion'
import useLanguageStore from '../../store/languageStore'

/**
 * Công tắc đổi ngôn ngữ VI ⇄ EN — dạng pill switch trượt mượt.
 */
export default function LanguageToggle() {
  const lang = useLanguageStore((s) => s.lang)
  const toggleLang = useLanguageStore((s) => s.toggleLang)

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label="Toggle language"
      title={lang === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}
      className="relative flex h-9 w-[68px] items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800"
    >
      {/* Knob trượt */}
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute z-0 h-8 w-8 rounded-full bg-brand-600 shadow-sm shadow-brand-600/30"
        style={{ left: lang === 'vi' ? 2 : 'calc(100% - 34px)' }}
      />
      {/* Nhãn VI */}
      <span
        className={`relative z-10 flex h-8 w-8 items-center justify-center text-xs font-bold transition-colors ${
          lang === 'vi' ? 'text-white' : 'text-slate-400'
        }`}
      >
        VI
      </span>
      {/* Nhãn EN */}
      <span
        className={`relative z-10 flex h-8 w-8 items-center justify-center text-xs font-bold transition-colors ${
          lang === 'en' ? 'text-white' : 'text-slate-400'
        }`}
      >
        EN
      </span>
    </button>
  )
}
