/**
 * Shared QueryClient instance.
 * Exported separately so Navbar (and any non-component code) can call
 * queryClient.clear() on logout without prop-drilling.
 */
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error?.response?.status
        if (status >= 400 && status < 500) return false
        return failureCount < 2
      },
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: () => {}, // individual handlers show their own toasts
    },
  },
})

export default queryClient
