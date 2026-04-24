import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import { getAstrologerProfile } from '../../api/astrologers'
import Spinner from '../../components/ui/Spinner'

/**
 * Allows access only to users with role='astrologer' AND profile_complete=true.
 *
 * Redirect logic:
 *   - Not logged in                      → /login
 *   - Logged in, not astrologer          → /astrologer/register
 *   - Astrologer, profile incomplete     → /astrologer/profile  (setup)
 *   - Astrologer, profile_complete=true  → render children
 *
 * skipProfileCheck=true is used on /astrologer/profile itself to avoid
 * an infinite redirect loop.
 */
export default function AstrologerRoute({ children, skipProfileCheck = false }) {
  const { accessToken, user } = useAuthStore()

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['astrologer-profile-check'],
    queryFn: () => getAstrologerProfile().then(r => r.data),
    enabled: !!accessToken && user?.role === 'astrologer' && !skipProfileCheck,
    retry: 1,
    staleTime: 0,          // always re-fetch on mount so we get fresh profile_complete
    gcTime: 0,             // don't cache between sessions
  })

  // Not logged in
  if (!accessToken) return <Navigate to="/login" replace />

  // Wrong role
  if (user?.role !== 'astrologer') return <Navigate to="/astrologer/register" replace />

  // Skip the profile check (used on the profile setup page itself)
  if (skipProfileCheck) return children

  // Still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1b2a]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Query errored — don't block, let them through and the page will handle it
  if (isError) return children

  // Profile incomplete → force setup
  if (!profile?.profile_complete) {
    return <Navigate to="/astrologer/profile" replace />
  }

  return children
}
