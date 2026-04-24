import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { getErrorMessage } from './utils/errorHandler'
import toast from 'react-hot-toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx client errors — they won't fix themselves
        const status = error?.response?.status
        if (status >= 400 && status < 500) return false
        return failureCount < 2
      },
      staleTime: 1000 * 60 * 5,   // 5 min
      refetchOnWindowFocus: false, // avoid surprise refetches
    },
    mutations: {
      onError: (error) => {
        // Global mutation error fallback — individual handlers can override
        const msg = getErrorMessage(error)
        toast.error(msg)
      },
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a2f4a',
              color: '#f8f6f2',
              border: '1px solid rgba(45,90,142,0.4)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#c9a84c', secondary: '#0d1b2a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
