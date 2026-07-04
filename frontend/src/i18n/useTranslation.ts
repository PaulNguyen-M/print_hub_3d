import useLanguageStore from '../store/languageStore'
import { translate } from './translations'

/**
 * Hook dịch ngôn ngữ — dùng: const { t, lang } = useTranslation()
 * t('nav.marketplace') → trả về chuỗi theo ngôn ngữ hiện tại
 */
export function useTranslation() {
  const lang = useLanguageStore((s) => s.lang)
  const t = (key: string) => translate(key, lang)
  return { t, lang }
}
