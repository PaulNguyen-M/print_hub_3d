import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../i18n/translations'

interface LanguageState {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

/** languageStore — Ngôn ngữ hiện tại (vi/en), lưu bền qua localStorage. */
const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'vi',
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((s) => ({ lang: s.lang === 'vi' ? 'en' : 'vi' })),
    }),
    { name: 'language-store' }
  )
)

export default useLanguageStore
