import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * Blocks astrologers from accessing user-only pages.
 * Redirects them to their portal instead.
 */
export default function UserOnlyRoute({ children }) {
  const { accessToken, user } = useAuthStore()
  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role === 'astrologer') return <Navigate to="/astrologer/dashboard" replace />
  return children
}
