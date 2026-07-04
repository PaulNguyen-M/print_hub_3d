import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient dùng chung toàn app.
 * Tách ra file riêng để store (auth) có thể clear cache khi login/logout.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
