import { AlertCircle, RefreshCw } from 'lucide-react'
import { getErrorMessage } from '../../utils/errorHandler'

/**
 * Drop-in error state for useQuery failures.
 *
 * Usage:
 *   const { data, isLoading, error, refetch } = useQuery(...)
 *   if (error) return <QueryError error={error} onRetry={refetch} />
 */
export default function QueryError({ error, onRetry, message }) {
  const msg = message || getErrorMessage(error, 'Failed to load data.')

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-gray-300 font-medium mb-1">Failed to load</p>
      <p className="text-gray-500 text-sm mb-5 max-w-xs">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a2f4a] border border-[#2d5a8e]/40 text-gray-300 hover:text-white hover:border-[#2d5a8e] text-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      )}
    </div>
  )
}
