import { Route } from 'react-router-dom'
import Plans from '../pages/plans/Plans'
import PaymentCallback from '../pages/plans/PaymentCallback'
import Billing from '../pages/plans/Billing'
import PrivateRoute from './guards/PrivateRoute'

const planRoutes = (
  <>
    <Route path="/plans" element={<Plans />} />
    <Route path="/payment/callback/:gateway" element={<PaymentCallback />} />
    <Route path="/dashboard/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
  </>
)

export default planRoutes
