import { Route } from 'react-router-dom'
import Horoscope from '../pages/horoscope/Horoscope'
import BirthChart from '../pages/horoscope/BirthChart'
import KundaliMatch from '../pages/horoscope/KundaliMatch'

const horoscopeRoutes = (
  <>
    <Route path="/horoscope" element={<Horoscope />} />
    <Route path="/birth-chart" element={<BirthChart />} />
    <Route path="/kundali-match" element={<KundaliMatch />} />
  </>
)

export default horoscopeRoutes
