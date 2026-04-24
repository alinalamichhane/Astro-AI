import { Route } from 'react-router-dom'
import Marketplace from '../pages/marketplace/Marketplace'
import ProductDetail from '../pages/marketplace/ProductDetail'
import Cart from '../pages/marketplace/Cart'
import Checkout from '../pages/marketplace/Checkout'
import MyOrders from '../pages/marketplace/MyOrders'
import PrivateRoute from './guards/PrivateRoute'

const marketplaceRoutes = (
  <>
    {/* Exact named routes MUST come before the dynamic :slug route */}
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/marketplace/cart" element={<Cart />} />
    <Route path="/marketplace/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
    <Route path="/marketplace/orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />

    {/* Dynamic product detail — must be last so it doesn't swallow the above */}
    <Route path="/marketplace/:slug" element={<ProductDetail />} />
  </>
)

export default marketplaceRoutes
