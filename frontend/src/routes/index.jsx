import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/home/Home'

// Feature route groups
import authRoutes from './authRoutes'
import dashboardRoutes from './dashboardRoutes'
import astrologerRoutes from './astrologerRoutes'
import astrologerPortalRoutes from './astrologerPortalRoutes'
import horoscopeRoutes from './horoscopeRoutes'
import chatRoutes from './chatRoutes'
import marketplaceRoutes from './marketplaceRoutes'
import courseRoutes from './courseRoutes'
import planRoutes from './planRoutes'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {authRoutes}
      {dashboardRoutes}
      {astrologerRoutes}
      {astrologerPortalRoutes}
      {horoscopeRoutes}
      {chatRoutes}
      {marketplaceRoutes}
      {courseRoutes}
      {planRoutes}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
