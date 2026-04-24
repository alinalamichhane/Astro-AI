import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * Redirects authenticated users to /dashboard.
 * Used for login/register pages.
 */
export default function GuestRoute({ children }) {
  const { accessToken } = useAuthStore()
  return !accessToken ? children : <Navigate to="/dashboard" replace />
}
