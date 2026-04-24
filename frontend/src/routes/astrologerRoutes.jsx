import { Route } from 'react-router-dom'
import Astrologers from '../pages/astrologers/Astrologers'
import AstrologerDetail from '../pages/astrologers/AstrologerDetail'

const astrologerRoutes = (
  <>
    <Route path="/astrologers" element={<Astrologers />} />
    <Route path="/astrologers/:id" element={<AstrologerDetail />} />
  </>
)

export default astrologerRoutes
