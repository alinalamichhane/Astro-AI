import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * Redirects unauthenticated users to /login.
 * Preserves the intended destination via `state.from`.
 */
export default function PrivateRoute({ children }) {
  const { accessToken } = useAuthStore()
  const location = useLocation()
  return accessToken
    ? children
    : <Navigate to="/login" state={{ from: location.pathname }} replace />
}
