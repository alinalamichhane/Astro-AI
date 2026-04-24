import { Route } from 'react-router-dom'
import AstrologerRegister from '../pages/astrologer-portal/AstrologerRegister'
import AstrologerDashboard from '../pages/astrologer-portal/AstrologerDashboard'
import AstrologerProfile from '../pages/astrologer-portal/AstrologerProfile'
import AstrologerConsultations from '../pages/astrologer-portal/AstrologerConsultations'
import AstrologerAvailability from '../pages/astrologer-portal/AstrologerAvailability'
import PrivateRoute from './guards/PrivateRoute'
import AstrologerRoute from './guards/AstrologerRoute'

const astrologerPortalRoutes = (
  <>
    {/* Registration — any logged-in user can apply */}
    <Route
      path="/astrologer/register"
      element={<PrivateRoute><AstrologerRegister /></PrivateRoute>}
    />

    {/* Dashboard — astrologers only */}
    <Route
      path="/astrologer/dashboard"
      element={<AstrologerRoute><AstrologerDashboard /></AstrologerRoute>}
    />
    <Route
      path="/astrologer/profile"
      element={<AstrologerRoute skipProfileCheck><AstrologerProfile /></AstrologerRoute>}
    />
    <Route
      path="/astrologer/consultations"
      element={<AstrologerRoute><AstrologerConsultations /></AstrologerRoute>}
    />
    <Route
      path="/astrologer/availability"
      element={<AstrologerRoute><AstrologerAvailability /></AstrologerRoute>}
    />
  </>
)

export default astrologerPortalRoutes
