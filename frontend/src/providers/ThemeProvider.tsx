import type { ReactNode } from 'react'
import { useEffect } from 'react'
import useThemeStore from '../store/themeStore'

interface ThemeProviderProps {
  children: ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  return <>{children}</>
}
