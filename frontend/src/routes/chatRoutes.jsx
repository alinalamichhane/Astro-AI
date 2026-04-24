import { Route } from 'react-router-dom'
import Chat from '../pages/chat/Chat'
import UserOnlyRoute from './guards/UserOnlyRoute'

const chatRoutes = (
  <Route path="/chat" element={<UserOnlyRoute><Chat /></UserOnlyRoute>} />
)

export default chatRoutes
