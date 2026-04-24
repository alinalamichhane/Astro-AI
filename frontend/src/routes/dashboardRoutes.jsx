import { Route } from 'react-router-dom'
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/dashboard/Profile'
import Consultations from '../pages/dashboard/Consultations'
import UserOnlyRoute from './guards/UserOnlyRoute'

const dashboardRoutes = (
  <>
    <Route path="/dashboard" element={<UserOnlyRoute><Dashboard /></UserOnlyRoute>} />
    <Route path="/dashboard/profile" element={<UserOnlyRoute><Profile /></UserOnlyRoute>} />
    <Route path="/dashboard/consultations" element={<UserOnlyRoute><Consultations /></UserOnlyRoute>} />
  </>
)

export default dashboardRoutes
