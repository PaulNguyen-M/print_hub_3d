import type { ReactNode } from 'react'
import { useEffect } from 'react'
import useThemeStore from '../store/themeStore'

interface ThemeProviderProps {
  children: ReactNode
}

/** ThemeProvider — Đồng bộ class 'dark' trên thẻ <html> theo chế độ sáng/tối trong store. */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  return <>{children}</>
}
