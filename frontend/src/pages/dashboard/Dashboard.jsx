import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, MessageCircle, Calendar, BookOpen, ShoppingBag, Zap, Edit, RefreshCw, Heart } from 'lucide-react'
import { getProfile } from '../../api/auth'
import { getBirthChart, getPersonalizedHoroscope, generateBirthChart } from '../../api/horoscope'
import { getMyConsultations } from '../../api/astrologers'
import { getMyEnrollments } from '../../api/courses'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import KundaliChart from '../../components/horoscope/KundaliChart'
import useAuthStore from '../../store/authStore'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useState } from 'react'

const ZODIAC_SYMBOLS = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [generating, setGenerating] = useState(false)
  const [chartModalOpen, setChartModalOpen] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then((r) => r.data),
  })

  const { data: birthChart } = useQuery({
    queryKey: ['birth-chart'],
    queryFn: () => getBirthChart().then((r) => r.data),
    retry: false,
  })

  const { data: horoscope } = useQuery({
    queryKey: ['personalized-horoscope'],
    queryFn: () => getPersonalizedHoroscope().then((r) => r.data),
    retry: false,
  })

  const { data: consultations } = useQuery({
    queryKey: ['my-consultations'],
    queryFn: () => getMyConsultations().then((r) => r.data),
  })

  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => getMyEnrollments().then((r) => r.data),
  })

  const currentUser = profile || user
  const recentConsultations = consultations?.results?.slice(0, 3) || consultations?.slice(0, 3) || []
  const recentEnrollments = enrollments?.results?.slice(0, 3) || enrollments?.slice(0, 3) || []

  const handleRegenerateChart = async () => {
    setGenerating(true)
    try {
      await generateBirthChart()
      queryClient.invalidateQueries({ queryKey: ['birth-chart'] })
      queryClient.invalidateQueries({ queryKey: ['kundali-matches'] })
      toast.success('Birth chart regenerated! Kundali matches updated. 🌟')
    } catch (err) {
      toastError(err, 'Failed to regenerate. Complete your profile first.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Welcome header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-serif">
              Welcome back, {currentUser?.first_name || 'Seeker'} 🌟
            </h1>
            <p className="text-gray-400 mt-1">Your cosmic dashboard</p>
          </div>
          <Link to="/dashboard/profile">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" /> Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="space-y-6">

            {/* Profile card */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2d5a8e] to-[#c9a84c] flex items-center justify-center text-white text-2xl font-bold">
                  {currentUser?.first_name?.[0] || currentUser?.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{currentUser?.first_name} {currentUser?.last_name}</h3>
                  <p className="text-sm text-gray-400">{currentUser?.email}</p>
                  {currentUser?.is_verified && <Badge color="gold">Verified</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 text-center">
                  <div className="text-2xl font-bold text-[#c9a84c]">{currentUser?.ai_tokens || 0}</div>
                  <div className="text-xs text-gray-400 mt-0.5">AI Tokens</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 text-center">
                  <div className="text-2xl font-bold text-white">{recentConsultations.length}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Consultations</div>
                </div>
              </div>

              <Link to="/plans" className="block mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  <Zap className="w-4 h-4" /> Get More Tokens
                </Button>
              </Link>
              <Link to="/dashboard/billing" className="block mt-2">
                <Button variant="ghost" size="sm" className="w-full text-gray-400">
                  View Billing & Plans
                </Button>
              </Link>
            </Card>

            {/* Birth Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#c9a84c]" /> Birth Chart
                </h3>
                {birthChart && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRegenerateChart}
                      disabled={generating}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#c9a84c] transition-colors disabled:opacity-50"
                      title="Regenerate chart from profile data"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                      {generating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                    <Link to="/birth-chart" className="text-xs text-[#c9a84c] hover:underline">
                      Full View
                    </Link>
                  </div>
                )}
              </div>

              {birthChart ? (
                <div className="space-y-3">
                  {/* Clickable chart — opens modal */}
                  <button
                    onClick={() => setChartModalOpen(true)}
                    className="w-full flex justify-center group relative"
                    title="Click to view full chart"
                  >
                    <KundaliChart
                      chartData={birthChart.chart_data}
                      ascendantSign={birthChart.ascendant}
                      size={260}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-xl">
                      <span className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-full">
                        Click to expand
                      </span>
                    </div>
                  </button>

                  {/* Key placements */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Sun',  value: birthChart.sun_sign },
                      { label: 'Moon', value: birthChart.moon_sign },
                      { label: 'Asc',  value: birthChart.ascendant },
                    ].map(({ label, value }) => value && (
                      <div key={label} className="text-center p-2 rounded-lg bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
                        <div className="text-xs font-semibold text-white mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Kundali Match shortcut */}
                  <Link to="/kundali-match" className="block">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#c9a84c]/5 border border-[#c9a84c]/20 hover:bg-[#c9a84c]/10 transition-colors group">
                      <Heart className="w-4 h-4 text-[#c9a84c]" />
                      <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                        Check Kundali Compatibility
                      </span>
                      <span className="ml-auto text-xs text-[#c9a84c]">→</span>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-gray-400">Complete your profile to generate your birth chart</p>
                  <div className="flex gap-2 justify-center">
                    <Link to="/dashboard/profile">
                      <Button size="sm" variant="outline">Complete Profile</Button>
                    </Link>
                    <Button size="sm" onClick={handleRegenerateChart} loading={generating}>
                      Generate Chart
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Middle column */}
          <div className="space-y-6">

            {/* Today's Horoscope */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#c9a84c]" /> Today's Horoscope
                </h3>
                <Link to="/horoscope" className="text-xs text-[#c9a84c] hover:underline">View all</Link>
              </div>
              {horoscope ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{ZODIAC_SYMBOLS[horoscope.zodiac_sign?.toLowerCase()]}</span>
                    <span className="text-sm font-medium text-white capitalize">{horoscope.zodiac_sign}</span>
                    <span className="ml-auto text-[#c9a84c] font-bold">{horoscope.rating}/10</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{horoscope.content}</p>
                  <Link to={`/horoscope?sign=${horoscope.zodiac_sign}`} className="block mt-3">
                    <Button size="sm" variant="ghost" className="w-full">Read Full Horoscope</Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400 mb-3">Complete your profile to get personalized horoscope</p>
                  <Link to="/horoscope"><Button size="sm" variant="outline">Browse Horoscopes</Button></Link>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <MessageCircle className="w-5 h-5" />, label: 'AI Chat',      path: '/chat',          color: 'text-blue-400' },
                  { icon: <Star className="w-5 h-5" />,          label: 'Astrologers',  path: '/astrologers',   color: 'text-[#c9a84c]' },
                  { icon: <ShoppingBag className="w-5 h-5" />,   label: 'Marketplace',  path: '/marketplace',   color: 'text-green-400' },
                  { icon: <BookOpen className="w-5 h-5" />,      label: 'Courses',      path: '/courses',       color: 'text-purple-400' },
                  { icon: <Heart className="w-5 h-5" />,         label: 'Kundali Match',path: '/kundali-match', color: 'text-pink-400' },
                  { icon: <Zap className="w-5 h-5" />,           label: 'Plans',        path: '/plans',         color: 'text-yellow-400' },
                ].map(({ icon, label, path, color }) => (
                  <Link
                    key={label}
                    to={path}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 hover:border-[#c9a84c]/30 transition-all group"
                  >
                    <div className={`${color} group-hover:scale-110 transition-transform`}>{icon}</div>
                    <span className="text-xs text-gray-300">{label}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Recent Consultations */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#c9a84c]" /> Consultations
                </h3>
                <Link to="/dashboard/consultations" className="text-xs text-[#c9a84c] hover:underline">View all</Link>
              </div>
              {recentConsultations.length > 0 ? (
                <div className="space-y-3">
                  {recentConsultations.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{c.astrologer_name}</span>
                        <Badge color={c.status === 'completed' ? 'green' : c.status === 'pending' ? 'gold' : c.status === 'cancelled' ? 'red' : 'blue'}>
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {format(new Date(c.scheduled_at), 'MMM d, yyyy · HH:mm')}
                      </div>
                    </div>
                  ))}
                  <Link to="/dashboard/consultations" className="block mt-2">
                    <Button size="sm" variant="ghost" className="w-full">View All Consultations</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400 mb-3">No consultations yet</p>
                  <Link to="/astrologers"><Button size="sm" variant="outline">Find Astrologers</Button></Link>
                </div>
              )}
            </Card>

            {/* My Courses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#c9a84c]" /> My Courses
                </h3>
                <Link to="/courses" className="text-xs text-[#c9a84c] hover:underline">Browse</Link>
              </div>
              {recentEnrollments.length > 0 ? (
                <div className="space-y-3">
                  {recentEnrollments.map((e) => (
                    <div key={e.id} className="p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                      <p className="text-sm font-medium text-white line-clamp-1">{e.course?.title}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{e.progress_percent}%</span>
                        </div>
                        <div className="h-1.5 bg-[#0d1b2a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2d5a8e] to-[#c9a84c] rounded-full transition-all"
                            style={{ width: `${e.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400 mb-3">No courses enrolled</p>
                  <Link to="/courses"><Button size="sm" variant="outline">Explore Courses</Button></Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* ── Birth Chart Modal ──────────────────────────────────────────── */}
      {chartModalOpen && birthChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setChartModalOpen(false)}
        >
          <div
            className="bg-[#0d1b2a] border border-[#2d5a8e]/40 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2d5a8e]/20 sticky top-0 bg-[#0d1b2a] z-10">
              <h2 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Star className="w-5 h-5 text-[#c9a84c]" /> Your Vedic Birth Chart (Kundali)
              </h2>
              <div className="flex items-center gap-3">
                <Link to="/birth-chart" className="text-xs text-[#c9a84c] hover:underline" onClick={() => setChartModalOpen(false)}>
                  Full Page →
                </Link>
                <button onClick={() => setChartModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Chart — takes 3/5 of the space */}
              <div className="md:col-span-3 flex flex-col items-center gap-4">
                <KundaliChart
                  chartData={birthChart.chart_data}
                  ascendantSign={birthChart.ascendant}
                  size={420}
                />
                {/* Key placements */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[
                    { label: 'Sun Sign',  value: birthChart.sun_sign },
                    { label: 'Moon Sign', value: birthChart.moon_sign },
                    { label: 'Ascendant', value: birthChart.ascendant },
                  ].map(({ label, value }) => value && (
                    <div key={label} className="text-center p-2.5 rounded-xl bg-[#1a2f4a]/60 border border-[#2d5a8e]/20">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{label}</div>
                      <div className="text-sm font-bold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planet descriptions — takes 2/5 of the space */}
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-sm font-semibold text-white mb-3">Planetary Positions</h3>
                {Object.entries(birthChart.chart_data || {}).map(([planet, data]) => {
                  if (!data?.sign) return null
                  const COLORS = {
                    Sun:'#f59e0b', Moon:'#94a3b8', Mars:'#ef4444', Mercury:'#22c55e',
                    Jupiter:'#f97316', Venus:'#ec4899', Saturn:'#8b5cf6',
                    Ascendant:'#c9a84c', Uranus:'#06b6d4', Neptune:'#3b82f6', Pluto:'#a855f7',
                  }
                  const SYMBOLS = {
                    Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃',
                    Venus:'♀', Saturn:'♄', Ascendant:'Asc', Uranus:'⛢', Neptune:'♆', Pluto:'♇',
                  }
                  const DESCS = {
                    Sun:'Soul, ego, vitality', Moon:'Mind, emotions, intuition',
                    Mars:'Energy, courage, drive', Mercury:'Intelligence, communication',
                    Jupiter:'Wisdom, luck, expansion', Venus:'Love, beauty, harmony',
                    Saturn:'Discipline, karma, lessons', Ascendant:'Personality, first impressions',
                    Uranus:'Innovation, sudden change', Neptune:'Dreams, spirituality',
                    Pluto:'Transformation, power',
                  }
                  const color = COLORS[planet] || '#c9a84c'
                  return (
                    <div key={planet} className="flex items-center gap-2 p-2 rounded-lg bg-[#0d1b2a]/60 border border-[#2d5a8e]/15 hover:border-[#2d5a8e]/40 transition-colors">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                        {SYMBOLS[planet] || planet[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-white">{planet}</span>
                          <span className="text-[10px] text-gray-400">in {data.sign}</span>
                        </div>
                        <p className="text-[9px] text-gray-500 truncate">{DESCS[planet] || ''}</p>
                      </div>
                      <span className="text-[9px] text-gray-600 flex-shrink-0">{data.degree?.toFixed(0)}°</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
